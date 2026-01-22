'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// ===== Task Types =====
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type ContentType = 'VIDEO' | 'POST' | 'FOTOGRAF' | 'REKLAM' | 'RAPOR' | 'TEKLIF' | 'WEB' | 'PODCAST';
export type SourceType = 'task' | 'content';

// Birleşik Task interface (Content dahil)
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    projectId?: string;
    assigneeId?: string;
    estimatedHours?: number;
    actualHours?: number;
    completedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    // Content alanları
    contentType?: ContentType;
    publishDate?: string;
    assigneeIds?: string[];
    clientId?: string;
    brandName?: string;
    notes?: string;
    sourceType?: SourceType;
}

// ===== Get Tasks =====
export async function getTasks(status?: TaskStatus, assigneeId?: string) {
    let query = supabaseAdmin
        .from('Task')
        .select('*')
        .order('createdAt', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }
    if (assigneeId) {
        query = query.eq('assigneeId', assigneeId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching tasks:', error);
        return []; // Return empty array instead of throwing
    }

    return data || [];
}

// ===== Get Task By ID =====
export async function getTaskById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('Task')
        .select(`
            *,
            project:Project (
                id,
                name,
                contract:Contract (
                    client:Client (
                        id,
                        name
                    )
                )
            ),
            assignee:User (
                id,
                name,
                email
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching task:', error);
        return null;
    }

    return data;
}

// ===== Create Task (veya Content) =====
export async function createTask(data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    projectId?: string;
    assigneeId?: string;
    dueDate?: string;
    estimatedHours?: number;
    // Content alanları
    contentType?: ContentType;
    publishDate?: string;
    assigneeIds?: string[];
    clientId?: string;
    brandName?: string;
    notes?: string;
    sourceType?: SourceType;
}) {
    const { data: task, error } = await supabaseAdmin
        .from('Task')
        .insert([{
            title: data.title,
            description: data.description || null,
            status: data.status || 'TODO',
            priority: data.priority || 'NORMAL',
            projectId: data.projectId || null,
            assigneeId: data.assigneeId || null,
            dueDate: data.dueDate || null,
            estimatedHours: data.estimatedHours || null,
            // Content alanları
            contentType: data.contentType || null,
            publishDate: data.publishDate || null,
            assigneeIds: data.assigneeIds || [],
            clientId: data.clientId || null,
            brandName: data.brandName || null,
            notes: data.notes || null,
            sourceType: data.sourceType || 'task',
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating task:', error);
        throw new Error('Görev oluşturulurken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'CREATE',
        entityType: 'TASK',
        entityId: task.id,
        details: { title: data.title },
    }]);

    revalidatePath('/dashboard/tasks');
    return task;
}

// ===== Update Task =====
export async function updateTask(id: string, data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    projectId?: string | null;
    assigneeId?: string | null;
    assigneeIds?: string[] | null;
    dueDate?: string | null;
    estimatedHours?: number | null;
    actualHours?: number | null;
    completedAt?: string | null;
    // Content fields
    contentType?: ContentType | null;
    publishDate?: string | null;
    clientId?: string | null;
    brandName?: string | null;
    notes?: string | null;
}) {
    const updateData: Record<string, any> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.assigneeIds !== undefined) updateData.assigneeIds = data.assigneeIds;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
    if (data.actualHours !== undefined) updateData.actualHours = data.actualHours;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
    // Content fields
    if (data.contentType !== undefined) updateData.contentType = data.contentType;
    if (data.publishDate !== undefined) updateData.publishDate = data.publishDate;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.brandName !== undefined) updateData.brandName = data.brandName;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Auto-set completedAt when status changes to DONE
    if (data.status === 'DONE' && !data.completedAt) {
        updateData.completedAt = new Date().toISOString();
    }

    const { data: task, error } = await supabaseAdmin
        .from('Task')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating task:', error);
        throw new Error('Görev güncellenirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'UPDATE',
        entityType: 'TASK',
        entityId: id,
        details: updateData,
    }]);

    revalidatePath('/dashboard/tasks');
    return task;
}

// ===== Delete Task =====
export async function deleteTask(id: string) {
    const { error } = await supabaseAdmin
        .from('Task')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting task:', error);
        throw new Error('Görev silinirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'DELETE',
        entityType: 'TASK',
        entityId: id,
        details: {},
    }]);

    revalidatePath('/dashboard/tasks');
}

// ===== Update Task Status (Quick action) =====
export async function updateTaskStatus(id: string, status: TaskStatus) {
    return updateTask(id, { status });
}

// ===== Get Tasks by Project =====
export async function getTasksByProject(projectId: string) {
    const { data, error } = await supabaseAdmin
        .from('Task')
        .select(`
            *,
            assignee:User (
                id,
                name
            )
        `)
        .eq('projectId', projectId)
        .order('priority', { ascending: false });

    if (error) {
        console.error('Error fetching project tasks:', error);
        throw new Error('Proje görevleri yüklenirken hata oluştu');
    }

    return data || [];
}

// ===== Toggle Task Status (DONE <-> TODO) =====
export async function toggleTaskStatus(id: string, userId?: string) {
    // Mevcut görevi al
    const { data: task, error: fetchError } = await supabaseAdmin
        .from('Task')
        .select('id, title, status')
        .eq('id', id)
        .single();

    if (fetchError || !task) {
        console.error('Error fetching task:', fetchError);
        throw new Error('Görev bulunamadı');
    }

    const oldStatus = task.status;
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    const completedAt = newStatus === 'DONE' ? new Date().toISOString() : null;

    // Durumu güncelle
    const { data: updated, error: updateError } = await supabaseAdmin
        .from('Task')
        .update({
            status: newStatus,
            completedAt
        })
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        console.error('Error toggling task:', updateError);
        throw new Error('Görev güncellenirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: newStatus === 'DONE' ? 'TASK_COMPLETED' : 'TASK_REOPENED',
        entityType: 'TASK',
        entityId: id,
        userId: userId || null,
        details: {
            title: task.title,
            oldStatus,
            newStatus,
            completedAt
        },
    }]);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/tasks');

    return {
        success: true,
        task: updated,
        completed: newStatus === 'DONE'
    };
}

// ===== Get User's Today Tasks =====
export async function getUserTodayTasks(userId: string) {
    const client = supabaseAdmin;

    console.log('[DEBUG] Querying SIMPLE tasks...');

    // SIMPLE QUERY - No joins, No filters
    const { data, error } = await client
        .from('Task')
        .select('id, title, description, status, priority, dueDate, projectId, assigneeId, assigneeIds')
        .order('status', { ascending: false })
        .limit(100);

    if (error) {
        console.error("FATAL DB ERROR in getUserTodayTasks:", error);
        return [];
    }

    // DONE olanları sona koy
    const sortedData = (data || []).sort((a: any, b: any) => {
        if (a.status === 'DONE' && b.status !== 'DONE') return 1;
        if (a.status !== 'DONE' && b.status === 'DONE') return -1;
        return 0;
    });

    // Map standard data
    return sortedData.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        projectId: t.projectId,
        assigneeId: t.assigneeId,
        assigneeIds: t.assigneeIds || (t.assigneeId ? [t.assigneeId] : []),
        brand: 'Genel (Simple)', // Placeholder
        completed: t.status === 'DONE',
    }));
}

// ===== Get User's Week Deadlines =====
export async function getUserWeekDeadlines(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Tüm görevleri getir (kullanıcı filtresi olmadan - dashboard'da hepsini göster)
    const { data, error } = await supabaseAdmin
        .from('Task')
        .select(`
            id, 
            title, 
            dueDate,
            priority,
            assigneeId,
            assigneeIds,
            brandName,
            project:Project (
                name,
                contract:Contract (
                    client:Client (
                        name
                    )
                )
            )
        `)
        .neq('status', 'DONE')
        .not('dueDate', 'is', null)
        .gte('dueDate', today.toISOString().split('T')[0])
        .lte('dueDate', weekEnd.toISOString().split('T')[0])
        .order('dueDate', { ascending: true })
        .limit(10);

    if (error) {
        console.error('Error fetching week deadlines:', error);
        return [];
    }

    return (data || []).map((t: any) => {
        const dueDate = new Date(t.dueDate);
        const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
            id: t.id,
            title: t.title,
            date: dueDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
            daysLeft,
            priority: t.priority,
            brand: t.brandName || t.project?.name || t.project?.contract?.client?.name || 'Genel',
            assigneeIds: t.assigneeIds || (t.assigneeId ? [t.assigneeId] : [])
        };
    });
}
