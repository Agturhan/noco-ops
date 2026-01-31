-- NOCO Ops - Client Schema
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- 1. Client Table
CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6B7B80',
    "category" TEXT NOT NULL, -- SOSYAL_MEDYA, VIDEO, TASARIM, WEB, DAHILI
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "instagramHandle" TEXT,
    "contractType" TEXT, -- RETAINER, PROJECT, HOURLY
    "monthlyFee" DECIMAL(10, 2) DEFAULT 0, -- Anlaşma Bedeli
    "currency" TEXT DEFAULT 'TRY',
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. RLS Policies
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All For Authenticated" ON "Client";
CREATE POLICY "Allow All For Authenticated" ON "Client" FOR ALL USING (auth.role() = 'authenticated');

-- 3. Migration (Seed Data from lib/data.ts)
-- ID'leri korumak önemli çünkü mevcut Content tablosu bu ID'leri kullanıyor olabilir.
-- Eğer Content tablosu 'brandId' olarak string ID tutuyorsa (örn: 'tevfik'), burada da id olarak 'tevfik' kullanmalıyız.
-- Ancak standart UUID kullanmak daha iyidir. Content tablosunu kontrol etmeliyiz.
-- Content tablosunda brandId TEXT olarak tanımlı ve 'tevfik', 'bykasap' gibi değerler var.
-- Bu yüzden migration sırasında ID'leri aynen koruyacağız.

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
    "category" = EXCLUDED."category";

-- 4. UserHourlyCost Table (If not exists from finance schema)
CREATE TABLE IF NOT EXISTS "UserHourlyCost" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "hourlyCost" DECIMAL(10, 2) NOT NULL,
    "currency" TEXT DEFAULT 'TRY',
    "effectiveFrom" DATE DEFAULT CURRENT_DATE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    CONSTRAINT "UserHourlyCost_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users("id") ON DELETE CASCADE
);

ALTER TABLE "UserHourlyCost" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All For Authenticated" ON "UserHourlyCost";
CREATE POLICY "Allow All For Authenticated" ON "UserHourlyCost" FOR ALL USING (auth.role() = 'authenticated');
