-- NOCO Ops - Client Schema FIX
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- Mevcut 'Client' tablosuna eksik kolonları ekliyoruz
DO $$
BEGIN
    -- instagramHandle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Client' AND column_name = 'instagramHandle') THEN
        ALTER TABLE "Client" ADD COLUMN "instagramHandle" TEXT;
    END IF;

    -- monthlyFee
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Client' AND column_name = 'monthlyFee') THEN
        ALTER TABLE "Client" ADD COLUMN "monthlyFee" DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Client' AND column_name = 'color') THEN
        ALTER TABLE "Client" ADD COLUMN "color" TEXT DEFAULT '#6B7B80';
    END IF;

    -- category
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Client' AND column_name = 'category') THEN
        ALTER TABLE "Client" ADD COLUMN "category" TEXT DEFAULT 'SOSYAL_MEDYA';
    END IF;
    
    -- contractType
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Client' AND column_name = 'contractType') THEN
        ALTER TABLE "Client" ADD COLUMN "contractType" TEXT DEFAULT 'RETAINER';
    END IF;

    -- currency
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Client' AND column_name = 'currency') THEN
        ALTER TABLE "Client" ADD COLUMN "currency" TEXT DEFAULT 'TRY';
    END IF;

    -- isActive
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Client' AND column_name = 'isActive') THEN
        ALTER TABLE "Client" ADD COLUMN "isActive" BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Şimdi verileri tekrar eklemeyi deneyelim (ON CONFLICT ile güncelleme yapacağız)
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
    "contractType" = EXCLUDED."contractType";
