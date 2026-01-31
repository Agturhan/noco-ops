'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { notifyRevisionRequested } from './notifications';

// ===== CLIENT DASHBOARD VERİLERİ =====
export async function getClientDashboard(clientId: string) {
    try {
        // Müşteri bilgileri
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            select: {
                id: true,
                name: true,
                company: true,
                email: true,
            },
        });

        if (!client) {
            throw new Error('Müşteri bulunamadı');
        }

        // Müşterinin projeleri
        const contracts = await prisma.contract.findMany({
            where: { clientId },
            include: {
                projects: {
                    include: {
                        deliverables: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                            },
                        },
                        invoices: {
                            select: {
                                id: true,
                                amount: true,
                                status: true,
                                dueDate: true,
                                paidAt: true,
                            },
                        },
                    },
                },
            },
        });

        // Projeleri düzleştir
        const projects = contracts.flatMap(c => c.projects);

        // Bekleyen onaylar
        const pendingApprovals = projects.flatMap(p =>
            p.deliverables.filter(d => d.status === 'IN_REVIEW')
        );

        // Bekleyen faturalar
        const pendingInvoices = projects.flatMap(p =>
            p.invoices.filter(i => i.status !== 'PAID')
        );

        return {
            client,
            projects,
            stats: {
                totalProjects: projects.length,
                activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
                pendingApprovals: pendingApprovals.length,
                pendingInvoices: pendingInvoices.length,
                totalPendingAmount: pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0),
            },
        };
    } catch (error) {
        console.error('Client dashboard verisi alınamadı:', error);
        throw new Error('Dashboard yüklenemedi');
    }
}

// ===== MÜŞTERİ PROJELERİ =====
export async function getClientProjects(clientId: string) {
    try {
        const contracts = await prisma.contract.findMany({
            where: { clientId },
            include: {
                projects: {
                    include: {
                        deliverables: {
                            include: {
                                assets: {
                                    where: { isProtected: false }, // Sadece korumasız dosyalar
                                    select: {
                                        id: true,
                                        name: true,
                                        fileUrl: true,
                                        createdAt: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return contracts.flatMap(c => c.projects.map(p => ({
            ...p,
            contractName: c.name,
            maxRevisions: c.maxRevisions,
        })));
    } catch (error) {
        console.error('Client projeleri alınamadı:', error);
        throw new Error('Projeler yüklenemedi');
    }
}

// ===== MÜŞTERİ FATURALARI =====
export async function getClientInvoices(clientId: string) {
    try {
        const contracts = await prisma.contract.findMany({
            where: { clientId },
            include: {
                projects: {
                    include: {
                        invoices: true,
                    },
                },
            },
        });

        const invoices = contracts.flatMap(c =>
            c.projects.flatMap(p =>
                p.invoices.map(i => ({
                    ...i,
                    projectName: p.name,
                }))
            )
        );

        return invoices;
    } catch (error) {
        console.error('Client faturaları alınamadı:', error);
        throw new Error('Faturalar yüklenemedi');
    }
}

// ===== TESLİMAT ONAYLA =====
export async function approveDeliverable(deliverableId: string, clientId: string) {
    try {
        // Teslimatı kontrol et
        const deliverable = await prisma.deliverable.findUnique({
            where: { id: deliverableId },
            include: {
                project: {
                    include: {
                        contract: true,
                    },
                },
            },
        });

        if (!deliverable) {
            throw new Error('Teslimat bulunamadı');
        }

        // Müşteri yetkisi kontrolü
        if (deliverable.project.contract.clientId !== clientId) {
            throw new Error('Bu işlem için yetkiniz yok');
        }

        // Sadece IN_REVIEW durumundakiler onaylanabilir
        if (deliverable.status !== 'IN_REVIEW') {
            throw new Error('Bu teslimat onaylanamaz, durumu: ' + deliverable.status);
        }

        // Durumu güncelle
        const updated = await prisma.deliverable.update({
            where: { id: deliverableId },
            data: { status: 'APPROVED' },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'APPROVE',
                entityType: 'Deliverable',
                entityId: deliverableId,
                details: { status: 'APPROVED', approvedBy: clientId },
            },
        });

        revalidatePath('/client-portal');
        revalidatePath('/dashboard/deliverables');

        return updated;
    } catch (error) {
        console.error('Teslimat onaylanamadı:', error);
        throw error;
    }
}

// ===== REVİZYON TALEP ET =====
export async function requestRevision(
    deliverableId: string,
    clientId: string,
    feedback: string
) {
    try {
        // Teslimatı kontrol et
        const deliverable = await prisma.deliverable.findUnique({
            where: { id: deliverableId },
            include: {
                project: {
                    include: {
                        contract: true,
                        assignee: true,
                    },
                },
            },
        });

        if (!deliverable) {
            throw new Error('Teslimat bulunamadı');
        }

        // Müşteri yetkisi kontrolü
        if (deliverable.project.contract.clientId !== clientId) {
            throw new Error('Bu işlem için yetkiniz yok');
        }

        // Sadece IN_REVIEW durumundakiler için revizyon talep edilebilir
        if (deliverable.status !== 'IN_REVIEW') {
            throw new Error('Bu teslimat için revizyon talep edilemez');
        }

        // Revizyon limiti kontrolü
        const maxRevisions = deliverable.project.contract.maxRevisions;
        if (deliverable.revisionCount >= maxRevisions) {
            throw new Error(`Maksimum revizyon sayısına (${maxRevisions}) ulaşıldı`);
        }

        // Revizyon döngüsü oluştur
        await prisma.revisionCycle.create({
            data: {
                deliverableId,
                feedback,
                status: 'OPEN',
            },
        });

        // Teslimatı güncelle
        const updated = await prisma.deliverable.update({
            where: { id: deliverableId },
            data: {
                status: 'IN_PROGRESS',
                revisionCount: { increment: 1 },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'REQUEST_REVISION',
                entityType: 'Deliverable',
                entityId: deliverableId,
                details: {
                    feedback,
                    revisionNumber: deliverable.revisionCount + 1,
                    requestedBy: clientId
                },
            },
        });

        // Proje assignee'sine bildirim gönder
        if (deliverable.project.assigneeId) {
            await notifyRevisionRequested(
                deliverable.project.assigneeId,
                deliverable.name,
                deliverableId,
                feedback
            );
        }

        revalidatePath('/client-portal');
        revalidatePath('/dashboard/deliverables');

        return updated;
    } catch (error) {
        console.error('Revizyon talebi başarısız:', error);
        throw error;
    }
}

// ===== MÜŞTERİ DOSYALARI =====
export async function getClientAssets(clientId: string) {
    try {
        const contracts = await prisma.contract.findMany({
            where: { clientId },
            include: {
                projects: {
                    include: {
                        deliverables: {
                            include: {
                                assets: {
                                    where: { isProtected: false },
                                    orderBy: { createdAt: 'desc' },
                                },
                            },
                        },
                    },
                },
            },
        });

        const assets = contracts.flatMap(c =>
            c.projects.flatMap(p =>
                p.deliverables.flatMap(d =>
                    d.assets.map(a => ({
                        ...a,
                        projectName: p.name,
                        deliverableName: d.name,
                    }))
                )
            )
        );

        return assets;
    } catch (error) {
        console.error('Client dosyaları alınamadı:', error);
        throw new Error('Dosyalar yüklenemedi');
    }
}

// ===== MÜŞTERİ BİLDİRİMLERİ =====
export async function getClientNotifications(clientId: string) {
    try {
        // Client'ın user ID'sini al (Client tablosunda userId yoksa clientId kullan)
        const notifications = await prisma.notification.findMany({
            where: { userId: clientId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        return notifications;
    } catch (error) {
        console.error('Client bildirimleri alınamadı:', error);
        return [];
    }
}
