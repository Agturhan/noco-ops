'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ===== TİPLER =====
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PAYMENT' | 'DEADLINE' | 'REVISION' | 'APPROVAL';

export interface NotificationInput {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    actionUrl?: string;
    entityType?: string;
    entityId?: string;
    entityName?: string;
}

export interface NotificationFilters {
    unreadOnly?: boolean;
    type?: NotificationType;
    limit?: number;
}

// ===== BİLDİRİMLERİ GETİR =====
export async function getNotifications(userId: string, filters?: NotificationFilters) {
    try {
        const where: any = { userId };

        if (filters?.unreadOnly) {
            where.read = false;
        }

        if (filters?.type) {
            where.type = filters.type;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 50,
        });

        return notifications;
    } catch (error) {
        console.error('Bildirimler getirilirken hata:', error);
        throw new Error('Bildirimler yüklenemedi');
    }
}

// ===== OKUNMAMIŞ BİLDİRİM SAYISI =====
export async function getUnreadCount(userId: string) {
    try {
        const count = await prisma.notification.count({
            where: { userId, read: false },
        });
        return count;
    } catch (error) {
        console.error('Okunmamış bildirim sayısı alınamadı:', error);
        return 0;
    }
}

// ===== TEK BİLDİRİMİ OKUNDU İŞARETLE =====
export async function markAsRead(notificationId: string) {
    try {
        const notification = await prisma.notification.update({
            where: { id: notificationId },
            data: {
                read: true,
                readAt: new Date()
            },
        });

        revalidatePath('/dashboard/notifications');
        return notification;
    } catch (error) {
        console.error('Bildirim okundu işaretlenemedi:', error);
        throw new Error('İşlem başarısız');
    }
}

// ===== TÜM BİLDİRİMLERİ OKUNDU İŞARETLE =====
export async function markAllAsRead(userId: string) {
    try {
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: {
                read: true,
                readAt: new Date()
            },
        });

        revalidatePath('/dashboard/notifications');
        return { success: true };
    } catch (error) {
        console.error('Tüm bildirimler okundu işaretlenemedi:', error);
        throw new Error('İşlem başarısız');
    }
}

// ===== YENİ BİLDİRİM OLUŞTUR =====
export async function createNotification(data: NotificationInput) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type || 'INFO',
                actionUrl: data.actionUrl,
                entityType: data.entityType,
                entityId: data.entityId,
                entityName: data.entityName,
            },
        });

        revalidatePath('/dashboard/notifications');
        return notification;
    } catch (error) {
        console.error('Bildirim oluşturulamadı:', error);
        throw new Error('Bildirim oluşturulamadı');
    }
}

// ===== BİLDİRİM SİL =====
export async function deleteNotification(notificationId: string) {
    try {
        await prisma.notification.delete({
            where: { id: notificationId },
        });

        revalidatePath('/dashboard/notifications');
        return { success: true };
    } catch (error) {
        console.error('Bildirim silinemedi:', error);
        throw new Error('Bildirim silinemedi');
    }
}

// ===== ESKİ BİLDİRİMLERİ TEMİZLE (30 gün) =====
export async function cleanOldNotifications(userId: string, daysOld: number = 30) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await prisma.notification.deleteMany({
            where: {
                userId,
                read: true,
                createdAt: { lt: cutoffDate },
            },
        });

        return { deleted: result.count };
    } catch (error) {
        console.error('Eski bildirimler temizlenemedi:', error);
        throw new Error('Temizleme başarısız');
    }
}

// ===== TOPLU BİLDİRİM OLUŞTUR (Birden fazla kullanıcıya) =====
export async function createBulkNotifications(
    userIds: string[],
    baseData: Omit<NotificationInput, 'userId'>
) {
    try {
        const notifications = userIds.map(userId => ({
            userId,
            title: baseData.title,
            message: baseData.message,
            type: baseData.type || 'INFO',
            actionUrl: baseData.actionUrl,
            entityType: baseData.entityType,
            entityId: baseData.entityId,
            entityName: baseData.entityName,
        }));

        await prisma.notification.createMany({
            data: notifications,
        });

        revalidatePath('/dashboard/notifications');
        return { success: true, count: notifications.length };
    } catch (error) {
        console.error('Toplu bildirim oluşturulamadı:', error);
        throw new Error('Toplu bildirim başarısız');
    }
}

// ===== BİLDİRİM TETİKLEYİCİLER (Diğer modüllerden çağrılacak) =====

// Ödeme alındığında
export async function notifyPaymentReceived(
    userId: string,
    invoiceNumber: string,
    amount: string
) {
    return createNotification({
        userId,
        title: '💰 Ödeme Alındı',
        message: `${invoiceNumber} numaralı fatura için ${amount} tutarında ödeme alındı.`,
        type: 'PAYMENT',
        entityType: 'Invoice',
        entityId: invoiceNumber,
        entityName: invoiceNumber,
        actionUrl: '/dashboard/invoices',
    });
}

// Revizyon talep edildiğinde
export async function notifyRevisionRequested(
    userId: string,
    deliverableName: string,
    deliverableId: string,
    feedback: string
) {
    return createNotification({
        userId,
        title: '🔄 Revizyon Talebi',
        message: `${deliverableName} için revizyon talep edildi: ${feedback.substring(0, 100)}...`,
        type: 'REVISION',
        entityType: 'Deliverable',
        entityId: deliverableId,
        entityName: deliverableName,
        actionUrl: `/dashboard/deliverables`,
    });
}

// Deadline yaklaşıyorsa
export async function notifyDeadlineApproaching(
    userId: string,
    deliverableName: string,
    deliverableId: string,
    daysRemaining: number
) {
    return createNotification({
        userId,
        title: '⏰ Yaklaşan Son Tarih',
        message: `${deliverableName} için son tarih ${daysRemaining} gün içinde.`,
        type: 'DEADLINE',
        entityType: 'Deliverable',
        entityId: deliverableId,
        entityName: deliverableName,
        actionUrl: `/dashboard/deliverables`,
    });
}

// Onay bekliyor
export async function notifyApprovalNeeded(
    userId: string,
    deliverableName: string,
    deliverableId: string
) {
    return createNotification({
        userId,
        title: '👀 Onay Bekliyor',
        message: `${deliverableName} teslimatı onayınızı bekliyor.`,
        type: 'APPROVAL',
        entityType: 'Deliverable',
        entityId: deliverableId,
        entityName: deliverableName,
        actionUrl: `/client-portal`,
    });
}
