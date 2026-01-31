-- Supabase SQL Editor üzerinden bu kodu çalıştırarak veritabanı tablolarını güncelleyebilirsiniz.
-- Bu işlem kayıt sorunlarını çözecektir.

-- 1. User tablosuna yeni alanlar ekle
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- 2. Client (Marka) tablosuna yeni alanlar ekle
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "color" TEXT DEFAULT '#329FF5';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "instagram" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "socialCredentials" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'SOSYAL_MEDYA';

-- 3. Task (İçerik/Görev) tablosunu güncelle
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "contentType" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "publishDate" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "sourceType" TEXT DEFAULT 'task';
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "brandName" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- 4. İlişkiyi ekle (Opsiyonel, hata verirse geçebilirsiniz)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Task_clientId_fkey') THEN
        ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'İlişki eklenemedi, muhtemelen veri tutarsızlığı var.';
END $$;
