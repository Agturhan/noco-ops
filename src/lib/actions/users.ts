'use server';

import { supabaseAdmin } from '@/lib/supabase';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'OWNER' | 'OPS' | 'STUDIO' | 'DIGITAL' | 'CLIENT';
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
        .neq('role', 'CLIENT') // Clients are not team members? Static data showed roles: OWNER, OPS, DIGITAL, STUDIO
        .order('name');

    // Static data filter: role !== 'OWNER' for "active team"?
    // data.ts: getActiveTeamMembers = () => teamMembers.filter(m => m.active && m.role !== 'OWNER');
    // Let's stick to returning all internal staff for now, filtering can be done in UI if needed, 
    // but maybe exclude OWNER if that was the rule.
    // Let's filter out CLIENT definitely.

    if (error) {
        console.error('Error fetching team members:', error);
        return [];
    }

    return (data as User[]).filter(u => u.role !== 'CLIENT');
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
