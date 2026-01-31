'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Client/Brand tipi (birleştirilmiş)
export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    notes?: string;
    color?: string;
    category?: 'SOSYAL_MEDYA' | 'PAZARLAMA' | 'KURUMSAL' | 'BIREYSEL' | 'VIDEO' | 'TASARIM' | 'WEB' | 'DAHILI';
    contractType?: 'MONTHLY' | 'PROJECT' | 'RETAINER' | 'HOURLY';
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// Tüm müşterileri/markaları getir
export async function getClients(): Promise<Client[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('Client')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Supabase getClients error:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('getClients error:', error);
        return [];
    }
}

// Aktif müşterileri/markaları getir
export async function getActiveClients(): Promise<Client[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('Client')
            .select('*')
            .eq('active', true)
            .order('name', { ascending: true });

        if (error) {
            console.error('Supabase getActiveClients error:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('getActiveClients error:', error);
        return [];
    }
}

// ID'ye göre müşteri getir
export async function getClientById(id: string): Promise<Client | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('Client')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Supabase getClientById error:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('getClientById error:', error);
        return null;
    }
}

// İsme göre müşteri getir
export async function getClientByName(name: string): Promise<Client | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('Client')
            .select('*')
            .ilike('name', name)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Supabase getClientByName error:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('getClientByName error:', error);
        return null;
    }
}

// Yeni müşteri/marka oluştur
export async function createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('Client')
            .insert([{
                ...client,
                active: client.active ?? true,
                color: client.color || '#329FF5',
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase createClient error:', error);
            return null;
        }

        revalidatePath('/dashboard/clients');
        revalidatePath('/dashboard/content-production');
        return data;
    } catch (error) {
        console.error('createClient error:', error);
        return null;
    }
}

// Müşteri güncelle
export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('Client')
            .update({ ...updates, updatedAt: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase updateClient error:', error);
            return null;
        }

        revalidatePath('/dashboard/clients');
        revalidatePath('/dashboard/content-production');
        return data;
    } catch (error) {
        console.error('updateClient error:', error);
        return null;
    }
}

// Müşteri sil (veya deaktif et)
export async function deleteClient(id: string, hard = false): Promise<boolean> {
    try {
        if (hard) {
            const { error } = await supabaseAdmin
                .from('Client')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Supabase deleteClient error:', error);
                return false;
            }
        } else {
            // Soft delete - sadece active = false yap
            const { error } = await supabaseAdmin
                .from('Client')
                .update({ active: false, updatedAt: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                console.error('Supabase deactivateClient error:', error);
                return false;
            }
        }

        revalidatePath('/dashboard/clients');
        revalidatePath('/dashboard/content-production');
        return true;
    } catch (error) {
        console.error('deleteClient error:', error);
        return false;
    }
}
