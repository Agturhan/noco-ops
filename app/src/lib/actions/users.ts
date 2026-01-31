
'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/lib/types/auth';

export type { UserRole } from '@/lib/types/auth';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    notes?: string;
    createdAt: string;
}

export async function getUsers() {
    const { data, error } = await supabaseAdmin
        .from('User')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    return data as User[];
}

export async function getActiveTeamMembers() {
    const { data, error } = await supabaseAdmin
        .from('User')
        .select('*')
        .neq('role', 'CLIENT')
        .order('name');

    if (error) {
        console.error('Error fetching team members:', error);
        return [];
    }

    return data as User[];
}

export async function getUserById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('User')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }

    return data as User;
}

export async function updateUserDetails(id: string, data: { phone?: string; notes?: string; role?: UserRole }) {
    try {
        const { error } = await supabaseAdmin
            .from('User')
            .update(data)
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/dashboard/system/users');
        return true;
    } catch (error) {
        console.error('Error updating user details:', error);
        return false;
    }
}

export async function createUser(data: { name: string; email: string; role: UserRole; password?: string; phone?: string }) {
    try {
        // 1. Create Auth User (if password provided)
        let authId = null;
        if (data.password) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: data.email,
                password: data.password,
                email_confirm: true,
                user_metadata: { name: data.name, role: data.role }
            });

            if (authError) throw authError;
            authId = authData.user.id;
        }

        // 2. Create DB User Record
        const userPayload = {
            name: data.name,
            email: data.email,
            role: data.role,
            phone: data.phone,
            createdAt: new Date().toISOString(),
            ...(authId ? { id: authId } : {})
        };

        const { error: dbError } = await supabaseAdmin
            .from('User')
            .insert(userPayload);

        if (dbError) {
            // Rollback auth user if DB fails
            if (authId) await supabaseAdmin.auth.admin.deleteUser(authId);
            throw dbError;
        }

        revalidatePath('/dashboard/system/users');
        return { success: true };
    } catch (error) {
        console.error('Create user error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function deleteUser(id: string) {
    try {
        // 1. Delete from Auth (try catch, might not exist in auth)
        try {
            await supabaseAdmin.auth.admin.deleteUser(id);
        } catch (e) {
            console.warn('Auth user delete warning (might be DB-only user):', e);
        }

        // 2. Delete from DB
        const { error } = await supabaseAdmin
            .from('User')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/dashboard/system/users');
        return true;
    } catch (error) {
        console.error('Delete user error:', error);
        return false;
    }
}
