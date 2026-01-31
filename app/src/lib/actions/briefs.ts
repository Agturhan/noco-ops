'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ===== BRIEF FORMS & DIGITAL APPROVAL SYSTEM =====
// Standart brief formları ve müşteri dijital onay mekanizması

type BriefType = 'VIDEO' | 'DESIGN' | 'SOCIAL_MEDIA' | 'ADVERTISING' | 'PHOTO';
type ApprovalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

interface BriefTemplate {
    type: BriefType;
    name: string;
    fields: { name: string; label: string; type: 'text' | 'textarea' | 'select' | 'date' | 'checkbox'; required: boolean; options?: string[] }[];
}

// ===== BRIEF TEMPLATES =====

export async function getBriefTemplates(): Promise<BriefTemplate[]> {
    return [
        {
            type: 'VIDEO',
            name: 'Video Prodüksiyon Brief',
            fields: [
                { name: 'projectName', label: 'Proje Adı', type: 'text', required: true },
                { name: 'objective', label: 'Videonun Amacı', type: 'textarea', required: true },
                { name: 'targetAudience', label: 'Hedef Kitle', type: 'textarea', required: true },
                { name: 'duration', label: 'Video Süresi', type: 'select', required: true, options: ['15 saniye', '30 saniye', '1 dakika', '2+ dakika'] },
                { name: 'platform', label: 'Yayın Platformu', type: 'select', required: true, options: ['Instagram Reels', 'YouTube', 'TikTok', 'TV', 'Web Sitesi'] },
                { name: 'tone', label: 'Ton ve Stil', type: 'textarea', required: true },
                { name: 'keyMessages', label: 'Ana Mesajlar', type: 'textarea', required: true },
                { name: 'references', label: 'Referans Videolar', type: 'textarea', required: false },
                { name: 'deadline', label: 'Teslim Tarihi', type: 'date', required: true },
                { name: 'budget', label: 'Bütçe', type: 'text', required: false },
            ],
        },
        {
            type: 'DESIGN',
            name: 'Grafik Tasarım Brief',
            fields: [
                { name: 'projectName', label: 'Proje Adı', type: 'text', required: true },
                { name: 'designType', label: 'Tasarım Tipi', type: 'select', required: true, options: ['Logo', 'Afiş', 'Kartvizit', 'Broşür', 'Sosyal Medya', 'Web Banner'] },
                { name: 'dimensions', label: 'Boyutlar', type: 'text', required: true },
                { name: 'colorPreferences', label: 'Renk Tercihleri', type: 'textarea', required: false },
                { name: 'content', label: 'İçerik/Metinler', type: 'textarea', required: true },
                { name: 'style', label: 'Stil Tercihi', type: 'select', required: true, options: ['Minimalist', 'Modern', 'Klasik', 'Cesur', 'Organik'] },
                { name: 'references', label: 'Referans Görseller', type: 'textarea', required: false },
                { name: 'deadline', label: 'Teslim Tarihi', type: 'date', required: true },
            ],
        },
        {
            type: 'SOCIAL_MEDIA',
            name: 'Sosyal Medya İçerik Brief',
            fields: [
                { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok'] },
                { name: 'contentType', label: 'İçerik Tipi', type: 'select', required: true, options: ['Post', 'Story', 'Reels', 'Carousel', 'Video'] },
                { name: 'topic', label: 'Konu/Tema', type: 'textarea', required: true },
                { name: 'caption', label: 'Caption Önerisi', type: 'textarea', required: false },
                { name: 'hashtags', label: 'Hashtag Önerileri', type: 'textarea', required: false },
                { name: 'callToAction', label: 'CTA (Aksiyon Çağrısı)', type: 'text', required: false },
                { name: 'publishDate', label: 'Yayın Tarihi', type: 'date', required: true },
            ],
        },
        {
            type: 'ADVERTISING',
            name: 'Reklam Kampanyası Brief',
            fields: [
                { name: 'campaignName', label: 'Kampanya Adı', type: 'text', required: true },
                { name: 'objective', label: 'Kampanya Hedefi', type: 'select', required: true, options: ['Marka Bilinirliği', 'Trafik', 'Satış', 'Lead Toplama', 'Uygulama İndirme'] },
                { name: 'targetAudience', label: 'Hedef Kitle Tanımı', type: 'textarea', required: true },
                { name: 'budget', label: 'Günlük/Toplam Bütçe', type: 'text', required: true },
                { name: 'duration', label: 'Kampanya Süresi', type: 'text', required: true },
                { name: 'platforms', label: 'Reklamın Yayınlanacağı Platformlar', type: 'textarea', required: true },
                { name: 'creativeRequirements', label: 'Kreatif İhtiyaçlar', type: 'textarea', required: true },
                { name: 'kpis', label: 'Başarı Kriterleri (KPI)', type: 'textarea', required: true },
            ],
        },
        {
            type: 'PHOTO',
            name: 'Fotoğraf Çekimi Brief',
            fields: [
                { name: 'projectName', label: 'Proje Adı', type: 'text', required: true },
                { name: 'shootType', label: 'Çekim Tipi', type: 'select', required: true, options: ['Ürün', 'Portre', 'Mekan', 'Etkinlik', 'Food'] },
                { name: 'location', label: 'Çekim Lokasyonu', type: 'text', required: true },
                { name: 'shotList', label: 'Çekim Listesi', type: 'textarea', required: true },
                { name: 'style', label: 'Görsel Stil', type: 'textarea', required: true },
                { name: 'props', label: 'Gerekli Prop/Aksesuar', type: 'textarea', required: false },
                { name: 'shootDate', label: 'Çekim Tarihi', type: 'date', required: true },
                { name: 'deliveryFormat', label: 'Teslim Formatı', type: 'select', required: true, options: ['JPG (Web)', 'TIFF (Baskı)', 'RAW + JPG', 'Hepsi'] },
            ],
        },
    ];
}

// ===== CREATE BRIEF =====

export async function createBrief(data: {
    projectId: string;
    type: BriefType;
    content: Record<string, any>;
    createdBy?: string;
}): Promise<{ success: boolean; briefId?: string; error?: string }> {
    const { data: brief, error } = await supabaseAdmin
        .from('Brief')
        .insert([{
            projectId: data.projectId,
            type: data.type,
            content: data.content,
            status: 'DRAFT',
            createdBy: data.createdBy || null,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating brief:', error);
        return { success: false, error: 'Brief oluşturulurken hata oluştu' };
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'CREATE_BRIEF',
        entityType: 'BRIEF',
        entityId: brief.id,
        details: { type: data.type, projectId: data.projectId },
    }]);

    revalidatePath('/dashboard/projects');
    return { success: true, briefId: brief.id };
}

// ===== SUBMIT BRIEF FOR APPROVAL =====

export async function submitBriefForApproval(briefId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('Brief')
        .update({
            status: 'PENDING_APPROVAL',
            submittedAt: new Date().toISOString(),
        })
        .eq('id', briefId);

    if (error) {
        console.error('Error submitting brief:', error);
        return { success: false, error: 'Brief gönderilirken hata oluştu' };
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'SUBMIT_BRIEF',
        entityType: 'BRIEF',
        entityId: briefId,
        details: {},
    }]);

    revalidatePath('/dashboard/projects');
    return { success: true };
}

// ===== APPROVE BRIEF (Digital Signature) =====

export async function approveBrief(briefId: string, data: {
    approvedBy: string;
    signatureData?: string; // Base64 signature image
    notes?: string;
}): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('Brief')
        .update({
            status: 'APPROVED',
            approvedAt: new Date().toISOString(),
            approvedBy: data.approvedBy,
            signatureData: data.signatureData || null,
            approvalNotes: data.notes || null,
        })
        .eq('id', briefId);

    if (error) {
        console.error('Error approving brief:', error);
        return { success: false, error: 'Brief onaylanırken hata oluştu' };
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'APPROVE_BRIEF',
        entityType: 'BRIEF',
        entityId: briefId,
        details: { approvedBy: data.approvedBy },
    }]);

    revalidatePath('/dashboard/projects');
    return { success: true };
}

// ===== REJECT BRIEF =====

export async function rejectBrief(briefId: string, data: {
    rejectedBy: string;
    reason: string;
}): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('Brief')
        .update({
            status: 'REJECTED',
            rejectedAt: new Date().toISOString(),
            rejectedBy: data.rejectedBy,
            rejectionReason: data.reason,
        })
        .eq('id', briefId);

    if (error) {
        console.error('Error rejecting brief:', error);
        return { success: false, error: 'Brief reddedilirken hata oluştu' };
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'REJECT_BRIEF',
        entityType: 'BRIEF',
        entityId: briefId,
        details: { rejectedBy: data.rejectedBy, reason: data.reason },
    }]);

    revalidatePath('/dashboard/projects');
    return { success: true };
}

// ===== GET PROJECT BRIEFS =====

export async function getProjectBriefs(projectId: string) {
    const { data, error } = await supabaseAdmin
        .from('Brief')
        .select('*')
        .eq('projectId', projectId)
        .order('createdAt', { ascending: false });

    if (error) {
        console.error('Error fetching briefs:', error);
        return [];
    }

    return data || [];
}

// ===== CHECK IF DELIVERABLE CAN BE PUBLISHED =====
// "Onaylanmadan yayınlanmaz" kuralı

export async function canDeliverableBePublished(deliverableId: string): Promise<{
    canPublish: boolean;
    reason?: string;
    briefStatus?: ApprovalStatus;
}> {
    // Get deliverable with project briefs
    const { data: deliverable } = await supabaseAdmin
        .from('Deliverable')
        .select('projectId')
        .eq('id', deliverableId)
        .single();

    if (!deliverable) {
        return { canPublish: false, reason: 'Teslimat bulunamadı' };
    }

    // Check if project has an approved brief
    const { data: briefs } = await supabaseAdmin
        .from('Brief')
        .select('status')
        .eq('projectId', deliverable.projectId)
        .eq('status', 'APPROVED');

    if (!briefs || briefs.length === 0) {
        return {
            canPublish: false,
            reason: 'Onaylanmış brief bulunamadı. Müşteri onayı olmadan içerik yayınlanamaz.',
        };
    }

    return { canPublish: true };
}
