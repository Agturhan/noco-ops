'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma'; // Use prisma client for complex queries if needed, or supabaseAdmin
import { logAction } from './audit';

// Define Brand interface matching Client model + extra logic
export interface Brand {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    color?: string;
    logoUrl?: string;
    website?: string;
    instagram?: string;
    socialCredentials?: string;
    notes?: string;
    isActive: boolean;
    category?: string;
    createdAt: string;
    updatedAt: string;
}

export async function getBrands() {
    try {
        const { data, error } = await supabaseAdmin
            .from('Client')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as Brand[];
    } catch (error) {
        console.error('getBrands error:', error);
        return [];
    }
}

export async function getBrandById(id: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('Client')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Brand;
    } catch (error) {
        console.error('getBrandById error:', error);
        return null;
    }
}

export async function updateBrand(id: string, data: Partial<Brand>) {
    try {
        // Remove readonly fields
        const { id: _, createdAt, updatedAt, ...updates } = data as any;

        const { error } = await supabaseAdmin
            .from('Client')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/dashboard/system/clients');
        revalidatePath(`/dashboard/system/clients/${id}`);
        revalidatePath(`/dashboard/system/clients/${id}`);
        return { success: true };
    } catch (error) {
        console.error('updateBrand error:', error);
        return { success: false, error };
    }
}

export async function createBrand(data: Partial<Brand>) {
    try {
        const { data: newBrand, error } = await supabaseAdmin
            .from('Client')
            .insert([{
                name: data.name,
                color: data.color || '#329FF5',
                company: data.company,
                category: data.category || 'SOSYAL_MEDYA',
                active: true, // Prisma model has `company` twice in diff but distinct in DB?
                // Wait, schema has `isActive` but local type in brands.ts has `isActive`? 
                // Let's check `Brand` interface in brands.ts. It has `isActive`.
                // Prisma model has `isActive`.
                isActive: true,
                ...data
            }])
            .select()
            .single();

        if (error) throw error;

        await logAction('CREATE', 'Brand', newBrand.id, data, newBrand.name);

        revalidatePath('/dashboard/system/clients');
        return { success: true, data: newBrand };
    } catch (error) {
        console.error('createBrand error:', error);
        return { success: false, error };
    }
}

// Get project stats for a brand
export async function getBrandStats(clientId: string) {
    try {
        // We can use prisma for aggregation or separate queries
        // Total projects
        const { count: totalProjects, error: err1 } = await supabaseAdmin
            .from('Task') // Assuming Task is Content
            .select('*', { count: 'exact', head: true })
            .eq('clientId', clientId)
            .not('contentType', 'is', null);

        // Active projects (not DONE)
        const { count: activeProjects, error: err2 } = await supabaseAdmin
            .from('Task')
            .select('*', { count: 'exact', head: true })
            .eq('clientId', clientId)
            .not('contentType', 'is', null)
            .neq('status', 'DONE');

        // Contracts (mock or real)
        const { count: contracts, error: err3 } = await supabaseAdmin
            .from('Contract')
            .select('*', { count: 'exact', head: true })
            .eq('clientId', clientId);

        return {
            totalProjects: totalProjects || 0,
            activeProjects: activeProjects || 0,
            contracts: contracts || 0
        };
    } catch (error) {
        console.error('getBrandStats error:', error);
        return { totalProjects: 0, activeProjects: 0, contracts: 0 };
    }
}

export async function getBrandProjects(clientId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('Task')
            .select('*')
            .eq('clientId', clientId)
            .not('contentType', 'is', null)
            .order('createdAt', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('getBrandProjects error:', error);
        return [];
    }
}

export async function deleteBrand(id: string) {
    try {
        const { error } = await supabaseAdmin
            .from('Client')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await logAction('DELETE', 'Brand', id, {}, 'Deleted Brand');

        revalidatePath('/dashboard/system/clients');
        return { success: true };
    } catch (error) {
        console.error('deleteBrand error:', error);
        return { success: false, error };
    }
}
