'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ===== BRAND GUIDELINES (MARKA DİLİ REHBERİ) =====
// Müşteri bazlı marka dili ve görsel stil rehberi (Tone of Voice)

interface BrandGuideline {
    id: string;
    clientId: string;
    // Tone of Voice
    toneOfVoice: string;
    communicationStyle: string;
    keyMessages: string[];
    avoidPhrases: string[];

    // Visual Identity
    primaryColors: string[];
    secondaryColors: string[];
    fonts: { heading: string; body: string };
    logoUrl?: string;
    logoUsageNotes?: string;

    // Content Guidelines
    contentPillars: string[];
    hashtagStrategy: string;
    emojiUsage: 'NONE' | 'MINIMAL' | 'MODERATE' | 'HEAVY';

    // Examples
    doExamples: string[];
    dontExamples: string[];

    // Meta
    createdAt: string;
    updatedAt: string;
}

// ===== GET BRAND GUIDELINE =====

export async function getBrandGuideline(clientId: string): Promise<BrandGuideline | null> {
    const { data, error } = await supabaseAdmin
        .from('BrandGuideline')
        .select('*')
        .eq('clientId', clientId)
        .single();

    if (error || !data) {
        // Return mock/default guideline
        return getDefaultGuideline(clientId);
    }

    return data as BrandGuideline;
}

// ===== CREATE/UPDATE BRAND GUIDELINE =====

export async function saveBrandGuideline(clientId: string, data: Partial<BrandGuideline>): Promise<{
    success: boolean;
    error?: string;
}> {
    // Check if exists
    const { data: existing } = await supabaseAdmin
        .from('BrandGuideline')
        .select('id')
        .eq('clientId', clientId)
        .single();

    let result;
    if (existing) {
        // Update
        result = await supabaseAdmin
            .from('BrandGuideline')
            .update({
                ...data,
                updatedAt: new Date().toISOString(),
            })
            .eq('clientId', clientId);
    } else {
        // Insert
        result = await supabaseAdmin
            .from('BrandGuideline')
            .insert([{
                clientId,
                ...data,
            }]);
    }

    if (result.error) {
        console.error('Error saving brand guideline:', result.error);
        return { success: false, error: 'Marka rehberi kaydedilirken hata oluştu' };
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: existing ? 'UPDATE_BRAND_GUIDELINE' : 'CREATE_BRAND_GUIDELINE',
        entityType: 'BRAND_GUIDELINE',
        entityId: clientId,
        details: { clientId },
    }]);

    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true };
}

// ===== GET ALL BRAND GUIDELINES =====

export async function getAllBrandGuidelines(): Promise<BrandGuideline[]> {
    const { data, error } = await supabaseAdmin
        .from('BrandGuideline')
        .select(`
            *,
            client:Client (
                id,
                name
            )
        `)
        .order('updatedAt', { ascending: false });

    if (error) {
        console.error('Error fetching brand guidelines:', error);
        return [];
    }

    return (data || []) as BrandGuideline[];
}

// ===== DEFAULT GUIDELINE TEMPLATE =====

function getDefaultGuideline(clientId: string): BrandGuideline {
    return {
        id: '',
        clientId,
        toneOfVoice: 'Samimi, profesyonel ve güven veren bir dil kullanılmalıdır.',
        communicationStyle: 'Sade ve anlaşılır',
        keyMessages: [
            'Kaliteli hizmet',
            'Müşteri memnuniyeti',
            'Yenilikçi yaklaşım',
        ],
        avoidPhrases: [
            'En ucuz',
            'Rakipsiz',
            'Kesinlikle',
        ],
        primaryColors: ['#1a1a2e', '#00F5B0'],
        secondaryColors: ['#329FF5', '#F6D73C'],
        fonts: {
            heading: 'Outfit',
            body: 'Inter',
        },
        contentPillars: [
            'Eğitici içerik',
            'Ürün tanıtımları',
            'Müşteri hikayeleri',
        ],
        hashtagStrategy: 'Her paylaşımda 5-10 alakalı hashtag kullanılmalı',
        emojiUsage: 'MODERATE',
        doExamples: [
            '"Sizin için en iyisini sunuyoruz"',
            '"Birlikte büyüyelim"',
        ],
        dontExamples: [
            '"Rakiplerimizden daha iyiyiz"',
            '"Kaçırmayın!!!"',
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

// ===== GENERATE BRAND SUMMARY =====

export async function generateBrandSummary(clientId: string): Promise<string> {
    const guideline = await getBrandGuideline(clientId);
    if (!guideline) return '';

    return `
## Marka Rehberi Özeti

### 🎯 Ton ve Üslup
${guideline.toneOfVoice}

### 🎨 Renkler
- Ana: ${guideline.primaryColors.join(', ')}
- İkincil: ${guideline.secondaryColors.join(', ')}

### ✍️ Tipografi
- Başlık: ${guideline.fonts.heading}
- Metin: ${guideline.fonts.body}

### 📝 Anahtar Mesajlar
${guideline.keyMessages.map(m => `- ${m}`).join('\n')}

### 🚫 Kaçınılması Gerekenler
${guideline.avoidPhrases.map(p => `- ${p}`).join('\n')}

### #️⃣ Hashtag Stratejisi
${guideline.hashtagStrategy}

### 😊 Emoji Kullanımı
${guideline.emojiUsage === 'NONE' ? 'Kullanılmaz' :
            guideline.emojiUsage === 'MINIMAL' ? 'Az' :
                guideline.emojiUsage === 'MODERATE' ? 'Orta' : 'Yoğun'}
    `.trim();
}
