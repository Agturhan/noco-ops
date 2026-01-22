/**
 * NOCO OPS - Merkezi Veri Katmanı
 * Tüm modüller bu dosyadan veri çekecek
 * 
 * Gerçek markalar ve bilgiler
 */

// ========================================
// GERÇEK MARKALAR (Sosyal Medya Müşterileri)
// ========================================
export interface Brand {
    id: string;
    name: string;
    color: string;
    category: 'SOSYAL_MEDYA' | 'VIDEO' | 'TASARIM' | 'WEB' | 'DAHILI';
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    instagramHandle?: string;
    contractType?: 'RETAINER' | 'PROJECT' | 'HOURLY';
    monthlyFee?: number;
    active: boolean;
}

export const brands: Brand[] = [
    // Sosyal Medya Yönetimi Müşterileri
    { id: 'tevfik', name: 'Tevfik Usta', color: '#795548', category: 'SOSYAL_MEDYA', contractType: 'RETAINER', active: true, instagramHandle: '@tevfikusta' },
    { id: 'bykasap', name: 'ByKasap', color: '#D32F2F', category: 'SOSYAL_MEDYA', contractType: 'RETAINER', active: true, instagramHandle: '@bykasap' },
    { id: 'ikra', name: 'İkra Giyim', color: '#E91E63', category: 'SOSYAL_MEDYA', contractType: 'RETAINER', active: true, instagramHandle: '@ikragiyim' },
    { id: 'zeytindali', name: 'Zeytindalı Gıda', color: '#6B8E23', category: 'SOSYAL_MEDYA', contractType: 'RETAINER', active: true, instagramHandle: '@zeytindaligida' },
    { id: 'valora', name: 'Valora Psikoloji', color: '#9C27B0', category: 'SOSYAL_MEDYA', contractType: 'RETAINER', active: true, instagramHandle: '@valorapsikoloji' },
    { id: 'zoks', name: 'Zoks Studio', color: '#FF5722', category: 'SOSYAL_MEDYA', contractType: 'RETAINER', active: true, instagramHandle: '@zoksstudio' },
    { id: 'alihaydar', name: 'Ali Haydar Ocakbaşı', color: '#2196F3', category: 'SOSYAL_MEDYA', contractType: 'RETAINER', active: true, instagramHandle: '@alihaydarocakbasi' },

    // Video / Proje Bazlı Müşteriler
    { id: 'hairchef', name: 'Hair Chef', color: '#607D8B', category: 'VIDEO', contractType: 'PROJECT', active: true },
    { id: 'ceotekmer', name: 'CEOTekmer', color: '#3F51B5', category: 'VIDEO', contractType: 'PROJECT', active: true },
    { id: 'hubeyb', name: 'Hubeyb Karaca', color: '#00BCD4', category: 'VIDEO', contractType: 'PROJECT', active: true },
    { id: 'aysenur', name: 'Ressam Ayşenur Saylan', color: '#FF9800', category: 'VIDEO', contractType: 'PROJECT', active: true },
    { id: 'durumcu', name: 'Dürümcü Dede', color: '#8D6E63', category: 'VIDEO', contractType: 'PROJECT', active: true },
    { id: 'biradli', name: 'Biradlı Suni Deri', color: '#4CAF50', category: 'VIDEO', contractType: 'PROJECT', active: true },

    // Dahili
    { id: 'noco', name: 'NOCO Creative', color: '#F6D73C', category: 'DAHILI', contractType: 'RETAINER', active: true },
];

// Yardımcı fonksiyonlar
export const getBrandById = (id: string): Brand | undefined => brands.find(b => b.id === id);
export const getBrandColor = (id: string): string => getBrandById(id)?.color || '#6B7B80';
export const getBrandName = (id: string): string => getBrandById(id)?.name || id;
export const getActiveBrands = (): Brand[] => brands.filter(b => b.active);
export const getSocialMediaBrands = (): Brand[] => brands.filter(b => b.category === 'SOSYAL_MEDYA' && b.active);

// ========================================
// EKİP ÜYELERİ (DEPRECATED - Use lib/actions/users.ts)
// ========================================
/*
export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'OWNER' | 'OPS' | 'DIGITAL' | 'STUDIO' | 'CLIENT';
    avatar?: string;
    phone?: string;
    active: boolean;
}

export const teamMembers: TeamMember[] = [
    { id: '1', name: 'Admin', email: 'admin@noco.studio', role: 'OWNER', active: true },
    { id: '3', name: 'Şeyma Bora', email: 'seyma@noco.studio', role: 'DIGITAL', active: true },
    { id: '4', name: 'Fatih Ustaosmanoğlu', email: 'fatih@noco.studio', role: 'DIGITAL', active: true },
    { id: '5', name: 'Ayşegül Güler', email: 'aysegul@noco.studio', role: 'DIGITAL', active: true },
    { id: '6', name: 'Ahmet Gürkan Turhan', email: 'ahmet@noco.studio', role: 'OPS', active: true },
];

export const getTeamMember = (id: string): TeamMember | undefined => teamMembers.find(m => m.id === id);
export const getTeamMemberByName = (name: string): TeamMember | undefined => teamMembers.find(m => m.name === name);
export const getActiveTeamMembers = (): TeamMember[] => teamMembers.filter(m => m.active && m.role !== 'OWNER');
*/

// ========================================
// İÇERİK TÜRLERİ VE DURUMLARI (Dinamik Aşamalar)
// ========================================
// ========================================
// İÇERİK TÜRLERİ VE DURUMLARI (Dinamik Aşamalar)
// ========================================
export type ContentStatus =
    | 'PLANLANDI'       // Planlanacak (En baş)
    | 'ICERIK_HAZIRLANDI' // Metin/Copy
    | 'CEKILDI'
    | 'FOTOGRAF_RETOUCH'
    | 'TASARLANIYOR'
    | 'TASARLANDI'
    | 'KURGULANIYOR'
    | 'KURGULANDI'
    | 'ONAY'            // Onay Bekliyor
    | 'PAYLASILD'       // Sonuç
    | 'TESLIM';         // Sonuç

export type ContentType = 'VIDEO' | 'POST' | 'FOTOGRAF' | 'REKLAM' | 'RAPOR' | 'TEKLIF' | 'WEB' | 'PODCAST';

export const contentStatuses: Record<string, { label: string; color: string; icon: string }> = {
    // Content statuses
    PLANLANDI: { label: 'Planlanacak', color: '#6B7B80', icon: '📅' },
    ICERIK_HAZIRLANDI: { label: 'İçerik Hazırlandı', color: '#795548', icon: '📝' },
    CEKILDI: { label: 'Çekildi', color: '#2196F3', icon: '📷' },
    FOTOGRAF_RETOUCH: { label: 'Fotoğraf Retouch', color: '#9C27B0', icon: '🎨' },
    TASARLANIYOR: { label: 'Tasarlanıyor', color: '#FF9800', icon: '🖌️' },
    TASARLANDI: { label: 'Tasarlandı', color: '#F6D73C', icon: '🖼️' },
    KURGULANIYOR: { label: 'Kurgulanıyor', color: '#2196F3', icon: '✂️' },
    KURGULANDI: { label: 'Kurgulandı', color: '#4CAF50', icon: '🎬' },
    ONAY: { label: 'Onay Bekliyor', color: '#FF5722', icon: '⏳' },
    PAYLASILD: { label: 'Paylaşıldı', color: '#00F5B0', icon: '✅' },
    TESLIM: { label: 'Teslim Edildi', color: '#00F5B0', icon: '📦' },

    // Task statuses (fallback - birleşik tablo için)
    TODO: { label: 'Yapılacak', color: '#6B7B80', icon: '📋' },
    IN_PROGRESS: { label: 'Devam Ediyor', color: '#FF9800', icon: '🔄' },
    IN_REVIEW: { label: 'İnceleniyor', color: '#9C27B0', icon: '👀' },
    BLOCKED: { label: 'Engellendi', color: '#E91E63', icon: '🚫' },
};

// Basitleştirilmiş Status Helper
export const getSimpleStatus = (status: ContentStatus): 'TODO' | 'DONE' => {
    const doneStatuses: string[] = ['PAYLASILD', 'TESLIM'];
    return doneStatuses.includes(status) ? 'DONE' : 'TODO';
};

export const contentTypes: Record<ContentType, { label: string; icon: string; color: string }> = {
    VIDEO: { label: 'Video', icon: '🎬', color: '#9C27B0' },
    PODCAST: { label: 'Podcast', icon: '🎙️', color: '#795548' },
    FOTOGRAF: { label: 'Fotoğraf', icon: '📷', color: '#FF9800' },
    POST: { label: 'Post', icon: '📸', color: '#329FF5' },
    REKLAM: { label: 'Reklam', icon: '📢', color: '#F44336' },
    RAPOR: { label: 'Rapor', icon: '📊', color: '#00F5B0' },
    TEKLIF: { label: 'Teklif', icon: '📝', color: '#607D8B' },
    WEB: { label: 'Web Sitesi', icon: '🌐', color: '#3F51B5' },
};

// Türe göre aşama akışı (dinamik workflow)
export const contentTypeStages: Record<ContentType, ContentStatus[]> = {
    // 1. Video & Podcast: Çekim ve kurgu odaklı
    VIDEO: ['PLANLANDI', 'CEKILDI', 'KURGULANIYOR', 'KURGULANDI', 'ONAY', 'PAYLASILD'],
    PODCAST: ['PLANLANDI', 'CEKILDI', 'KURGULANIYOR', 'KURGULANDI', 'ONAY', 'PAYLASILD'],

    // 2. Fotoğraf: Görsel işleme odaklı
    FOTOGRAF: ['PLANLANDI', 'CEKILDI', 'FOTOGRAF_RETOUCH', 'ONAY', 'PAYLASILD'],

    // 3. Post & Reklam: Tasarım ve planlama odaklı
    POST: ['PLANLANDI', 'ICERIK_HAZIRLANDI', 'TASARLANIYOR', 'TASARLANDI', 'ONAY', 'PAYLASILD'],
    REKLAM: ['PLANLANDI', 'ICERIK_HAZIRLANDI', 'TASARLANIYOR', 'TASARLANDI', 'ONAY', 'PAYLASILD'],

    // 4. Rapor, Teklif & Web: Dokümantasyon
    RAPOR: ['PLANLANDI', 'ICERIK_HAZIRLANDI', 'TASARLANIYOR', 'TASARLANDI', 'TESLIM'],
    TEKLIF: ['PLANLANDI', 'ICERIK_HAZIRLANDI', 'TASARLANIYOR', 'TASARLANDI', 'TESLIM'],
    WEB: ['PLANLANDI', 'ICERIK_HAZIRLANDI', 'TASARLANIYOR', 'TASARLANDI', 'TESLIM'],
};

// İçerik türüne göre mevcut aşamaları getir
export const getStagesForType = (type: ContentType): ContentStatus[] => contentTypeStages[type] || [];

// Sonraki aşamayı hesapla
export const getNextStage = (type: ContentType, currentStatus: ContentStatus): ContentStatus | null => {
    const stages = getStagesForType(type);
    const currentIndex = stages.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= stages.length - 1) return null;
    return stages[currentIndex + 1];
};

// İlerleme yüzdesini hesapla
export const getProgressPercent = (type: ContentType, currentStatus: ContentStatus): number => {
    const stages = getStagesForType(type);
    const currentIndex = stages.indexOf(currentStatus);
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / stages.length) * 100);
};

// ========================================
// ETKİNLİK TÜRLERİ (Takvim için)
// ========================================
export type EventType = 'DEADLINE' | 'ICERIK_YAYINI' | 'CEKIM' | 'INCELEME' | 'DIGER';

export const eventTypes: Record<EventType, { label: string; color: string; icon: string }> = {
    DEADLINE: { label: 'Son Tarih', color: '#FF4242', icon: '🔴' },
    ICERIK_YAYINI: { label: 'İçerik Yayını', color: '#F6D73C', icon: '🟡' },
    CEKIM: { label: 'Çekim', color: '#795548', icon: '🟤' },
    INCELEME: { label: 'İnceleme', color: '#FFAB40', icon: '🟠' },
    DIGER: { label: 'Diğer', color: '#6B7B80', icon: '⚫' },
};

// ========================================
// AKTİVİTE LOG TÜRLERİ
// ========================================
export type ActivityType =
    | 'CONTENT_CREATED'
    | 'CONTENT_UPDATED'
    | 'CONTENT_PUBLISHED'
    | 'CONTENT_DELETED'
    | 'SHOOT_SCHEDULED'
    | 'SHOOT_COMPLETED'
    | 'INVOICE_CREATED'
    | 'INVOICE_PAID'
    | 'PROPOSAL_SENT'
    | 'PROPOSAL_APPROVED'
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'SETTINGS_CHANGED'
    | 'REPORT_GENERATED'
    | 'FILE_UPLOADED'
    | 'FILE_DELETED';

export interface ActivityLogEntry {
    id: string;
    userId: string;
    userName: string;
    type: ActivityType;
    action: string;
    target: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
}

// ========================================
// PROJE DURUMLARI
// ========================================
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export const projectStatuses: Record<ProjectStatus, { label: string; color: string }> = {
    DRAFT: { label: 'Taslak', color: '#6B7B80' },
    ACTIVE: { label: 'Aktif', color: '#00F5B0' },
    ON_HOLD: { label: 'Beklemede', color: '#F6D73C' },
    COMPLETED: { label: 'Tamamlandı', color: '#4CAF50' },
    CANCELLED: { label: 'İptal', color: '#FF4242' },
};

// ========================================
// FATURA DURUMLARI
// ========================================
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export const invoiceStatuses: Record<InvoiceStatus, { label: string; color: string }> = {
    DRAFT: { label: 'Taslak', color: '#6B7B80' },
    SENT: { label: 'Gönderildi', color: '#329FF5' },
    PAID: { label: 'Ödendi', color: '#00F5B0' },
    OVERDUE: { label: 'Gecikmiş', color: '#FF4242' },
    CANCELLED: { label: 'İptal', color: '#6B7B80' },
};
