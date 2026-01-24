export const smPackages = [
    {
        id: 'starter',
        name: 'STARTER',
        price: 27900,
        color: '#329FF5',
        features: ['3 Video / ay', '2 Post / ay', 'İçerik Paylaşımı', 'Temel Raporlama'],
        videoCount: 3,
        postCount: 2,
    },
    {
        id: 'growth',
        name: 'GROWTH',
        price: 42500,
        color: '#00F5B0',
        popular: true,
        features: ['4 Video / ay', '3 Post / ay', '~20 Story / ay', 'Aylık Raporlama', 'İçerik Takvimi'],
        videoCount: 4,
        postCount: 3,
        storyCount: 20,
    },
    {
        id: 'pro',
        name: 'PRO',
        price: 69900,
        color: '#F6D73C',
        features: ['6 Video / ay', '4 Post / ay', '~30 Story / ay', 'Detaylı Analiz', 'Haftalık Rapor', 'Rakip Analizi'],
        videoCount: 6,
        postCount: 4,
        storyCount: 30,
    },
    {
        id: 'enterprise',
        name: 'ENTERPRISE',
        price: 159900,
        color: '#FF4242',
        features: ['8+ Video / ay', '6 Post / ay', 'Günlük Story', 'Strateji Danışmanlığı', 'Aylık Sunum', '2 Prof. Çekim', 'Owner-Level Yönetim'],
        videoCount: 8,
        postCount: 6,
    },
];

export const studioReelsPackages = [
    { id: 'basic', name: 'BASIC', hours: 2, videos: 6, price: 22500, perVideo: 3750 },
    { id: 'dinamik', name: 'DİNAMİK', hours: 3, videos: 6, price: 39900, perVideo: 6650 },
    { id: 'deluxe', name: 'DELUXE', hours: 4, videos: 12, price: 69900, perVideo: 5825 },
];

export const unitPrices = {
    video: [
        { id: 'tek-video', name: 'Tek Video Prodüksiyon', description: 'Çekim + Kurgu + Tasarım + Müzik + Paylaşım', price: 19900, unit: 'video' },
        { id: 'sm-video', name: 'SM Video (Eşdeğer)', description: 'Sosyal medya video üretimi', price: 6500, unit: 'video', note: '~tahmini' },
    ],
    reklam: [
        { id: 'reklam-50k', name: 'Reklam Yönetimi (≤50K)', description: 'Aylık bütçe 50.000₺ ve altı', price: 7500, unit: 'ay' },
        { id: 'reklam-50k+', name: 'Reklam Yönetimi (>50K)', description: 'Bütçenin %15\'i', price: 0, unit: 'ay', note: '%15 komisyon' },
        { id: 'demo', name: 'Ajans Demo Çalışma', description: '1 Video + 1 Ay Reklam Yönetimi', price: 27400, unit: 'paket', note: '19.900 + 7.500' },
    ],
    podcast: [
        { id: 'podcast-studio', name: 'Stüdyo (Podcast)', description: 'Ekipman + Mekan', price: 2600, unit: 'saat' },
        { id: 'podcast-operator', name: 'Operatör', description: 'Profesyonel ses/görüntü', price: 1500, unit: 'saat' },
        { id: 'podcast-kurgu', name: 'Basit Kurgu', description: '1 saatlik kurgu işi', price: 2900, unit: 'video' },
    ],
    foto: [
        { id: 'foto-saat', name: 'Stüdyo Kiralama (Saatlik)', description: '', price: 2600, unit: 'saat' },
        { id: 'foto-yarim', name: 'Stüdyo Kiralama (Yarım Gün)', description: '4 saat', price: 9100, unit: 'paket' },
        { id: 'foto-tam', name: 'Stüdyo Kiralama (Tam Gün)', description: '8 saat', price: 14500, unit: 'paket' },
        { id: 'foto-operator', name: 'Operatör (Günlük)', description: '8 saat', price: 12000, unit: 'gün' },
        { id: 'retouch-basic', name: 'Basic Retouch', description: 'Temel düzenleme', price: 320, unit: 'kare' },
        { id: 'retouch-detay', name: 'Detaylı Retouch', description: 'İleri düzey düzenleme', price: 1450, unit: 'kare' },
    ],
    tasarim: [
        { id: 'post-tasarim', name: 'Post Tasarımı', description: 'Sosyal medya görseli', price: 2000, unit: 'adet', note: '~tahmini' },
        { id: 'story', name: 'Story', description: 'Dikey format görsel', price: 300, unit: 'adet', note: '~tahmini' },
        { id: 'operasyon', name: 'Aylık Operasyon', description: 'İçerik paylaşımı/koordinasyon', price: 4500, unit: 'ay', note: '~tahmini' },
    ],
};
