'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ===== CALENDAR EVENT TYPES =====
// Prisma enum: TASK | MEETING | DEADLINE | CONTENT | SHOOT | REVIEW | OTHER
export type EventType = 'TASK' | 'MEETING' | 'DEADLINE' | 'CONTENT' | 'SHOOT' | 'REVIEW' | 'OTHER';

export interface CalendarEventCreate {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    type: EventType;
    projectId?: string;
    assigneeId?: string;
    clientId?: string;  // Brand ID
    allDay?: boolean;
    color?: string;
}

// ===== GET CALENDAR EVENTS =====

export async function getCalendarEvents(startDate?: string, endDate?: string) {
    let query = supabaseAdmin
        .from('CalendarEvent')
        .select(`
            *,
            project:Project (
                id,
                name
            ),
            user:User (
                id,
                name
            )
        `)
        .order('startDate', { ascending: true });

    if (startDate) {
        query = query.gte('startDate', startDate);
    }

    if (endDate) {
        query = query.lte('startDate', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching calendar events:', error);
        throw new Error('Takvim etkinlikleri yüklenirken hata oluştu');
    }

    return data || [];
}

// ===== GET EVENTS BY DATE RANGE =====

export async function getEventsByDateRange(start: string, end: string) {
    const { data, error } = await supabaseAdmin
        .from('CalendarEvent')
        .select(`
            *,
            project:Project (
                id,
                name
            )
        `)
        .or(`startDate.gte.${start},endDate.lte.${end}`)
        .order('startDate', { ascending: true });

    if (error) {
        console.error('Error fetching events by date range:', error);
        throw new Error('Etkinlikler yüklenirken hata oluştu');
    }

    return data || [];
}

// ===== GET EVENT BY ID =====

export async function getCalendarEventById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('CalendarEvent')
        .select(`
            *,
            project:Project (
                id,
                name
            ),
            user:User (
                id,
                name
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching calendar event:', error);
        return null;
    }

    return data;
}

// ===== CREATE CALENDAR EVENT =====

export async function createCalendarEvent(data: CalendarEventCreate) {
    const { data: event, error } = await supabaseAdmin
        .from('CalendarEvent')
        .insert([{
            title: data.title,
            description: data.description || null,
            startDate: data.startDate,
            endDate: data.endDate || data.startDate,
            type: data.type,
            projectId: data.projectId || null,
            assigneeId: data.assigneeId || null,
            clientId: data.clientId || null,
            allDay: data.allDay ?? false,
            color: data.color || getDefaultColor(data.type),
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating calendar event:', error);
        throw new Error('Etkinlik oluşturulurken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'CREATE',
        entityType: 'CALENDAR_EVENT',
        entityId: event.id,
        details: { title: data.title, type: data.type },
    }]);

    revalidatePath('/dashboard/calendar');
    return event;
}

// ===== UPDATE CALENDAR EVENT =====

export async function updateCalendarEvent(id: string, data: Partial<CalendarEventCreate>) {
    const updateData: Record<string, any> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.allDay !== undefined) updateData.allDay = data.allDay;
    if (data.color !== undefined) updateData.color = data.color;

    const { data: event, error } = await supabaseAdmin
        .from('CalendarEvent')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating calendar event:', error);
        throw new Error('Etkinlik güncellenirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'UPDATE',
        entityType: 'CALENDAR_EVENT',
        entityId: id,
        details: updateData,
    }]);

    revalidatePath('/dashboard/calendar');
    return event;
}

// ===== DELETE CALENDAR EVENT =====

export async function deleteCalendarEvent(id: string) {
    const { error } = await supabaseAdmin
        .from('CalendarEvent')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting calendar event:', error);
        throw new Error('Etkinlik silinirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'DELETE',
        entityType: 'CALENDAR_EVENT',
        entityId: id,
        details: {},
    }]);

    revalidatePath('/dashboard/calendar');
}

// ===== MOVE EVENT (Drag & Drop) =====

export async function moveCalendarEvent(id: string, newStartDate: string, newEndDate?: string) {
    return updateCalendarEvent(id, {
        startDate: newStartDate,
        endDate: newEndDate || newStartDate,
    });
}

// ===== HELPER: Get Default Color by Event Type =====

function getDefaultColor(type: EventType): string {
    const colors: Record<EventType, string> = {
        TASK: '#329FF5',      // Mavi - Görev
        MEETING: '#00F5B0',   // Yeşil - Toplantı
        DEADLINE: '#FF4242',  // Kırmızı - Son Tarih
        CONTENT: '#F6D73C',   // Sarı - İçerik
        SHOOT: '#9C27B0',     // Mor - Çekim
        REVIEW: '#FF9800',    // Turuncu - İnceleme
        OTHER: '#6B7B80',     // Gri - Diğer
    };
    return colors[type] || '#6B7B80';
}

// ===== GET SHOOT EVENTS (Çekim etkinlikleri) =====

export async function getShootEvents(date?: string) {
    let query = supabaseAdmin
        .from('CalendarEvent')
        .select('*')
        .eq('type', 'SHOOT')
        .order('startDate', { ascending: true });

    if (date) {
        query = query.eq('startDate', date);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching shoot events:', error);
        throw new Error('Çekim etkinlikleri yüklenirken hata oluştu');
    }

    return data || [];
}

// ===== CREATE SHOOT EVENT =====

export async function createShootEvent(data: {
    title: string;
    startDate: string;
    endDate: string;
    description?: string;
    projectId?: string;
    clientId?: string;
}) {
    return createCalendarEvent({
        ...data,
        type: 'SHOOT',
        color: '#9C27B0',
    });
}
