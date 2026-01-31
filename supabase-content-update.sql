-- NOCO Ops - Content tablosu güncelleme
-- Müşteri-Marka entegrasyonu için

-- brandName ve clientId ekle
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "brandName" TEXT;
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

-- Mevcut brandId değerlerini brandName'e kopyala (geçiş için)
UPDATE "Content" SET "brandName" = "brandId" WHERE "brandName" IS NULL;

-- Kontrol
SELECT COUNT(*) as total, COUNT("brandName") as with_brand_name FROM "Content";
