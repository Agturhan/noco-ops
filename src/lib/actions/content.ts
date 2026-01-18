'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Content tipi
export interface ContentItem {
    id: string;
    title: string;
    brandId: string;
    brandName?: string;  // Yeni: Marka adı (text)
    clientId?: string;   // Yeni: Client referansı
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

// ===== MARKA/MÜŞTERİ AUTOCOMPLETE =====

// Marka adını normalize et (case-insensitive karşılaştırma için)
function normalizeBrandName(name: string): string {
    return name.trim().toLowerCase();
}

// Marka adını capitalize et (görüntüleme için)
function capitalizeBrandName(name: string): string {
    return name.trim().split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Marka önerileri getir (autocomplete için)
export async function getBrandSuggestions(query: string): Promise<{ id: string; name: string; clientId?: string }[]> {
    try {
        if (!query || query.length < 2) return [];

        const normalizedQuery = normalizeBrandName(query);

        // 1. Mevcut Client'lardan ara
        const { data: clients } = await supabaseAdmin
            .from('Client')
            .select('id, name')
            .ilike('name', `%${query}%`)
            .limit(10);

        // 2. Content tablosundaki benzersiz brandName'lerden ara
        const { data: contents } = await supabaseAdmin
            .from('Content')
            .select('brandName, clientId')
            .not('brandName', 'is', null)
            .ilike('brandName', `%${query}%`)
            .limit(20);

        // Sonuçları birleştir ve duplicate'leri kaldır
        const suggestions = new Map<string, { id: string; name: string; clientId?: string }>();

        // Client'ları ekle
        clients?.forEach(c => {
            const normalizedName = normalizeBrandName(c.name);
            if (!suggestions.has(normalizedName)) {
                suggestions.set(normalizedName, { id: c.id, name: c.name, clientId: c.id });
            }
        });

        // Content'ten gelen benzersiz markaları ekle
        contents?.forEach(c => {
            if (c.brandName) {
                const normalizedName = normalizeBrandName(c.brandName);
                if (!suggestions.has(normalizedName)) {
                    suggestions.set(normalizedName, {
                        id: `brand-${normalizedName}`,
                        name: c.brandName,
                        clientId: c.clientId
                    });
                }
            }
        });

        return Array.from(suggestions.values())
            .filter(s => normalizeBrandName(s.name).includes(normalizedQuery))
            .slice(0, 8);
    } catch (error) {
        console.error('getBrandSuggestions error:', error);
        return [];
    }
}

// Marka adına göre Client bul veya oluştur
export async function findOrCreateClient(brandName: string): Promise<{ clientId: string; name: string } | null> {
    try {
        const normalizedName = normalizeBrandName(brandName);
        const displayName = capitalizeBrandName(brandName);

        // 1. Mevcut Client'ı ara (case-insensitive)
        const { data: existingClients } = await supabaseAdmin
            .from('Client')
            .select('id, name')
            .ilike('name', brandName);

        if (existingClients && existingClients.length > 0) {
            return { clientId: existingClients[0].id, name: existingClients[0].name };
        }

        // 2. Yeni Client oluştur
        const { data: newClient, error } = await supabaseAdmin
            .from('Client')
            .insert([{
                name: displayName,
                email: `${normalizedName.replace(/\s+/g, '')}@placeholder.com`,
                company: displayName,
            }])
            .select()
            .single();

        if (error) {
            console.error('Client oluşturma hatası:', error);
            return null;
        }

        revalidatePath('/dashboard/clients');
        return { clientId: newClient.id, name: newClient.name };
    } catch (error) {
        console.error('findOrCreateClient error:', error);
        return null;
    }
}

// İçerik oluştur (marka adıyla - otomatik Client bağlantısı)
export async function createContentWithBrand(content: {
    title: string;
    brandName: string;
    status: string;
    type: string;
    notes?: string;
    deliveryDate?: string;
    publishDate?: string;
    assigneeId?: string;
}): Promise<ContentItem | null> {
    try {
        // 1. Client bul veya oluştur
        const client = await findOrCreateClient(content.brandName);

        // 2. Content oluştur
        const { data, error } = await supabaseAdmin
            .from('Content')
            .insert([{
                title: content.title,
                brandId: client?.name || content.brandName, // Geriye uyumluluk için
                brandName: client?.name || content.brandName,
                clientId: client?.clientId || null,
                status: content.status,
                type: content.type,
                notes: content.notes,
                deliveryDate: content.deliveryDate,
                publishDate: content.publishDate,
                assigneeId: content.assigneeId,
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase createContentWithBrand error:', error);
            return null;
        }

        revalidatePath('/dashboard/content-production');
        revalidatePath('/dashboard/calendar');
        revalidatePath('/dashboard/clients');
        return data;
    } catch (error) {
        console.error('createContentWithBrand error:', error);
        return null;
    }
}
