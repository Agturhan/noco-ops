'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export interface AuditLogEntry {
    id: string;
    userId: string | null;
    user?: {
        name: string;
        email: string;
        image?: string;
    };
    action: string; // CREATE, UPDATE, DELETE, VIEW, LOGIN
    entityType: string; // Brand, User, Project, Page
    entityId: string;
    entityName?: string;
    details?: any;
    ipAddress?: string;
    createdAt: string;
}

export async function getAuditLogs(limit = 50) {
    try {
        const { data, error } = await supabaseAdmin
            .from('AuditLog')
            .select(`
                *,
                user:User(name, email)
            `)
            .order('createdAt', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('getAuditLogs error:', error);
            return [];
        }

        return data.map((log: any) => ({
            ...log,
            user: log.user || { name: 'Unknown System', email: '-' }
        })) as AuditLogEntry[];
    } catch (error) {
        console.error('getAuditLogs error:', error);
        return [];
    }
}

export async function logAction(
    action: string,
    entityType: string,
    entityId: string,
    details?: any,
    entityName?: string
) {
    try {
        // In a real auth setup, we'd get the user from the session
        // For now, we might mock it or try to extract from headers/cookies if available
        // Or pass userId explicitly if key actions are protected

        // Mock User for now since we don't have full auth context in this turn
        const userId = 'user-studio'; // Fatih Ustaosmanoğlu

        const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1';

        const { error } = await supabaseAdmin
            .from('AuditLog')
            .insert([{
                userId,
                action,
                entityType,
                entityId,
                details,
                entityName: entityName || entityId,
                ipAddress: ip
            }]);

        if (error) {
            console.error('logAction error:', error);
        }

        // Don't revalidate everything on every log to avoid perf issues, 
        // but revalidate audit page if needed.
        // Skip for VIEW actions to prevent infinite loading/spinner on client
        if (action !== 'VIEW') {
            revalidatePath('/dashboard/audit-log');
        }
    } catch (error) {
        console.error('logAction error:', error);
    }
}
