'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ===== RETAINER TYPES =====

interface RetainerCreate {
    clientId: string;
    name: string;
    monthlyHours: number;
    monthlyRate: number;
    startDate: string;
    endDate?: string;
}

interface HourLogCreate {
    retainerId: string;
    userId?: string;
    hours: number;
    description: string;
    date: string;
    projectId?: string;
}

// ===== GET RETAINERS =====

export async function getRetainers(clientId?: string) {
    let query = supabaseAdmin
        .from('Retainer')
        .select('*')
        .order('createdAt', { ascending: false });

    if (clientId) {
        query = query.eq('clientId', clientId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching retainers:', error);
        return []; // Return empty array instead of throwing
    }

    return data || [];
}

// ===== GET RETAINER BY ID =====

export async function getRetainerById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('Retainer')
        .select(`
            *,
            client:Client (
                id,
                name,
                email
            ),
            hourLogs:RetainerHourLog (
                *,
                user:User (
                    id,
                    name
                ),
                project:Project (
                    id,
                    name
                )
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching retainer:', error);
        return null;
    }

    return data;
}

// ===== CREATE RETAINER =====

export async function createRetainer(data: RetainerCreate) {
    const { data: retainer, error } = await supabaseAdmin
        .from('Retainer')
        .insert([{
            clientId: data.clientId,
            name: data.name,
            monthlyHours: data.monthlyHours,
            monthlyRate: data.monthlyRate,
            startDate: data.startDate,
            endDate: data.endDate || null,
            status: 'ACTIVE',
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating retainer:', error);
        throw new Error('Retainer oluşturulurken hata oluştu: ' + error.message + ' ' + (error.details || ''));
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'CREATE',
        entityType: 'RETAINER',
        entityId: retainer.id,
        details: { name: data.name, monthlyHours: data.monthlyHours },
    }]);

    revalidatePath('/dashboard/retainers');
    return retainer;
}

// ===== UPDATE RETAINER =====

export async function updateRetainer(id: string, data: Partial<RetainerCreate>) {
    const updateData: Partial<RetainerCreate> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.monthlyHours !== undefined) updateData.monthlyHours = data.monthlyHours;
    if (data.monthlyRate !== undefined) updateData.monthlyRate = data.monthlyRate;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;

    const { data: retainer, error } = await supabaseAdmin
        .from('Retainer')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating retainer:', error);
        throw new Error('Retainer güncellenirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'UPDATE',
        entityType: 'RETAINER',
        entityId: id,
        details: updateData,
    }]);

    revalidatePath('/dashboard/retainers');
    return retainer;
}

// ===== DELETE RETAINER =====

export async function deleteRetainer(id: string) {
    const { error } = await supabaseAdmin
        .from('Retainer')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting retainer:', error);
        throw new Error('Retainer silinirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'DELETE',
        entityType: 'RETAINER',
        entityId: id,
        details: {},
    }]);

    revalidatePath('/dashboard/retainers');
}

// ===== LOG HOURS =====

export async function logRetainerHours(data: HourLogCreate) {
    // First, check if we're exceeding monthly limit
    const retainer = await getRetainerById(data.retainerId);
    if (!retainer) {
        throw new Error('Retainer bulunamadı');
    }

    // Calculate current month's used hours
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usedHours = (retainer.hourLogs || [])
        .filter((log: { date?: string; hours?: number }) => log.date?.startsWith(currentMonth))
        .reduce((sum: number, log: { hours?: number }) => sum + (log.hours || 0), 0);

    const remainingHours = retainer.monthlyHours - usedHours;

    if (data.hours > remainingHours) {
        throw new Error(`Yeterli saat yok. Kalan: ${remainingHours} saat, İstenen: ${data.hours} saat`);
    }

    const { data: hourLog, error } = await supabaseAdmin
        .from('RetainerHourLog')
        .insert([{
            retainerId: data.retainerId,
            userId: data.userId || null,
            hours: data.hours,
            description: data.description,
            date: data.date,
            projectId: data.projectId || null,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error logging hours:', error);
        throw new Error('Saat kaydedilirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'LOG_HOURS',
        entityType: 'RETAINER',
        entityId: data.retainerId,
        details: { hours: data.hours, description: data.description },
    }]);

    revalidatePath('/dashboard/retainers');
    return hourLog;
}

// ===== DELETE HOUR LOG =====

export async function deleteRetainerLog(id: string) {
    const { error } = await supabaseAdmin
        .from('RetainerHourLog')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting hour log:', error);
        throw new Error('Kayıt silinirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'DELETE_LOG',
        entityType: 'RETAINER_LOG',
        entityId: id,
        details: {},
    }]);

    revalidatePath('/dashboard/retainers');
}

// ===== GET MONTHLY SUMMARY =====

export async function getRetainerMonthlySummary(retainerId: string, month?: string) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const retainer = await getRetainerById(retainerId);
    if (!retainer) {
        throw new Error('Retainer bulunamadı');
    }

    const monthlyLogs = (retainer.hourLogs || [])
        .filter((log: { date?: string }) => log.date?.startsWith(targetMonth));

    const usedHours = monthlyLogs.reduce((sum: number, log: { hours?: number }) => sum + (log.hours || 0), 0);
    const remainingHours = retainer.monthlyHours - usedHours;
    const usagePercentage = Math.round((usedHours / retainer.monthlyHours) * 100);

    return {
        retainerId,
        month: targetMonth,
        monthlyHours: retainer.monthlyHours,
        usedHours,
        remainingHours,
        usagePercentage,
        isOverLimit: usedHours > retainer.monthlyHours,
        logs: monthlyLogs,
    };
}

// ===== GET ALL RETAINER SUMMARIES =====

export async function getAllRetainerSummaries(month?: string) {
    const retainers = await getRetainers();
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    return retainers.map((retainer) => {
        const hourLogs = (retainer.hourLogs || []) as { date?: string, hours?: number }[];
        const monthlyLogs = hourLogs
            .filter(log => log.date?.startsWith(targetMonth));

        const usedHours = monthlyLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
        const remainingHours = retainer.monthlyHours - usedHours;

        return {
            id: retainer.id,
            name: retainer.name,
            clientName: retainer.client?.name || 'Bilinmeyen',
            monthlyHours: retainer.monthlyHours,
            usedHours,
            remainingHours,
            usagePercentage: Math.round((usedHours / retainer.monthlyHours) * 100),
            isWarning: remainingHours < retainer.monthlyHours * 0.2, // %20 altında uyarı
        };
    });
}
// ===== PAYMENTS =====

import { createIncome } from './accounting';

export async function createRetainerPayment(data: {
    retainerId: string;
    amount: number;
    paymentType: 'FULL' | 'PARTIAL';
    notes?: string;
}) {
    const retainer = await getRetainerById(data.retainerId);
    if (!retainer) throw new Error('Retainer not found');

    // Create Income record
    await createIncome({
        title: `Retainer Ödemesi - ${retainer.name}`,
        amount: data.amount,
        category: 'MARKETING', // Or specialized category
        source: retainer.client?.name || 'Retainer',
        notes: data.notes,
        date: new Date().toISOString()
    });

    // Audit Log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'PAYMENT',
        entityType: 'RETAINER',
        entityId: data.retainerId,
        details: { amount: data.amount, type: data.paymentType },
    }]);

    revalidatePath('/dashboard/retainers');
    return { success: true };
}
