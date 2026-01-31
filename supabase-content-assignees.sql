-- Content tablosuna çoklu atama desteği ekle
-- Bu SQL'i Supabase'te çalıştırın

-- 1. assigneeIds kolonu ekle (JSONB array olarak)
ALTER TABLE "Content" 
ADD COLUMN IF NOT EXISTS "assigneeIds" JSONB DEFAULT '[]'::jsonb;

-- 2. Mevcut assigneeId değerlerini assigneeIds'e migrate et
UPDATE "Content" 
SET "assigneeIds" = jsonb_build_array("assigneeId")
WHERE "assigneeId" IS NOT NULL 
AND ("assigneeIds" IS NULL OR "assigneeIds" = '[]'::jsonb);

-- Doğrulama
SELECT id, title, "assigneeId", "assigneeIds" FROM "Content" LIMIT 5;
