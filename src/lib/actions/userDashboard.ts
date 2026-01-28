'use server';

import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';

// ===== KULLANICI BAZLI GÖREVLER =====

// Kullanıcının bugünkü görevleri
export async function getUserTodayTasks(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`[getUserTodayTasks] Called for userId: ${userId}`);
    console.log(`[getUserTodayTasks] Date filter: ${today.toISOString()}`);

    try {
        // Use Supabase directly. Fetch active + due today. Filter precise match in JS.
        // This avoids issues with array column types or 'or' syntax.
        const { data: tasks, error } = await supabaseAdmin
            .from('Task')
            .select('*')
            // Query: Status is active OR DueDate is today
            .or(`status.in.(TODO,IN_PROGRESS),dueDate.gte.${today.toISOString()}`)
            .order('priority', { ascending: false });

        if (tasks) console.log(`[getUserTodayTasks] Raw tasks fetched: ${tasks.length}`);
        if (error) console.log(`[getUserTodayTasks] Error:`, error);
        // Removed limit to ensure we process all potential candidates before filtering in JS
        // This is crucial because "limit" applies before our manual JS filtering.

        if (error) {
            console.error('Supabase getUserTodayTasks error:', error);
            return [];
        }

        // JS Filter
        const filteredTasks = tasks.filter(t => {
            // 1. Assignee Check
            const isAssigned =
                t.assigneeId === userId ||
                (Array.isArray(t.assigneeIds) && t.assigneeIds.includes(userId)) ||
                (typeof t.assigneeIds === 'string' && t.assigneeIds.includes(userId));

            if (!isAssigned) return false;

            // 2. Status check
            const isActive = ['TODO', 'IN_PROGRESS'].includes(t.status);

            // 3. Date check
            let isToday = false;
            if (t.dueDate) {
                const d = new Date(t.dueDate);
                isToday = d >= today && d < tomorrow;
            }

            // Return if (Active) OR (Due Today)
            return isToday || isActive;
        });

        // Sort: Due Dates first, then undated
        filteredTasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        console.log(`[getUserTodayTasks] Filtered tasks matching user: ${filteredTasks.length}`);

        return filteredTasks.slice(0, 10).map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || t.notes,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            projectId: t.projectId || t.brandName,
            assigneeId: t.assigneeId,
            assigneeIds: t.assigneeIds
        }));
    } catch (error) {
        console.error('Görevler alınamadı:', error);
        return [];
    }
}

// Kullanıcının bu haftaki deadline'ları
export async function getUserWeekDeadlines(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    try {
        const tasks = await prisma.task.findMany({
            where: {
                assigneeId: userId,
                dueDate: { gte: today, lte: weekEnd },
                status: { not: 'DONE' }
            },
            orderBy: { dueDate: 'asc' },
            take: 10
        });

        return tasks.map((t: any) => {
            const dueDate = new Date(t.dueDate);
            const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return {
                id: t.id,
                title: t.title,
                dueDate: t.dueDate?.toISOString(),
                daysLeft,
                priority: t.priority,
                projectId: t.projectId,
            };
        });
    } catch (error) {
        console.error('Deadline\'lar alınamadı:', error);
        return [];
    }
}

// Kullanıcının performans istatistikleri
export async function getUserPerformanceStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bugün
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Bu hafta başlangıcı (Pazartesi)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

    try {
        // Bugün tamamlanan görevler
        const todayCompleted = await prisma.task.count({
            where: {
                assigneeId: userId,
                status: 'DONE',
                updatedAt: { gte: today, lte: todayEnd }
            }
        });

        // Bu hafta tamamlanan görevler
        const weekCompleted = await prisma.task.count({
            where: {
                assigneeId: userId,
                status: 'DONE',
                updatedAt: { gte: weekStart }
            }
        });

        // Toplam bekleyen görevler
        const pendingTasks = await prisma.task.count({
            where: {
                assigneeId: userId,
                status: { in: ['TODO', 'IN_PROGRESS'] }
            }
        });

        return {
            todayCompleted,
            weekCompleted,
            pendingTasks,
            weeklyTarget: 15, // Haftalık hedef
        };
    } catch (error) {
        console.error('Performans istatistikleri alınamadı:', error);
        return { todayCompleted: 0, weekCompleted: 0, pendingTasks: 0, weeklyTarget: 15 };
    }
}

// ===== KULLANICI ROLLERİ =====

export type UserRole = 'OWNER' | 'OPS' | 'DIGITAL' | 'CLIENT' | 'ADMIN';

export interface UserWithRole {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

// Kullanıcı rolünü al
export async function getUserRole(userId: string): Promise<UserRole | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        return user?.role as UserRole || null;
    } catch (error) {
        console.error('Rol alınamadı:', error);
        return null;
    }
}

// Rol bazlı izin kontrolü
function hasPermission(userRole: UserRole, action: string): boolean {
    const permissions: Record<UserRole, string[]> = {
        OWNER: ['*'], // Tüm yetkiler
        ADMIN: ['create', 'read', 'update', 'delete', 'approve', 'manage_users'],
        OPS: ['create', 'read', 'update', 'approve', 'manage_projects'],
        DIGITAL: ['create', 'read', 'update'],
        CLIENT: ['read', 'request_revision', 'approve_deliverable'],
    };

    const rolePermissions = permissions[userRole] || [];
    return rolePermissions.includes('*') || rolePermissions.includes(action);
}

// ===== AKTİVİTE KAYDI =====

// activite kaydı oluştur (audit log wrapper)
export async function logUserActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>
) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                details: details || {},
                isOverride: false,
            }
        });
    } catch (error) {
        console.error('Aktivite kaydı oluşturulamadı:', error);
    }
}

// ===== DASHBOARD İÇİN VERİLER =====

// Kullanıcı için kişiselleştirilmiş dashboard verileri
export async function getUserDashboardData(userId: string) {
    try {
        const [todayTasks, weekDeadlines, performance, role] = await Promise.all([
            getUserTodayTasks(userId),
            getUserWeekDeadlines(userId),
            getUserPerformanceStats(userId),
            getUserRole(userId),
        ]);

        return {
            todayTasks,
            weekDeadlines,
            performance,
            role,
        };
    } catch (error) {
        console.error('Dashboard verileri alınamadı:', error);
        return {
            todayTasks: [],
            weekDeadlines: [],
            performance: { todayCompleted: 0, weekCompleted: 0, pendingTasks: 0, weeklyTarget: 15 },
            role: null,
        };
    }
}

// Son aktiviteler (kim ne yaptı)
export async function getRecentActivities(limit: number = 20) {
    try {
        const activities = await prisma.auditLog.findMany({
            include: {
                user: {
                    select: { id: true, name: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return activities.map(a => ({
            id: a.id,
            action: a.action,
            entityType: a.entityType,
            entityId: a.entityId,
            details: a.details as any,
            createdAt: a.createdAt.toISOString(),
            user: a.user ? {
                id: a.user.id,
                name: a.user.name,
                role: a.user.role,
            } : null,
        }));
    } catch (error) {
        console.error('Son aktiviteler alınamadı:', error);
        return [];
    }
}
