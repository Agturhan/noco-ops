/**
 * NOCO Creative - Centralized Pricing Data
 * Single source of truth for all service pricing.
 */

// ===== TYPES =====
export interface ServiceItem {
    id: string;
    name: string;
    description?: string;
    category: 'SOCIAL' | 'VIDEO' | 'STUDIO' | 'PHOTO' | 'DESIGN' | 'CONSULTING';
    unit: 'AYLIK' | 'VIDEO' | 'SAAT' | 'GÜN' | 'ADET' | 'PAKET' | 'KARE';
    unitPrice: number;
    incomeType: 'RECURRING' | 'PROJECT';
    note?: string;
}

export interface PackageItem {
    id: string;
    name: string;
    price: number;
    color: string;
    features: string[];
    popular?: boolean;
    videoCount?: number;
    postCount?: number;
    storyCount?: number;
    shootingHours?: number;
    includesAds?: boolean; // Meta Reklam Yönetimi dahil mi
}

// ===== PACKAGES =====
export const SM_PACKAGES: PackageItem[] = [
    {
        id: 'starter',
        name: 'STARTER',
        price: 27900,
        color: '#329FF5',
        features: ['3 Video / ay', '2 Post / ay', '3 Saat Çekim Dahil', 'İçerik Paylaşımı', 'Temel Raporlama'],
        videoCount: 3,
        postCount: 2,
        shootingHours: 3,
        includesAds: false,
    },
    {
        id: 'growth',
        name: 'GROWTH',
        price: 49900, // Updated from 42500
        color: '#00F5B0',
        popular: true,
        features: ['4 Video / ay', '3 Post / ay', '~20 Story / ay', '½ Gün Çekim Dahil', 'Meta Reklam Yönetimi', 'Aylık Raporlama'],
        videoCount: 4,
        postCount: 3,
        storyCount: 20,
        shootingHours: 4,
        includesAds: true,
    },
    {
        id: 'pro',
        name: 'PRO',
        price: 69900,
        color: '#F6D73C',
        features: ['6 Video / ay', '4 Post / ay', '~30 Story / ay', '1 Gün Çekim Dahil', 'Meta Reklam Yönetimi', 'Detaylı Analiz', 'Haftalık Rapor'],
        videoCount: 6,
        postCount: 4,
        storyCount: 30,
        shootingHours: 8,
        includesAds: true,
    },
    {
        id: 'enterprise',
        name: 'ENTERPRISE',
        price: 159900,
        color: '#FF4242',
        features: ['8+ Video / ay', '6 Post / ay', 'Günlük Story', '2 Gün Çekim Dahil', 'Meta Reklam Yönetimi', 'Strateji Danışmanlığı', 'Dedicated Account Manager'],
        videoCount: 8,
        postCount: 6,
        shootingHours: 16,
        includesAds: true,
    },
];

// Studio Reels specific type
export interface StudioReelsPackage {
    id: string;
    name: string;
    price: number;
    color: string;
    features: string[];
    hours: number;
    videos: number;
    perVideo: number;
}

export const STUDIO_REELS_PACKAGES: StudioReelsPackage[] = [
    { id: 'basic', name: 'BASIC', price: 22500, color: '#2997FF', features: ['2 Saat Çekim', '6 Video'], hours: 2, videos: 6, perVideo: 3750 },
    { id: 'dinamik', name: 'DİNAMİK', price: 39900, color: '#2997FF', features: ['3 Saat Çekim', '6 Video'], hours: 3, videos: 6, perVideo: 6650 },
    { id: 'deluxe', name: 'DELUXE', price: 69900, color: '#2997FF', features: ['4 Saat Çekim', '12 Video'], hours: 4, videos: 12, perVideo: 5825 },
];

// ===== UNIT SERVICES =====
export const SERVICES: ServiceItem[] = [
    // ÇEKİM (Shooting)
    { id: 'cekim-tam', name: 'Tam Gün Çekim', description: '8 saat saha/stüdyo çekimi', category: 'VIDEO', unit: 'GÜN', unitPrice: 17000, incomeType: 'PROJECT' },
    { id: 'cekim-yarim', name: 'Yarım Gün Çekim', description: '4 saat çekim', category: 'VIDEO', unit: 'PAKET', unitPrice: 8500, incomeType: 'PROJECT' },
    { id: 'cekim-saat', name: 'Saatlik Çekim', description: 'Ek saat', category: 'VIDEO', unit: 'SAAT', unitPrice: 2125, incomeType: 'PROJECT', note: '17000/8' },

    // KURGU (Editing)
    { id: 'kurgu', name: 'Video Kurgu', description: 'Profesyonel kurgu', category: 'VIDEO', unit: 'VIDEO', unitPrice: 3200, incomeType: 'PROJECT' },
    { id: 'tek-video', name: 'Tek Video Prodüksiyon', description: 'Çekim + Kurgu + Tasarım + Müzik', category: 'VIDEO', unit: 'VIDEO', unitPrice: 19900, incomeType: 'PROJECT' },
    { id: 'sm-video', name: 'SM Video (Birim)', description: 'Sosyal medya video', category: 'VIDEO', unit: 'VIDEO', unitPrice: 6500, incomeType: 'PROJECT', note: 'Kurgu + Tasarım' },

    // REKLAM
    { id: 'reklam-50k', name: 'Reklam Yönetimi (≤50K)', description: 'Aylık bütçe 50K ve altı', category: 'CONSULTING', unit: 'AYLIK', unitPrice: 7500, incomeType: 'RECURRING' },
    { id: 'demo', name: 'Ajans Demo Çalışma', description: '1 Video + 1 Ay Reklam', category: 'CONSULTING', unit: 'PAKET', unitPrice: 27400, incomeType: 'PROJECT', note: '19.900 + 7.500' },

    // PODCAST
    { id: 'podcast-studio', name: 'Podcast Stüdyo', description: 'Ekipman + Mekan', category: 'STUDIO', unit: 'SAAT', unitPrice: 2600, incomeType: 'PROJECT' },
    { id: 'podcast-operator', name: 'Podcast Operatör', description: 'Profesyonel ses/görüntü', category: 'STUDIO', unit: 'SAAT', unitPrice: 1500, incomeType: 'PROJECT' },
    { id: 'podcast-kurgu', name: 'Podcast Kurgu', description: 'Basit kurgu (1 saat)', category: 'VIDEO', unit: 'VIDEO', unitPrice: 2900, incomeType: 'PROJECT' },

    // FOTOĞRAF
    { id: 'foto-saat', name: 'Stüdyo Kiralama (Saatlik)', category: 'STUDIO', unit: 'SAAT', unitPrice: 2600, incomeType: 'PROJECT' },
    { id: 'foto-yarim', name: 'Stüdyo Kiralama (Yarım Gün)', description: '4 saat', category: 'STUDIO', unit: 'PAKET', unitPrice: 9100, incomeType: 'PROJECT' },
    { id: 'foto-tam', name: 'Stüdyo Kiralama (Tam Gün)', description: '8 saat', category: 'STUDIO', unit: 'PAKET', unitPrice: 14500, incomeType: 'PROJECT' },
    { id: 'foto-operator', name: 'Fotoğraf Operatör (Günlük)', description: '8 saat', category: 'PHOTO', unit: 'GÜN', unitPrice: 12000, incomeType: 'PROJECT' },
    { id: 'retouch-basic', name: 'Basic Retouch', description: 'Temel düzenleme', category: 'PHOTO', unit: 'KARE', unitPrice: 320, incomeType: 'PROJECT' },
    { id: 'retouch-detay', name: 'Detaylı Retouch', description: 'İleri düzey', category: 'PHOTO', unit: 'KARE', unitPrice: 1450, incomeType: 'PROJECT' },

    // TASARIM
    { id: 'post-tasarim', name: 'Post Tasarımı', description: 'Sosyal medya görseli', category: 'DESIGN', unit: 'ADET', unitPrice: 2000, incomeType: 'PROJECT', note: '~tahmini' },
    { id: 'story', name: 'Story Tasarımı', description: 'Dikey format', category: 'DESIGN', unit: 'ADET', unitPrice: 300, incomeType: 'PROJECT', note: '~tahmini' },
    { id: 'operasyon', name: 'Aylık Operasyon', description: 'İçerik paylaşımı/koordinasyon', category: 'CONSULTING', unit: 'AYLIK', unitPrice: 4500, incomeType: 'RECURRING', note: '~tahmini' },

    // AI VIDEO (Yapay Zeka Video Prodüksiyon)
    { id: 'ai-video-30s', name: 'AI Video Basic', description: '≤30sn Yapay Zeka Video (0.75 gün)', category: 'VIDEO', unit: 'VIDEO', unitPrice: 29900, incomeType: 'PROJECT', note: 'Maliyet: ₺14,750' },
    { id: 'ai-video-60s', name: 'AI Video Standard', description: '≤1dk Yapay Zeka Video (1.5 gün)', category: 'VIDEO', unit: 'VIDEO', unitPrice: 55000, incomeType: 'PROJECT', note: 'Maliyet: ₺27,500' },
    { id: 'ai-video-120s', name: 'AI Video Premium', description: '≤2dk Yapay Zeka Video (2.5 gün)', category: 'VIDEO', unit: 'VIDEO', unitPrice: 89900, incomeType: 'PROJECT', note: 'Maliyet: ₺44,500' },
];

// ===== HELPERS =====

export function getServiceById(id: string): ServiceItem | undefined {
    return SERVICES.find(s => s.id === id);
}

export function getServicesByCategory(category: ServiceItem['category']): ServiceItem[] {
    return SERVICES.filter(s => s.category === category);
}

export function getPackageById(id: string): PackageItem | undefined {
    return SM_PACKAGES.find(p => p.id === id) || STUDIO_REELS_PACKAGES.find(p => p.id === id);
}

// Format currency for display
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
}

// Calculate VAT (20%)
export const VAT_RATE = 0.20;
export function calculateVAT(subtotal: number): { kdv: number; total: number } {
    const kdv = subtotal * VAT_RATE;
    return { kdv, total: subtotal + kdv };
}

// Max discount rate
export const MAX_DISCOUNT_RATE = 0.25;

// AI Video Volume Discount (max 25%)
// Quantity-based discount tiers for AI Video services
export interface VolumeDiscount {
    minQuantity: number;
    discountRate: number;
}

export const AI_VIDEO_VOLUME_DISCOUNTS: VolumeDiscount[] = [
    { minQuantity: 1, discountRate: 0 },      // 1 video: 0%
    { minQuantity: 2, discountRate: 0.05 },   // 2 video: 5%
    { minQuantity: 3, discountRate: 0.10 },   // 3 video: 10%
    { minQuantity: 5, discountRate: 0.15 },   // 5+ video: 15%
    { minQuantity: 8, discountRate: 0.20 },   // 8+ video: 20%
    { minQuantity: 10, discountRate: 0.25 },  // 10+ video: 25% (max)
];

export function getAIVideoVolumeDiscount(quantity: number): number {
    let discountRate = 0;
    for (const tier of AI_VIDEO_VOLUME_DISCOUNTS) {
        if (quantity >= tier.minQuantity) {
            discountRate = tier.discountRate;
        }
    }
    return Math.min(discountRate, MAX_DISCOUNT_RATE);
}

export function calculateAIVideoPrice(serviceId: string, quantity: number): { unitPrice: number; discountedPrice: number; discount: number; total: number } {
    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) {
        throw new Error(`AI Video service not found: ${serviceId}`);
    }

    const unitPrice = service.unitPrice;
    const discountRate = getAIVideoVolumeDiscount(quantity);
    const discountedPrice = Math.round(unitPrice * (1 - discountRate));
    const total = discountedPrice * quantity;

    return {
        unitPrice,
        discountedPrice,
        discount: discountRate * 100,
        total
    };
}

// ===== PRODUCTION CAPACITY CONFIG =====
// AI intent → deterministic pricing engine

export interface ShootCapacity {
    id: string;
    hours: number;
    reelsMin: number;
    reelsMax: number;
    price: number;
}

export interface VideoDurationMultiplier {
    maxSeconds: number;
    label: string;
    multiplier: number;
}

export const PRODUCTION_CAPACITY = {
    shoots: [
        { id: 'cekim-3s', hours: 3, reelsMin: 3, reelsMax: 4, price: 6375 },
        { id: 'cekim-yarim', hours: 4, reelsMin: 5, reelsMax: 6, price: 8500 },
        { id: 'cekim-tam', hours: 8, reelsMin: 10, reelsMax: 12, price: 17000 },
    ] as ShootCapacity[],

    // Video duration → price multiplier (base = 1dk = 3200 TL)
    videoDuration: [
        { maxSeconds: 60, label: 'Kısa (≤1dk)', multiplier: 1.0 },
        { maxSeconds: 90, label: 'Orta (1-1.5dk)', multiplier: 1.3 },
        { maxSeconds: 120, label: 'Uzun (1.5-2dk)', multiplier: 1.5 },
    ] as VideoDurationMultiplier[],

    baseKurguPrice: 3200,
} as const;

// AI/LLM intent extraction output type
export interface AIIntent {
    reelsCount?: number;
    shootingHours?: number;
    videoDurationSeconds?: number; // default 60
    months?: number;
    metaAds?: boolean;
    photoCount?: number;
    photoAngles?: number;
    detailedRetouch?: boolean;
    podcastHours?: number;
    packageHint?: string; // "growth", "pro", etc.
    customNote?: string;
}

// Pick optimal shoot package based on reels count
export function pickShootPackage(reelsCount: number): { package: ShootCapacity; quantity: number } {
    const shoots = PRODUCTION_CAPACITY.shoots;

    // 4 or less → 3 hour
    if (reelsCount <= shoots[0].reelsMax) {
        return { package: shoots[0], quantity: 1 };
    }
    // 6 or less → half day
    if (reelsCount <= shoots[1].reelsMax) {
        return { package: shoots[1], quantity: 1 };
    }
    // 12 or less → full day
    if (reelsCount <= shoots[2].reelsMax) {
        return { package: shoots[2], quantity: 1 };
    }
    // More than 12 → multiple full days
    const days = Math.ceil(reelsCount / shoots[2].reelsMax);
    return { package: shoots[2], quantity: days };
}

// Get kurgu price based on video duration
export function getKurguPrice(durationSeconds: number = 60): number {
    const base = PRODUCTION_CAPACITY.baseKurguPrice;
    const durations = PRODUCTION_CAPACITY.videoDuration;

    for (const d of durations) {
        if (durationSeconds <= d.maxSeconds) {
            return Math.round(base * d.multiplier);
        }
    }
    // Over 2 minutes → custom pricing (2x base)
    return base * 2;
}

// Get duration label
export function getDurationLabel(durationSeconds: number): string {
    for (const d of PRODUCTION_CAPACITY.videoDuration) {
        if (durationSeconds <= d.maxSeconds) {
            return d.label;
        }
    }
    return 'Çok Uzun (2dk+)';
}

// Generate capacity context for AI prompt
export function getCapacityContext(): string {
    const lines = [
        '## Üretim Kapasitesi Kuralları',
        '',
        '### Çekim → Video Kapasitesi',
        ...PRODUCTION_CAPACITY.shoots.map(s =>
            `- ${s.hours} saat çekim = ${s.reelsMin}-${s.reelsMax} Reels (₺${s.price.toLocaleString('tr-TR')})`
        ),
        '',
        '### Video Kurgu Süre Çarpanları (Baz: ₺3,200)',
        ...PRODUCTION_CAPACITY.videoDuration.map(d =>
            `- ${d.label} = ₺${Math.round(PRODUCTION_CAPACITY.baseKurguPrice * d.multiplier).toLocaleString('tr-TR')}`
        ),
        '- 2dk+ = Özel fiyatlandırma (2x)',
        '',
        '### Operasyonel Limitler (MÜFREDAT)',
        '1. Fotoğraf Çekimi: 1 Operatör günde MAKSİMUM 100 ürün çekebilir.',
        '   - Örnek: 10,000 ürün için 10000/100 = 100 GÜN operatör gerekir (veya 100 operatör).',
        '2. Retouch: 1 kişi günde 500 kare (Basic) / 200 kare (Detaylı) işleyebilir.',
        '3. Video Kurgu: 1 kurgucu günde 5 video tamamlayabilir.',
        '4. Podcast: Stüdyo ve operatör saatlik kiralanır.',
        'ÖNEMLİ: 10.000 adet gibi büyük hacimli işlerde LÜTFEN "GÜN" bazında hesapla. 1 günde bitmez.',
    ];
    return lines.join('\n');
}

// Get all valid service IDs (allowlist for AI)
export function getValidServiceIds(): string[] {
    const ids = [
        ...SERVICES.map(s => s.id),
        ...SM_PACKAGES.map(p => `sm-${p.id}`),
        ...STUDIO_REELS_PACKAGES.map(p => `reels-${p.id}`),
        ...PRODUCTION_CAPACITY.shoots.map(s => s.id),
    ];
    return ids;
}
