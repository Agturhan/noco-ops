'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logAction } from './audit';

// Content status'larını Task status'larına dönüştür
// Task tablosu: TODO | IN_PROGRESS | IN_REVIEW | DONE | BLOCKED
// Content status: PLANLANDI | CEKILDI | KURGULANIYOR | PAYLASILD | TESLIM
// Content status'larını Task status'larına dönüştür
// Task tablosu: TODO | IN_PROGRESS | IN_REVIEW | DONE | BLOCKED
const contentStatusToTaskStatus: Record<string, string> = {
    'PLANLANDI': 'TODO',
    'ICERIK_HAZIRLANDI': 'IN_PROGRESS',
    'CEKILDI': 'IN_PROGRESS',
    'FOTOGRAF_RETOUCH': 'IN_PROGRESS',
    'TASARLANIYOR': 'IN_PROGRESS',
    'TASARLANDI': 'IN_REVIEW',
    'KURGULANIYOR': 'IN_PROGRESS',
    'KURGULANDI': 'IN_REVIEW',
    'ONAY': 'IN_REVIEW',
    'PAYLASILD': 'DONE',
    'TESLIM': 'DONE',
    // Task status'larını da kabul et
    'TODO': 'TODO',
    'IN_PROGRESS': 'IN_PROGRESS',
    'IN_REVIEW': 'IN_REVIEW',
    'DONE': 'DONE',
    'BLOCKED': 'BLOCKED',
};

// Task status'larını Content status'larına dönüştür (gösterim için - basitleştirilmiş)
const taskStatusToContentStatus: Record<string, string> = {
    'TODO': 'PLANLANDI',
    'IN_PROGRESS': 'TASARLANIYOR', // Varsayılan ara durum
    'IN_REVIEW': 'ONAY',
    'DONE': 'PAYLASILD',
    'BLOCKED': 'PLANLANDI',
};

function mapContentStatusToTask(status: string): string {
    return contentStatusToTaskStatus[status] || 'TODO';
}

function mapTaskStatusToContent(status: string): string {
    return taskStatusToContentStatus[status] || status;
}

// ContentItem tipi (geriye uyumluluk)
export interface ContentItem {
    id: string;
    title: string;
    brandId: string;
    brandName?: string;
    clientId?: string;
    status: string;
    type: string;
    notes?: string;
    deliveryDate?: string;
    publishDate?: string;
    assigneeId?: string;
    assigneeIds?: string[];
    createdAt?: string;
    updatedAt?: string;
}


// Content olarak işaretli Task'ları getir
export async function getContents(): Promise<ContentItem[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('Task')
            .select('*')
            .not('contentType', 'is', null)
            .order('dueDate', { ascending: true });

        if (error) {
            console.error('Supabase getContents error:', error);
            return [];
        }

        // Task formatını ContentItem formatına dönüştür
        return (data || []).map(task => ({
            id: task.id,
            title: task.title,
            brandId: task.brandName || task.clientId || '',
            brandName: task.brandName,
            clientId: task.clientId,
            status: mapTaskStatusToContent(task.status),
            type: task.contentType || 'VIDEO',
            notes: task.notes || task.description || '',
            deliveryDate: task.dueDate,
            publishDate: task.publishDate,
            assigneeId: task.assigneeId,
            assigneeIds: task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []),
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        }));
    } catch (error) {
        console.error('getContents error:', error);
        return [];
    }
}

// ... imports
import { getRetainers, logRetainerHours } from './retainers';

// ... existing code ...

// Yeni içerik oluştur (Task tablosuna direkt)
export async function createContent(content: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentItem | null> {
    try {
        const { data: task, error } = await supabaseAdmin
            .from('Task')
            .insert([{
                title: content.title,
                description: content.notes,
                status: mapContentStatusToTask(content.status || 'PLANLANDI'),
                priority: 'NORMAL',
                dueDate: content.deliveryDate || null,
                assigneeId: content.assigneeId || (content.assigneeIds?.[0]) || null,
                contentType: content.type || 'VIDEO',
                publishDate: content.publishDate || null,
                assigneeIds: content.assigneeIds || [],
                clientId: content.clientId || null,
                brandName: content.brandName || content.brandId || null,
                notes: content.notes || null,
                sourceType: 'content',
            }])
            .select()
            .single();

        if (task) {
            await logAction('CREATE', 'CONTENT', task.id, { title: content.title, type: content.type }, task.title);

            // AUTOMATIC RETAINER LOGGING
            if (content.clientId) {
                try {
                    // Find active retainer for this client
                    const retainers = await getRetainers(content.clientId);
                    const activeRetainer = retainers.find((r: any) => r.status === 'ACTIVE');

                    if (activeRetainer) {
                        // Log 1 unit/hour
                        await logRetainerHours({
                            retainerId: activeRetainer.id,
                            hours: 1, // Defaulting to 1 unit
                            description: `İçerik Üretimi: ${content.title}`,
                            date: new Date().toISOString(),
                            userId: content.assigneeId || undefined
                        });
                        console.log(`[Auto-Log] Logged 1 unit to retainer ${activeRetainer.id} for content ${task.id}`);
                    }
                } catch (retainerError) {
                    console.error('Auto-log retainer error (non-blocking):', retainerError);
                    // Do not fail content creation if retainer logging fails
                }
            }
        }

        if (error) {
            console.error('Supabase createContent error details:', JSON.stringify(error, null, 2));
            console.error('Payload attempted:', JSON.stringify({
                title: content.title,
                status: mapContentStatusToTask(content.status || 'PLANLANDI'),
                assigneeId: content.assigneeId,
                assigneeIds: content.assigneeIds
            }, null, 2));
            return null;
        }

        revalidatePath('/dashboard/content-production');
        revalidatePath('/dashboard/calendar');
        revalidatePath('/dashboard/tasks');
        revalidatePath('/dashboard');

        return {
            id: task.id,
            title: task.title,
            brandId: task.brandName || '',
            brandName: task.brandName,
            clientId: task.clientId,
            status: task.status,
            type: task.contentType || 'VIDEO',
            notes: task.notes || '',
            deliveryDate: task.dueDate,
            publishDate: task.publishDate,
            assigneeId: task.assigneeId,
            assigneeIds: task.assigneeIds || [],
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        };
    } catch (error) {
        console.error('createContent error:', error);
        return null;
    }
}

// İçerik güncelle
export async function updateContent(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    try {
        const taskUpdates: Record<string, unknown> = {
            updatedAt: new Date().toISOString(),
        };

        if (updates.title) taskUpdates.title = updates.title;
        if (updates.notes !== undefined) taskUpdates.notes = updates.notes;
        if (updates.notes !== undefined) taskUpdates.description = updates.notes;
        if (updates.status) taskUpdates.status = mapContentStatusToTask(updates.status);
        if (updates.type) taskUpdates.contentType = updates.type;
        if (updates.deliveryDate !== undefined) taskUpdates.dueDate = updates.deliveryDate;
        if (updates.publishDate !== undefined) taskUpdates.publishDate = updates.publishDate;
        if (updates.assigneeId !== undefined) taskUpdates.assigneeId = updates.assigneeId;
        if (updates.assigneeIds !== undefined) taskUpdates.assigneeIds = updates.assigneeIds;
        if (updates.clientId !== undefined) taskUpdates.clientId = updates.clientId;
        if (updates.brandName !== undefined) taskUpdates.brandName = updates.brandName;
        if (updates.brandId !== undefined) taskUpdates.brandName = updates.brandId;

        const { data, error } = await supabaseAdmin
            .from('Task')
            .update(taskUpdates)
            .eq('id', id)
            .select()
            .single();

        if (data) {
            await logAction('UPDATE', 'CONTENT', id, updates, data.title);
        }

        if (error) {
            console.error('Supabase updateContent error:', error);
            return null;
        }

        revalidatePath('/dashboard/content-production');
        revalidatePath('/dashboard/calendar');
        revalidatePath('/dashboard/tasks');
        revalidatePath('/dashboard');

        return {
            id: data.id,
            title: data.title,
            brandId: data.brandName || '',
            brandName: data.brandName,
            clientId: data.clientId,
            status: data.status,
            type: data.contentType || 'VIDEO',
            notes: data.notes || '',
            deliveryDate: data.dueDate,
            publishDate: data.publishDate,
            assigneeId: data.assigneeId,
            assigneeIds: data.assigneeIds || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    } catch (error) {
        console.error('updateContent error:', error);
        return null;
    }
}

// İçerik sil
export async function deleteContent(id: string): Promise<boolean> {
    try {
        const { error } = await supabaseAdmin
            .from('Task')
            .delete()
            .eq('id', id);

        await logAction('DELETE', 'CONTENT', id, {}, 'İçerik');

        if (error) {
            console.error('Supabase deleteContent error:', error);
            return false;
        }

        revalidatePath('/dashboard/content-production');
        revalidatePath('/dashboard/calendar');
        revalidatePath('/dashboard/tasks');
        revalidatePath('/dashboard');
        return true;
    } catch (error) {
        console.error('deleteContent error:', error);
        return false;
    }
}

// Takvim için: dueDate olan TÜM Task'ları CalendarEvent formatına dönüştür
// Artık sadece sourceType='content' değil, tüm içerikleri getiriyor
export async function getContentsAsCalendarEvents() {
    try {
        // Tüm Task'ları getir (hem content hem task)
        const { data, error } = await supabaseAdmin
            .from('Task')
            .select('*')
            .not('dueDate', 'is', null)
            .order('dueDate', { ascending: true });

        if (error) {
            console.error('Supabase getContentsAsCalendarEvents error:', error);
            return [];
        }

        return (data || []).map(task => ({
            id: `content-${task.id}`,
            title: task.title,
            description: task.notes || task.description || '',
            // Ensure YYYY-MM-DD format - avoid timezone shifts by using string manipulation if possible
            date: task.dueDate ? (typeof task.dueDate === 'string' ? task.dueDate.substring(0, 10) : new Date(task.dueDate).toISOString().split('T')[0]) : '',
            type: task.contentType ? 'CONTENT' : 'TASK' as const,
            allDay: true,
            brandId: task.brandName || task.clientId || '',
            sourceType: task.sourceType || 'task' as const,
            sourceId: task.id,
            status: task.status,
            priority: task.priority,
            assigneeId: task.assigneeId || null,
            assigneeIds: task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []),
        }));
    } catch (error) {
        console.error('getContentsAsCalendarEvents error:', error);
        return [];
    }
}

// ===== MARKA/MÜŞTERİ AUTOCOMPLETE =====

// Marka adını normalize et
function normalizeBrandName(name: string): string {
    return name.trim().toLowerCase();
}

// Marka adını capitalize et
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

        // Client tablosundan ara (Brand = Client birleştirildi)
        const { data: clients } = await supabaseAdmin
            .from('Client')
            .select('id, name, color')
            .ilike('name', `%${query}%`)
            .eq('active', true)
            .limit(10);

        // Task tablosundaki benzersiz brandName'lerden ara
        const { data: tasks } = await supabaseAdmin
            .from('Task')
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

        // Task'tan gelen benzersiz markaları ekle
        tasks?.forEach(t => {
            if (t.brandName) {
                const normalizedName = normalizeBrandName(t.brandName);
                if (!suggestions.has(normalizedName)) {
                    suggestions.set(normalizedName, {
                        id: `brand-${normalizedName}`,
                        name: t.brandName,
                        clientId: t.clientId
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
        const displayName = capitalizeBrandName(brandName);

        // 1. Mevcut Client'ı ara
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
                color: '#329FF5',
                active: true,
                category: 'SOSYAL_MEDYA',
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
    assigneeIds?: string[];
}): Promise<ContentItem | null> {
    try {
        // 1. Client bul veya oluştur
        const client = await findOrCreateClient(content.brandName);

        // 2. Content oluştur (Task olarak)
        return await createContent({
            title: content.title,
            brandId: client?.name || content.brandName,
            brandName: client?.name || content.brandName,
            clientId: client?.clientId,
            status: content.status,
            type: content.type,
            notes: content.notes,
            deliveryDate: content.deliveryDate,
            publishDate: content.publishDate,
            assigneeId: content.assigneeId || content.assigneeIds?.[0],
            assigneeIds: content.assigneeIds || (content.assigneeId ? [content.assigneeId] : []),
        });
    } catch (error) {
        console.error('createContentWithBrand error:', error);
        return null;
    }
}
// Hakediş Durumunu Getir (Dashboard için)
export async function getRetainerStatus() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        // 1. Fetch Active Contracts with Client details
        // We assume all contracts are 'active' for now, or we could filter by date if Contract had dates
        const { data: contracts, error: contractError } = await supabaseAdmin
            .from('Contract')
            .select('*, client:Client(*)')
            .order('name');

        if (contractError) throw contractError;

        // 1.1 Fetch Active Retainers (Source of Truth for visibility)
        const { data: retainers, error: retainerError } = await supabaseAdmin
            .from('Retainer')
            .select('*, client:Client(*)')
            .neq('status', 'EXPIRED')
            .order('name');

        if (retainerError) throw retainerError;

        const activeRetainerClientIds = new Set(retainers?.map(r => r.clientId) || []);

        // Filter contracts: Only show if client has a Retainer record
        // visibleContracts is computed but not used - using retainers directly instead
        const _visibleContracts = contracts?.filter(c => activeRetainerClientIds.has(c.clientId)) || [];

        // 2. Fetch Tasks for this month (for progress calculation)
        // Count if: (DueDate in month) OR (DueDate is NULL AND CreatedAt in month)
        // This ensures Undated "Planlanacak" items are counted when created.
        const { data: contents, error: contentError } = await supabaseAdmin
            .from('Task')
            .select('id, status, contentType, clientId, brandName, dueDate, createdAt')
            .not('contentType', 'is', null)
            .or(`dueDate.gte.${startOfMonth},and(dueDate.is.null,createdAt.gte.${startOfMonth})`)
            // Note: We also need upper bound. 
            // supabase .or() syntax with nested logic is tricky. 
            // Easier: Fetch wider range (e.g. created OR due >= startOfMonth) then filter in JS.
            // Fetching all "active" or recent tasks is safer.
            .gte('createdAt', startOfMonth) // Optimization: at least created recently? No, disjoint sets.
            // Let's settle for: Fetch ALL content types, then filter in JS. 
            // Just fetching all content for the active clients is safer than complex OR query limits.
            // But we need to know the date range.

            // Revised Strategy:
            // Fetch all tasks for the relevant Clients (we have visibleContracts).
            // But that's hard to filter in SQL by array of ClientIDs efficiently without a helper.
            // Let's stick to the Date logic.
            // We want tasks that "Belong to this month".
            // Task belongs if: DueDate is in month. OR (DueDate is null AND CreatedAt is in month).

            // Supabase query for this:
            .or(`dueDate.gte.${startOfMonth},createdAt.gte.${startOfMonth}`)
            // Use wide net, then filter JS.
            .order('createdAt', { ascending: false });

        if (contentError) throw contentError;

        // JS Filter for strict month boundaries
        const monthContents = (contents || []).filter(c => {
            const due = c.dueDate ? new Date(c.dueDate) : null;
            const created = new Date(c.createdAt);
            const start = new Date(startOfMonth);
            const end = new Date(endOfMonth);

            if (due) {
                return due >= start && due <= end;
            } else {
                // If no due date, fall back to created date
                return created >= start && created <= end;
            }
        });

        // Use filtered list
        const effectiveContents = monthContents;


        // 3. Map to Dashboard Format
        // Iterate over RETAINERS instead of Contracts to avoid duplicates
        return (retainers || []).map((retainer) => {
            const clientName = retainer.client?.name || retainer.name;

            // Filter contents for this client
            const clientContents = effectiveContents.filter(c =>
                c.clientId === retainer.clientId ||
                (clientName && c.brandName?.toLowerCase().includes(clientName.split(' ')[0].toLowerCase())) ||
                (clientName && c.brandName === clientName)
            ) || [];

            const total = retainer.monthlyHours || 8;
            // For now, track item count as progress (since we auto-log 1 unit per item)
            // Or use stored logs if we want pure hours. 
            // The user prompt "Auto-increment Retainer progress" suggested item count based logic previously.
            // Let's use the count of items in this month.
            const usedCount = clientContents.length;

            // Stock (Finished items)
            const stock = clientContents.filter(c => ['DONE', 'PAYLASILD', 'TESLIM'].includes(c.status)).length;

            let label = 'Normal';
            const percent = (usedCount / total) * 100;
            const stockVal = total - usedCount;

            if (percent >= 100) label = 'Tamamlandı';
            else if (percent >= 80) label = 'Yoğun';
            else if (percent >= 50) label = 'Normal';
            else label = 'Başlangıç';

            return {
                id: retainer.id,
                client: clientName,
                clientId: retainer.clientId,
                progress: usedCount,
                total: total,
                label: label,
                stock: Math.max(0, stockVal),
                stockLabel: stock > 0 ? `${stock} Hazır` : 'Planlanıyor',
                note: retainer.client?.notes || 'Standart',
                warning: false
            };
        });

    } catch (error) {
        console.error('getRetainerStatus error:', error);
        return [];
    }
}
