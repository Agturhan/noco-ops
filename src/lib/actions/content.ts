'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Content tipi
export interface ContentItem {
    id: string;
    title: string;
    brandId: string;
    status: string;
    type: string;
    notes?: string;
    deliveryDate?: string;
    publishDate?: string;
    assigneeId?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Tüm içerikleri getir
export async function getContents(): Promise<ContentItem[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('Content')
            .select('*')
            .order('deliveryDate', { ascending: true });

        if (error) {
            console.error('Supabase getContents error:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('getContents error:', error);
        return [];
    }
}

// Yeni içerik oluştur
export async function createContent(content: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentItem | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('Content')
            .insert([content])
            .select()
            .single();

        if (error) {
            console.error('Supabase createContent error:', error);
            return null;
        }

        revalidatePath('/dashboard/content-production');
        revalidatePath('/dashboard/calendar');
        return data;
    } catch (error) {
        console.error('createContent error:', error);
        return null;
    }
}

// İçerik güncelle
export async function updateContent(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('Content')
            .update({ ...updates, updatedAt: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase updateContent error:', error);
            return null;
        }

        revalidatePath('/dashboard/content-production');
        revalidatePath('/dashboard/calendar');
        return data;
    } catch (error) {
        console.error('updateContent error:', error);
        return null;
    }
}

// İçerik sil
export async function deleteContent(id: string): Promise<boolean> {
    try {
        const { error } = await supabaseAdmin
            .from('Content')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase deleteContent error:', error);
            return false;
        }

        revalidatePath('/dashboard/content-production');
        revalidatePath('/dashboard/calendar');
        return true;
    } catch (error) {
        console.error('deleteContent error:', error);
        return false;
    }
}

// Takvim için: deliveryDate olan içerikleri CalendarEvent formatına dönüştür
export async function getContentsAsCalendarEvents() {
    const contents = await getContents();
    return contents
        .filter(c => c.deliveryDate)
        .map(c => ({
            id: `content-${c.id}`,
            title: c.title,
            description: c.notes || '',
            date: c.deliveryDate!,
            type: 'CONTENT' as const,
            allDay: true,
            brandId: c.brandId,
            sourceType: 'content-production' as const,
            sourceId: c.id,
        }));
}
