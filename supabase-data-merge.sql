-- =====================================================
-- NOCO OPS - VERİ MODELİ BİRLEŞTİRME
-- =====================================================
-- Bu SQL'i Supabase'te çalıştırın
-- Mevcut veriler silinecek, sistem sıfırdan başlayacak

-- =====================================================
-- ADIM 1: Temiz başlangıç - Eski tabloları temizle
-- =====================================================

-- Mevcut Content tablosunu kaldır (Task'a taşınacak)
DROP TABLE IF EXISTS "Content" CASCADE;

-- =====================================================
-- ADIM 2: Task tablosunu genişlet (Content + Task birleşimi)
-- =====================================================

-- Task tablosu yoksa oluştur
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT DEFAULT 'NORMAL',
    "dueDate" DATE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "projectId" TEXT,
    "assigneeId" TEXT,
    "estimatedHours" DECIMAL,
    "actualHours" DECIMAL,
    "completedAt" TIMESTAMPTZ
);

-- Yeni alanları ekle (Content desteği için)
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "contentType" TEXT;
-- VIDEO, POST, FOTOGRAF, STORY, PODCAST, RAPOR, WEB, TEKLIF

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "publishDate" DATE;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assigneeIds" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "brandName" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "sourceType" TEXT DEFAULT 'task';
-- 'task' = genel görev, 'content' = içerik üretimi

-- RLS
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Task_all" ON "Task";
CREATE POLICY "Task_all" ON "Task" FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- ADIM 3: Client tablosunu düzenle (Brand = Client)
-- =====================================================

-- Client tablosu yoksa oluştur
CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL UNIQUE,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Yeni alanlar (marka olarak da kullanım için)
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "color" TEXT DEFAULT '#329FF5';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "category" TEXT;
-- SOSYAL_MEDYA, PAZARLAMA, KURUMSAL, BIREYSEL
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "contractType" TEXT;
-- MONTHLY, PROJECT, RETAINER

-- RLS
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Client_all" ON "Client";
CREATE POLICY "Client_all" ON "Client" FOR ALL USING (true) WITH CHECK (true);

-- name alanına unique constraint ekle (yoksa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'client_name_unique'
    ) THEN
        ALTER TABLE "Client" ADD CONSTRAINT client_name_unique UNIQUE ("name");
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- =====================================================
-- ADIM 4: User Settings tablosu (renk ayarları vb.)
-- =====================================================

CREATE TABLE IF NOT EXISTS "user_settings" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user_id" TEXT,
    "setting_key" TEXT NOT NULL,
    "setting_value" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- user_id + setting_key için unique constraint (ON CONFLICT için gerekli)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_user_key_unique'
    ) THEN
        ALTER TABLE "user_settings" ADD CONSTRAINT user_settings_user_key_unique UNIQUE ("user_id", "setting_key");
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

ALTER TABLE "user_settings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_all" ON "user_settings";
CREATE POLICY "settings_all" ON "user_settings" FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- ADIM 5: Varsayılan markalar (Client olarak)
-- =====================================================

-- email alanını nullable yap (mevcut tabloda NOT NULL olabilir)
ALTER TABLE "Client" ALTER COLUMN "email" DROP NOT NULL;

INSERT INTO "Client" ("id", "name", "color", "category", "contractType", "active") VALUES
    ('c-tevfik', 'Tevfik Usta', '#FF6B6B', 'SOSYAL_MEDYA', 'MONTHLY', true),
    ('c-bykasap', 'ByKasap', '#4ECDC4', 'SOSYAL_MEDYA', 'MONTHLY', true),
    ('c-ikra', 'İkra Giyim', '#45B7D1', 'SOSYAL_MEDYA', 'MONTHLY', true),
    ('c-zeytindali', 'Zeytindalı Gıda', '#96CEB4', 'SOSYAL_MEDYA', 'MONTHLY', true),
    ('c-valora', 'Valora Psikoloji', '#9B59B6', 'SOSYAL_MEDYA', 'MONTHLY', true),
    ('c-zoks', 'Zoks Studio', '#F39C12', 'SOSYAL_MEDYA', 'MONTHLY', true),
    ('c-alihaydar', 'Ali Haydar Ocakbaşı', '#E74C3C', 'SOSYAL_MEDYA', 'PROJECT', true),
    ('c-hairchef', 'Hair Chef', '#1ABC9C', 'SOSYAL_MEDYA', 'PROJECT', true),
    ('c-aysenur', 'Ressam Ayşenur Saylan', '#8E44AD', 'BIREYSEL', 'PROJECT', true),
    ('c-hubeyb', 'Hubeyb Karaca', '#2ECC71', 'BIREYSEL', 'PROJECT', true),
    ('c-ceotekmer', 'CEOTekmer', '#3498DB', 'KURUMSAL', 'PROJECT', true),
    ('c-durumcu', 'Dürümcü Dede', '#E67E22', 'SOSYAL_MEDYA', 'PROJECT', true),
    ('c-biradli', 'Biradlı Suni Deri', '#34495E', 'KURUMSAL', 'PROJECT', true),
    ('c-noco', 'NOCO Creative', '#329FF5', 'KURUMSAL', 'MONTHLY', true)
ON CONFLICT ("name") DO UPDATE SET
    "color" = EXCLUDED."color",
    "category" = EXCLUDED."category",
    "contractType" = EXCLUDED."contractType",
    "active" = EXCLUDED."active";

-- =====================================================
-- ADIM 6: Varsayılan member colors
-- =====================================================

INSERT INTO "user_settings" ("user_id", "setting_key", "setting_value")
VALUES (
    NULL,
    'member_colors',
    '{
        "Şeyma Bora": "#E91E63",
        "Fatih Ustaosmanoğlu": "#329FF5",
        "Ayşegül Güler": "#00F5B0",
        "Ahmet Gürkan Turhan": "#9C27B0"
    }'::jsonb
)
ON CONFLICT ("user_id", "setting_key") DO UPDATE
SET "setting_value" = EXCLUDED."setting_value";

-- =====================================================
-- DOĞRULAMA
-- =====================================================

SELECT 'Clients:' as info, COUNT(*) as count FROM "Client";
SELECT 'Tasks:' as info, COUNT(*) as count FROM "Task";
SELECT 'Settings:' as info, COUNT(*) as count FROM "user_settings";
