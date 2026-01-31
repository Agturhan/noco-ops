-- NOCO Ops - Seed Fix
-- "client_name_unique" hatası için çözüm

-- 1. Önce, bizim istediğimiz ID'ye sahip olmayan ama İSMİ aynı olan kayıtları temizleyelim.
-- Çünkü biz 'tevfik', 'bykasap' gibi ID'leri zorlamak istiyoruz (Mevcut içeriklerle eşleşmesi için).
-- Eğer sistemde UUID ile oluşturulmuş 'Tevfik Usta' varsa, onu silip yerine 'tevfik' ID'li olanı koyacağız.

DELETE FROM "Client" 
WHERE "name" IN (
    'Tevfik Usta', 'ByKasap', 'İkra Giyim', 'Zeytindalı Gıda', 'Valora Psikoloji', 
    'Zoks Studio', 'Ali Haydar Ocakbaşı', 'Hair Chef', 'CEOTekmer', 
    'Hubeyb Karaca', 'Ressam Ayşenur Saylan', 'Dürümcü Dede', 
    'Biradlı Suni Deri', 'NOCO Creative'
) 
AND "id" NOT IN (
    'tevfik', 'bykasap', 'ikra', 'zeytindali', 'valora', 'zoks', 'alihaydar',
    'hairchef', 'ceotekmer', 'hubeyb', 'aysenur', 'durumcu', 'biradli', 'noco'
);

-- 2. Temizliği yaptıktan sonra verileri tekrar ekliyoruz/güncelliyoruz.
INSERT INTO "Client" ("id", "name", "color", "category", "contractType", "isActive", "instagramHandle", "monthlyFee") VALUES
    ('tevfik', 'Tevfik Usta', '#795548', 'SOSYAL_MEDYA', 'RETAINER', true, '@tevfikusta', 0),
    ('bykasap', 'ByKasap', '#D32F2F', 'SOSYAL_MEDYA', 'RETAINER', true, '@bykasap', 0),
    ('ikra', 'İkra Giyim', '#E91E63', 'SOSYAL_MEDYA', 'RETAINER', true, '@ikragiyim', 0),
    ('zeytindali', 'Zeytindalı Gıda', '#6B8E23', 'SOSYAL_MEDYA', 'RETAINER', true, '@zeytindaligida', 0),
    ('valora', 'Valora Psikoloji', '#9C27B0', 'SOSYAL_MEDYA', 'RETAINER', true, '@valorapsikoloji', 0),
    ('zoks', 'Zoks Studio', '#FF5722', 'SOSYAL_MEDYA', 'RETAINER', true, '@zoksstudio', 0),
    ('alihaydar', 'Ali Haydar Ocakbaşı', '#2196F3', 'SOSYAL_MEDYA', 'RETAINER', true, '@alihaydarocakbasi', 0),
    
    ('hairchef', 'Hair Chef', '#607D8B', 'VIDEO', 'PROJECT', true, NULL, 0),
    ('ceotekmer', 'CEOTekmer', '#3F51B5', 'VIDEO', 'PROJECT', true, NULL, 0),
    ('hubeyb', 'Hubeyb Karaca', '#00BCD4', 'VIDEO', 'PROJECT', true, NULL, 0),
    ('aysenur', 'Ressam Ayşenur Saylan', '#FF9800', 'VIDEO', 'PROJECT', true, NULL, 0),
    ('durumcu', 'Dürümcü Dede', '#8D6E63', 'VIDEO', 'PROJECT', true, NULL, 0),
    ('biradli', 'Biradlı Suni Deri', '#4CAF50', 'VIDEO', 'PROJECT', true, NULL, 0),
    
    ('noco', 'NOCO Creative', '#F6D73C', 'DAHILI', 'RETAINER', true, NULL, 0)
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "color" = EXCLUDED."color",
    "category" = EXCLUDED."category",
    "instagramHandle" = EXCLUDED."instagramHandle",
    "monthlyFee" = EXCLUDED."monthlyFee",
    "contractType" = EXCLUDED."contractType";
