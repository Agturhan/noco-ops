'use server';

import { supabaseAdmin } from '@/lib/supabase';

// User Settings için server actions

export interface UserSetting {
    id: string;
    user_id: string | null;
    setting_key: string;
    setting_value: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// Ayar getir
export async function getSetting(key: string): Promise<Record<string, any> | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('user_settings')
            .select('setting_value')
            .eq('setting_key', key)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Kayıt bulunamadı
                return null;
            }
            throw error;
        }

        return data?.setting_value || null;
    } catch (error) {
        console.error(`getSetting error (${key}):`, error);
        return null;
    }
}

// Ayar kaydet
export async function saveSetting(key: string, value: Record<string, any>): Promise<boolean> {
    try {
        // Upsert - varsa güncelle, yoksa ekle
        const { error } = await supabaseAdmin
            .from('user_settings')
            .upsert(
                {
                    user_id: null, // Global ayar
                    setting_key: key,
                    setting_value: value,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'user_id,setting_key'
                }
            );

        if (error) throw error;
        return true;
    } catch (error) {
        console.error(`saveSetting error (${key}):`, error);
        return false;
    }
}

// Member colors özel fonksiyonları
export async function getMemberColors(): Promise<Record<string, string>> {
    const colors = await getSetting('member_colors');
    return (colors as Record<string, string>) || {
        'Şeyma Bora': '#E91E63',
        'Fatih Ustaosmanoğlu': '#329FF5',
        'Ayşegül Güler': '#00F5B0',
        'Ahmet Gürkan Turhan': '#9C27B0'
    };
}

export async function saveMemberColors(colors: Record<string, string>): Promise<boolean> {
    return saveSetting('member_colors', colors);
}
