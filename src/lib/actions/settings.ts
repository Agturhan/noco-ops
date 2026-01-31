'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ===== TİPLER =====
export interface SettingsData {
    companyName: string;
    timezone: string;
    language: string;
    currency: string;
    maxRevisions: number;
    paymentRequired: boolean;
    rawFilesProtected: boolean;
    retainerExpiry: boolean;
    waiverRequired: boolean;
    emailEnabled: boolean;
    paymentReminders: boolean;
    deadlineAlerts: boolean;
    daysBeforeDeadline: number;
    primaryColor: string;
    logoUrl: string;
}

// Varsayılan ayarlar
const defaultSettings: SettingsData = {
    companyName: 'NOCO Creative Digital Studios',
    timezone: 'Europe/Istanbul',
    language: 'tr',
    currency: 'TRY',
    maxRevisions: 3,
    paymentRequired: true,
    rawFilesProtected: true,
    retainerExpiry: true,
    waiverRequired: true,
    emailEnabled: true,
    paymentReminders: true,
    deadlineAlerts: true,
    daysBeforeDeadline: 5,
    primaryColor: '#329FF5',
    logoUrl: '/logo.svg',
};

// ===== AYARLARI GETİR =====
export async function getSettings(): Promise<SettingsData> {
    try {
        const settings = await prisma.settings.findUnique({
            where: { id: 'global' },
        });

        if (!settings) {
            // İlk kullanımda varsayılan ayarları oluştur
            const created = await prisma.settings.create({
                data: { id: 'global', ...defaultSettings },
            });
            return created as SettingsData;
        }

        return settings as SettingsData;
    } catch (error) {
        console.error('Ayarlar getirilemedi:', error);
        return defaultSettings;
    }
}

// ===== AYARLARI GÜNCELLE =====
export async function updateSettings(data: Partial<SettingsData>) {
    try {
        const settings = await prisma.settings.upsert({
            where: { id: 'global' },
            update: data,
            create: { id: 'global', ...defaultSettings, ...data },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_SETTINGS',
                entityType: 'Settings',
                entityId: 'global',
                details: { updatedFields: Object.keys(data) },
            },
        });

        revalidatePath('/dashboard/settings');
        return settings;
    } catch (error) {
        console.error('Ayarlar güncellenemedi:', error);
        throw new Error('Ayarlar kaydedilemedi');
    }
}

// ===== KULLANICILARI GETİR =====
export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        return users;
    } catch (error) {
        console.error('Kullanıcılar getirilemedi:', error);
        throw new Error('Kullanıcılar yüklenemedi');
    }
}

// ===== YENİ KULLANICI OLUŞTUR =====
export interface CreateUserInput {
    email: string;
    name: string;
    role: 'OWNER' | 'OPS' | 'STUDIO' | 'DIGITAL' | 'CLIENT';
    password?: string;
}

export async function createUser(data: CreateUserInput) {
    try {
        // Email kontrolü
        const existing = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            throw new Error('Bu e-posta adresi zaten kullanılıyor');
        }

        const user = await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                role: data.role,
                // Password hash gerçek uygulamada bcrypt ile yapılmalı
                passwordHash: data.password ? `hash_${data.password}` : null,
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE_USER',
                entityType: 'User',
                entityId: user.id,
                details: { email: data.email, role: data.role },
            },
        });

        revalidatePath('/dashboard/settings');
        return user;
    } catch (error: any) {
        console.error('Kullanıcı oluşturulamadı:', error);
        throw new Error(error.message || 'Kullanıcı oluşturulamadı');
    }
}

// ===== KULLANICI GÜNCELLE =====
export async function updateUser(userId: string, data: Partial<CreateUserInput>) {
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.email && { email: data.email }),
                ...(data.name && { name: data.name }),
                ...(data.role && { role: data.role }),
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_USER',
                entityType: 'User',
                entityId: userId,
                details: { updatedFields: Object.keys(data) },
            },
        });

        revalidatePath('/dashboard/settings');
        return user;
    } catch (error) {
        console.error('Kullanıcı güncellenemedi:', error);
        throw new Error('Kullanıcı güncellenemedi');
    }
}

// ===== KULLANICI SİL =====
export async function deleteUser(userId: string) {
    try {
        await prisma.user.delete({
            where: { id: userId },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE_USER',
                entityType: 'User',
                entityId: userId,
                details: { deletedAt: new Date().toISOString() },
            },
        });

        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error) {
        console.error('Kullanıcı silinemedi:', error);
        throw new Error('Kullanıcı silinemedi');
    }
}

// ===== KULLANICI DETAYI =====
export async function getUserById(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    } catch (error) {
        console.error('Kullanıcı detayı alınamadı:', error);
        return null;
    }
}
