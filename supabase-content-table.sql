-- NOCO Ops - Content tablosu oluşturma
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- Content tablosu
CREATE TABLE IF NOT EXISTS "Content" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANLANDI',
    "type" TEXT NOT NULL DEFAULT 'VIDEO',
    "notes" TEXT,
    "deliveryDate" DATE,
    "publishDate" DATE,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE "Content" ENABLE ROW LEVEL SECURITY;

-- Herkes için okuma/yazma izni (basit policy)
DROP POLICY IF EXISTS "Allow all" ON "Content";
CREATE POLICY "Allow all" ON "Content" FOR ALL USING (true) WITH CHECK (true);

-- Başlangıç verileri (opsiyonel - İş Yönetimi'ndeki mevcut içerikler)
INSERT INTO "Content" ("id", "title", "brandId", "status", "type", "notes", "deliveryDate", "publishDate") VALUES
    ('c1', 'Tevfik Usta Video 6', 'tevfik', 'PLANLANDI', 'VIDEO', '', '2025-12-11', NULL),
    ('c2', 'Tevfik Usta Yeni Yıl', 'tevfik', 'KURGULANIYOR', 'VIDEO', '', '2026-01-05', NULL),
    ('c3', 'ByKasap Video 6', 'bykasap', 'PLANLANDI', 'VIDEO', '', '2025-12-07', NULL),
    ('c4', 'ByKasap Yeni Yıl', 'bykasap', 'CEKILDI', 'VIDEO', '', '2026-01-02', NULL),
    ('c5', 'İkra Yeni Yıl', 'ikra', 'PLANLANDI', 'VIDEO', '', '2026-01-03', NULL),
    ('c6', 'Zeytindalı Yeni Yıl', 'zeytindali', 'PLANLANDI', 'VIDEO', '', '2026-01-04', NULL),
    ('c7', 'Valora Yeni Yıl', 'valora', 'PLANLANDI', 'VIDEO', '', '2026-01-06', NULL),
    ('c8', 'Zoks Yeni Yıl', 'zoks', 'PLANLANDI', 'VIDEO', '', '2026-01-10', NULL)
ON CONFLICT ("id") DO NOTHING;

-- Doğrulama
SELECT COUNT(*) as content_count FROM "Content";
