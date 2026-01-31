'use client';

// ===== ORTAK İÇERİK VERİ MODÜLÜ =====
// Content Production ve Calendar arasında paylaşılan veri

export type ContentStatus = 'PLANLANDI' | 'CEKILDI' | 'KURGULANIYOR' | 'ONAYDA' | 'PAYLASILD' | 'TESLIM';
export type ContentType = 'VIDEO' | 'FOTOGRAF' | 'POST' | 'HIKAYE' | 'REEL' | 'PODCAST';

export interface ContentItem {
    id: string;
    title: string;
    brandId: string;
    status: ContentStatus;
    type: ContentType;
    notes?: string;
    deliveryDate?: string;
    publishDate?: string;
    assigneeId?: string;
}

const STORAGE_KEY = 'noco_contents';

// Initial mock data (Content Production'dan)
const initialContents: ContentItem[] = [
    // Tevfik Usta
    { id: '1', title: 'Tevfik Usta Video 1', brandId: 'tevfik', status: 'PAYLASILD', type: 'VIDEO', notes: 'Bir Akşam videosu', deliveryDate: '2025-11-19', publishDate: '2025-11-19' },
    { id: '6', title: 'Tevfik Usta Video 6', brandId: 'tevfik', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-11' },
    { id: '8', title: 'Tevfik Usta Çekim Günü', brandId: 'tevfik', status: 'CEKILDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-01' },
    { id: '9', title: 'Tevfik Usta Yeni Yıl', brandId: 'tevfik', status: 'KURGULANIYOR', type: 'VIDEO', notes: '', deliveryDate: '2026-01-05' },
    // ByKasap
    { id: '15', title: 'ByKasap Video 6', brandId: 'bykasap', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-07' },
    { id: '17', title: 'ByKasap Çekim', brandId: 'bykasap', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-08' },
    { id: '18', title: 'ByKasap Yeni Yıl', brandId: 'bykasap', status: 'CEKILDI', type: 'VIDEO', notes: '', deliveryDate: '2026-01-02' },
    { id: '19', title: 'ByKasap Konsept', brandId: 'bykasap', status: 'KURGULANIYOR', type: 'VIDEO', notes: '', deliveryDate: '2026-01-07' },
    // İkra
    { id: '28', title: 'İkra Yeni Yıl', brandId: 'ikra', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2026-01-03' },
    { id: '29', title: 'İkra Kampanya', brandId: 'ikra', status: 'KURGULANIYOR', type: 'VIDEO', notes: '', deliveryDate: '2026-01-08' },
    // Zeytindalı
    { id: '36', title: 'Zeytindalı Stüdyo Çekim', brandId: 'zeytindali', status: 'PLANLANDI', type: 'FOTOGRAF', notes: '', deliveryDate: '2025-12-09' },
    { id: '39', title: 'Zeytindalı Yeni Yıl', brandId: 'zeytindali', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2026-01-04' },
    // Valora
    { id: '47', title: 'Valora Yeni Yıl', brandId: 'valora', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2026-01-06' },
    { id: '48', title: 'Valora Kampanya', brandId: 'valora', status: 'KURGULANIYOR', type: 'VIDEO', notes: '', deliveryDate: '2026-01-09' },
    // Zoks
    { id: '56', title: 'Zoks Konsept Çekim', brandId: 'zoks', status: 'PLANLANDI', type: 'FOTOGRAF', notes: '', deliveryDate: '2025-12-09' },
    { id: '57', title: 'Zoks Yeni Yıl', brandId: 'zoks', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2026-01-10' },
];

// İçerikleri al
export function getContents(): ContentItem[] {
    if (typeof window === 'undefined') return initialContents;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return initialContents;
        }
    }
    return initialContents;
}

// İçerikleri kaydet
export function saveContents(contents: ContentItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contents));
}

// Yeni içerik ekle
export function addContent(content: ContentItem): ContentItem[] {
    const contents = getContents();
    contents.push(content);
    saveContents(contents);
    return contents;
}

// İçerik güncelle
export function updateContent(id: string, updates: Partial<ContentItem>): ContentItem[] {
    const contents = getContents().map(c =>
        c.id === id ? { ...c, ...updates } : c
    );
    saveContents(contents);
    return contents;
}

// İçerik sil
export function deleteContent(id: string): ContentItem[] {
    const contents = getContents().filter(c => c.id !== id);
    saveContents(contents);
    return contents;
}

// Takvim için: deliveryDate olan içerikleri CalendarEvent formatına dönüştür
export function getContentsAsCalendarEvents() {
    const contents = getContents();
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
