'use server';

import { supabaseAdmin } from '@/lib/supabase';

export async function createFeedback(data: {
    userId: string;
    userName: string;
    type: 'BUG' | 'FEATURE' | 'UX' | 'OTHER';
    message: string;
    url?: string;
}) {
    const { data: feedback, error } = await supabaseAdmin
        .from('Feedback')
        .insert([{
            userId: data.userId,
            userName: data.userName,
            type: data.type,
            message: data.message,
            url: data.url,
            status: 'OPEN',
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating feedback:', error);
        throw new Error('Geri bildirim gönderilirken hata oluştu');
    }

    return feedback;
}
