'use server';

import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET_NAME = 'noco-files';

// ===== TİPLER =====
export interface UploadResult {
    success: boolean;
    path?: string;
    url?: string;
    error?: string;
}

export interface FileInfo {
    name: string;
    size: number;
    type: string;
    createdAt: string;
    url: string;
}

// ===== DOSYA YÜKLEME =====
export async function uploadFile(
    file: File,
    folder: string = 'assets',
    isProtected: boolean = false
): Promise<UploadResult> {
    try {
        // Dosya adını güvenli hale getir
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${folder}/${timestamp}-${safeName}`;

        // Dosyayı ArrayBuffer'a çevir
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Supabase'e yükle
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Dosya yükleme hatası:', error);
            return { success: false, error: error.message };
        }

        // Public URL al
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        return {
            success: true,
            path: data.path,
            url: urlData.publicUrl,
        };
    } catch (error: any) {
        console.error('Dosya yükleme hatası:', error);
        return { success: false, error: error.message };
    }
}

// ===== DOSYA İNDİRME URL'Sİ =====
export async function getDownloadUrl(filePath: string, expiresIn: number = 3600) {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(filePath, expiresIn);

        if (error) {
            throw error;
        }

        return { success: true, url: data.signedUrl };
    } catch (error: any) {
        console.error('Download URL hatası:', error);
        return { success: false, error: error.message };
    }
}

// ===== DOSYA SİLME =====
export async function deleteFile(filePath: string) {
    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error: any) {
        console.error('Dosya silme hatası:', error);
        return { success: false, error: error.message };
    }
}

// ===== KLASÖR İÇERİĞİ LİSTELE =====
export async function listFiles(folder: string = ''): Promise<FileInfo[]> {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list(folder, {
                limit: 100,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) {
            throw error;
        }

        // URL'leri ekle
        const files = data
            .filter(item => !item.id.endsWith('/')) // Klasörleri filtrele
            .map(item => {
                const { data: urlData } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(`${folder}/${item.name}`);

                return {
                    name: item.name,
                    size: item.metadata?.size || 0,
                    type: item.metadata?.mimetype || 'unknown',
                    createdAt: item.created_at,
                    url: urlData.publicUrl,
                };
            });

        return files;
    } catch (error: any) {
        console.error('Dosya listeleme hatası:', error);
        return [];
    }
}

// ===== PROJE DOSYALARI =====
export async function uploadProjectFile(
    projectId: string,
    file: File,
    deliverableId?: string
) {
    const folder = deliverableId
        ? `projects/${projectId}/deliverables/${deliverableId}`
        : `projects/${projectId}`;

    return uploadFile(file, folder);
}

// ===== AVATAR YÜKLEME =====
export async function uploadAvatar(userId: string, file: File) {
    // Sadece resim dosyalarına izin ver
    if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Sadece resim dosyaları kabul edilir' };
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
        return { success: false, error: 'Dosya boyutu 2MB\'dan küçük olmalıdır' };
    }

    return uploadFile(file, `avatars/${userId}`);
}

// ===== LOGO YÜKLEME =====
export async function uploadLogo(file: File) {
    if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Sadece resim dosyaları kabul edilir' };
    }

    return uploadFile(file, 'branding');
}

// ===== DOSYA BOYUTU FORMATLAMA =====
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ===== DOSYA İKONU =====
export function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📎';
}
