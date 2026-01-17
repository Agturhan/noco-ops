'use server';

import prisma from '@/lib/prisma';

// ===== TİPLER =====
export interface AuditLogFilters {
    userId?: string;
    entityType?: string;
    action?: string;
    isOverride?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export interface AuditLogEntry {
    action: string;
    entityType: string;
    entityId: string;
    userId?: string;
    details?: Record<string, any>;
    isOverride?: boolean;
    ipAddress?: string;
}

// ===== AUDIT LOGLARI GETİR =====
export async function getAuditLogs(filters?: AuditLogFilters) {
    try {
        const where: any = {};

        if (filters?.userId) {
            where.userId = filters.userId;
        }

        if (filters?.entityType) {
            where.entityType = filters.entityType;
        }

        if (filters?.action) {
            where.action = filters.action;
        }

        if (filters?.isOverride !== undefined) {
            where.isOverride = filters.isOverride;
        }

        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 100,
            skip: filters?.offset || 0,
        });

        return logs;
    } catch (error) {
        console.error('Audit loglar getirilemedi:', error);
        throw new Error('Denetim kayıtları yüklenemedi');
    }
}

// ===== TOPLAM LOG SAYISI =====
export async function getAuditLogCount(filters?: AuditLogFilters) {
    try {
        const where: any = {};

        if (filters?.userId) where.userId = filters.userId;
        if (filters?.entityType) where.entityType = filters.entityType;
        if (filters?.action) where.action = filters.action;
        if (filters?.isOverride !== undefined) where.isOverride = filters.isOverride;

        const count = await prisma.auditLog.count({ where });
        return count;
    } catch (error) {
        console.error('Audit log sayısı alınamadı:', error);
        return 0;
    }
}

// ===== AUDIT LOG OLUŞTUR =====
export async function createAuditLog(entry: AuditLogEntry) {
    try {
        const log = await prisma.auditLog.create({
            data: {
                action: entry.action,
                entityType: entry.entityType,
                entityId: entry.entityId,
                userId: entry.userId,
                details: entry.details,
                isOverride: entry.isOverride || false,
                ipAddress: entry.ipAddress,
            },
        });

        return log;
    } catch (error) {
        console.error('Audit log oluşturulamadı:', error);
        // Log oluşturma hatası kritik değil, throw etmiyoruz
        return null;
    }
}

// ===== BENZERSİZ DEĞERLER =====
export async function getDistinctActions() {
    try {
        const actions = await prisma.auditLog.findMany({
            distinct: ['action'],
            select: { action: true },
            orderBy: { action: 'asc' },
        });
        return actions.map(a => a.action);
    } catch (error) {
        console.error('Aksiyon listesi alınamadı:', error);
        return [];
    }
}

export async function getDistinctEntityTypes() {
    try {
        const types = await prisma.auditLog.findMany({
            distinct: ['entityType'],
            select: { entityType: true },
            orderBy: { entityType: 'asc' },
        });
        return types.map(t => t.entityType);
    } catch (error) {
        console.error('Entity tipi listesi alınamadı:', error);
        return [];
    }
}

// ===== OVERRIDE LOGLARI =====
export async function getOverrideLogs(limit: number = 50) {
    try {
        const logs = await prisma.auditLog.findMany({
            where: { isOverride: true },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return logs;
    } catch (error) {
        console.error('Override logları alınamadı:', error);
        throw new Error('Override kayıtları yüklenemedi');
    }
}

// ===== ENTITY GEÇMİŞİ =====
export async function getEntityHistory(entityType: string, entityId: string) {
    try {
        const logs = await prisma.auditLog.findMany({
            where: {
                entityType,
                entityId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return logs;
    } catch (error) {
        console.error('Entity geçmişi alınamadı:', error);
        return [];
    }
}

// ===== KULLANICI AKTİVİTESİ =====
export async function getUserActivity(userId: string, limit: number = 50) {
    try {
        const logs = await prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return logs;
    } catch (error) {
        console.error('Kullanıcı aktivitesi alınamadı:', error);
        return [];
    }
}

// ===== İSTATİSTİKLER =====
export async function getAuditStats() {
    try {
        const [totalLogs, overrideLogs, todayLogs] = await Promise.all([
            prisma.auditLog.count(),
            prisma.auditLog.count({ where: { isOverride: true } }),
            prisma.auditLog.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
        ]);

        return {
            totalLogs,
            overrideLogs,
            todayLogs,
        };
    } catch (error) {
        console.error('Audit istatistikleri alınamadı:', error);
        return {
            totalLogs: 0,
            overrideLogs: 0,
            todayLogs: 0,
        };
    }
}
