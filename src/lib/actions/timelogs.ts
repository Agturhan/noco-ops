'use server';

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export interface TimeLog {
    id: string;
    taskId: string;
    userId: string;
    user?: { name: string };
    stageLabel?: string;
    startedAt: string;
    endedAt?: string;
    durationMinutes?: number;
    isAuto: boolean;
}

// Start a timer for a task
export async function startTimeLog(taskId: string, userId: string, stageLabel?: string) {
    try {
        // Stop any currently running timer for this user to avoid overlaps/accidental multi-tasking
        await stopActiveTimer(userId);

        const { data, error } = await supabaseAdmin
            .from('TaskTimeLog')
            .insert({
                taskId,
                userId,
                startedAt: new Date().toISOString(),
                stageLabel,
                isAuto: false
            })
            .select()
            .single();

        if (error) throw error;
        revalidatePath('/dashboard');
        return { success: true, data };
    } catch (error) {
        console.error('Error starting timer:', error);
        return { success: false, error: 'Timer başlatılamadı.' };
    }
}

// Stop the active timer for a user
export async function stopActiveTimer(userId: string) {
    try {
        // Find active timer (where endedAt is null)
        const { data: activeLog } = await supabaseAdmin
            .from('TaskTimeLog')
            .select('*')
            .eq('userId', userId)
            .is('endedAt', null)
            .single();

        if (activeLog) {
            const endedAt = new Date();

            // Fix: Normalize startedAt to be treated as UTC
            const dateStr = activeLog.startedAt.endsWith('Z') || activeLog.startedAt.includes('+')
                ? activeLog.startedAt
                : activeLog.startedAt + 'Z';

            const startedAt = new Date(dateStr);

            // Calculate duration in minutes (Difference between two dates)
            const diffMs = endedAt.getTime() - startedAt.getTime();
            const durationMinutes = Math.max(1, Math.round(diffMs / 60000));

            const { error } = await supabaseAdmin
                .from('TaskTimeLog')
                .update({
                    endedAt: endedAt.toISOString(),
                    durationMinutes: durationMinutes
                })
                .eq('id', activeLog.id);

            if (error) throw error;
        }
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error stopping timer:', error);
        return { success: false, error: 'Timer durdurulamadı.' };
    }
}

// Manually log time
export async function logManualTime(taskId: string, userId: string, minutes: number, date: string, description?: string) {
    try {
        const startedAt = new Date(date);
        const endedAt = new Date(startedAt.getTime() + minutes * 60000);

        const { data, error } = await supabaseAdmin
            .from('TaskTimeLog')
            .insert({
                taskId,
                userId,
                startedAt: startedAt.toISOString(),
                endedAt: endedAt.toISOString(),
                durationMinutes: minutes,
                stageLabel: description || 'Manuel Giriş',
                isAuto: false
            })
            .select()
            .single();

        if (error) throw error;
        revalidatePath('/dashboard');
        return { success: true, data };
    } catch (error) {
        console.error('Error logging manual time:', error);
        return { success: false, error: 'Süre eklenemedi.' };
    }
}

// Get logs for a task
export async function getTaskLogs(taskId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('TaskTimeLog')
            .select(`
                *,
                user:User(name)
            `)
            .eq('taskId', taskId)
            .order('startedAt', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching logs:', error);
        return { success: false, data: [] };
    }
}

// Get active timer for user
export async function getActiveTimer(userId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('TaskTimeLog')
            .select('*')
            .eq('userId', userId)
            .is('endedAt', null)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // 116 = no rows found

        return { success: true, data };
    } catch (error) {
        return { success: false, data: null };
    }
}
