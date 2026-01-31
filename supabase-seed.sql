-- NOCO Ops - Kapsamlı Seed Data
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- Önce mevcut verileri temizler, sonra yeni verileri ekler

-- ===== TEMİZLİK =====
DELETE FROM "AuditLog";
DELETE FROM "Task";
DELETE FROM "Invoice";
DELETE FROM "Deliverable";
DELETE FROM "Project";
DELETE FROM "Contract";
DELETE FROM "Client";
DELETE FROM "User" WHERE "email" NOT LIKE '%@example.com';

-- ===== KULLANICILAR =====
INSERT INTO "User" ("id", "email", "name", "role", "passwordHash") VALUES
    ('user-owner', 'aysegul@nocodigital.com', 'Ayşegül Nardali', 'OWNER', '$2b$10$hash'),
    ('user-ops', 'ops@nocodigital.com', 'Operasyon Yöneticisi', 'OPS', '$2b$10$hash'),
    ('user-digital', 'digital@nocodigital.com', 'Dijital Tasarımcı', 'DIGITAL', '$2b$10$hash'),
    ('user-studio', 'studio@nocodigital.com', 'Stüdyo Çalışanı', 'STUDIO', '$2b$10$hash')
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "role" = EXCLUDED."role";

-- ===== MÜŞTERİLER =====
INSERT INTO "Client" ("id", "name", "email", "phone", "company") VALUES
    ('client-zeytindali', 'Zeytindalı Gıda', 'info@zeytindali.com', '+90 532 111 1111', 'Zeytindalı Gıda San. Tic. Ltd. Şti.'),
    ('client-ikranur', 'İkranur Giyim', 'info@ikranur.com', '+90 532 222 2222', 'İkra Giyim A.Ş.'),
    ('client-louvess', 'Louvess', 'contact@louvess.com', '+90 532 333 3333', 'Louvess Kozmetik'),
    ('client-valora', 'Valora Psikoloji', 'info@valorapsikoloji.com', '+90 532 444 4444', 'Valora Psikoloji Danışmanlık'),
    ('client-alihaydar', 'Ali Haydar Ocakbaşı', 'info@alihaydar.com', '+90 532 555 5555', 'Ali Haydar Ocakbaşı Restaurant'),
    ('client-tevfikusta', 'Tevfik Usta', 'info@tevfikusta.com', '+90 532 666 6666', 'Tevfik Usta Döner'),
    ('client-hairchef', 'Hair Chef', 'info@hairchef.com', '+90 532 777 7777', 'Hair Chef Kuaför'),
    ('client-zoks', 'Zoks Studio', 'hello@zoks.studio', '+90 532 888 8888', 'Zoks Creative Studio')
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "email" = EXCLUDED."email";

-- ===== SÖZLEŞMELER =====
INSERT INTO "Contract" ("id", "clientId", "name", "maxRevisions", "paymentTerms", "rawAssetsIncluded", "retainerHours") VALUES
    ('contract-zeytindali', 'client-zeytindali', 'Zeytindalı 2026 Retainer', 2, 'NET_30', false, 40),
    ('contract-ikranur', 'client-ikranur', 'İkranur Sosyal Medya', 3, 'UPFRONT', false, 30),
    ('contract-louvess', 'client-louvess', 'Louvess Video Prodüksiyon', 2, 'MILESTONE', true, NULL),
    ('contract-valora', 'client-valora', 'Valora Marka Yenileme', 2, 'NET_15', false, NULL),
    ('contract-alihaydar', 'client-alihaydar', 'Ali Haydar Dijital Pazarlama', 2, 'NET_30', false, 20),
    ('contract-tevfikusta', 'client-tevfikusta', 'Tevfik Usta Web & Sosyal', 2, 'UPFRONT', false, 25),
    ('contract-hairchef', 'client-hairchef', 'Hair Chef Reklam Kampanyası', 2, 'UPFRONT', false, NULL),
    ('contract-zoks', 'client-zoks', 'Zoks Studio İç Proje', 5, 'UPFRONT', true, NULL)
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "maxRevisions" = EXCLUDED."maxRevisions";

-- ===== PROJELER =====
INSERT INTO "Project" ("id", "name", "description", "status", "contractId", "assigneeId") VALUES
    ('proj-zeytindali-rebrand', 'Zeytindalı Rebrand 2026', 'Kurumsal kimlik yenileme ve sosyal medya tasarımları', 'ACTIVE', 'contract-zeytindali', 'user-owner'),
    ('proj-ikranur-sosyal', 'İkranur Sosyal Medya Yönetimi', 'Aylık sosyal medya içerik üretimi', 'ACTIVE', 'contract-ikranur', 'user-digital'),
    ('proj-louvess-video', 'Louvess Tanıtım Videosu', 'Marka tanıtım ve ürün videoları', 'ACTIVE', 'contract-louvess', 'user-studio'),
    ('proj-valora-marka', 'Valora Logo & Kimlik', 'Logo tasarımı ve marka kılavuzu', 'ACTIVE', 'contract-valora', 'user-owner'),
    ('proj-alihaydar-dijital', 'Ali Haydar Dijital Kampanya', 'Google ve Meta reklam yönetimi', 'ACTIVE', 'contract-alihaydar', 'user-ops'),
    ('proj-tevfikusta-web', 'Tevfik Usta Web Sitesi', 'Responsive web sitesi geliştirme', 'ON_HOLD', 'contract-tevfikusta', 'user-digital'),
    ('proj-hairchef-reklam', 'Hair Chef Yeni Yıl Kampanyası', 'Reklam metinleri ve görselleri', 'COMPLETED', 'contract-hairchef', 'user-digital'),
    ('proj-zoks-ic', 'Zoks Studio İç Prodüksiyon', 'Stüdyo iç projeleri ve çekimler', 'ACTIVE', 'contract-zoks', 'user-studio')
ON CONFLICT ("id") DO UPDATE SET
    "status" = EXCLUDED."status",
    "name" = EXCLUDED."name";

-- ===== GÖREVLER =====
INSERT INTO "Task" ("id", "title", "description", "status", "priority", "dueDate", "projectId", "assigneeId") VALUES
    -- Zeytindalı Görevleri
    ('task-z1', 'Zeytindalı Logo Tasarımı', 'Yeni logo konsepti ve 3 varyasyon', 'IN_PROGRESS', 'HIGH', '2026-01-20', 'proj-zeytindali-rebrand', 'user-owner'),
    ('task-z2', 'Zeytindalı Kurumsal Kimlik', 'Kartvizit, antetli kağıt, zarf tasarımları', 'TODO', 'NORMAL', '2026-01-28', 'proj-zeytindali-rebrand', 'user-digital'),
    ('task-z3', 'Zeytindalı Sosyal Medya Şablonu', 'Instagram post ve story şablonları', 'TODO', 'NORMAL', '2026-02-05', 'proj-zeytindali-rebrand', 'user-digital'),
    
    -- İkranur Görevleri
    ('task-i1', 'İkranur Sosyal Medya Görselleri', '12 adet Instagram post görseli', 'TODO', 'NORMAL', '2026-01-25', 'proj-ikranur-sosyal', 'user-digital'),
    ('task-i2', 'İkranur Story Tasarımları', 'Haftalık 7 adet story', 'IN_PROGRESS', 'NORMAL', '2026-01-22', 'proj-ikranur-sosyal', 'user-digital'),
    
    -- Louvess Görevleri
    ('task-l1', 'Louvess Video Kurgu', 'Tanıtım videosu düzenleme ve efektler', 'IN_REVIEW', 'URGENT', '2026-01-15', 'proj-louvess-video', 'user-studio'),
    ('task-l2', 'Louvess Ürün Çekimi', '10 ürün fotoğraf çekimi', 'DONE', 'HIGH', '2026-01-10', 'proj-louvess-video', 'user-studio'),
    
    -- Valora Görevleri
    ('task-v1', 'Valora Logo Konsepti', 'Logo tasarım alternatifleri', 'IN_REVIEW', 'HIGH', '2026-01-18', 'proj-valora-marka', 'user-owner'),
    
    -- Hair Chef Görevleri
    ('task-h1', 'Hair Chef Reklam Metni', 'Instagram ve Facebook reklam copy', 'DONE', 'NORMAL', '2026-01-10', 'proj-hairchef-reklam', 'user-digital'),
    ('task-h2', 'Hair Chef Görsel Tasarım', 'Kampanya görselleri', 'DONE', 'NORMAL', '2026-01-12', 'proj-hairchef-reklam', 'user-digital'),
    
    -- Tevfik Usta Görevleri
    ('task-t1', 'Tevfik Usta Web Sitesi', 'Landing page tasarım ve geliştirme', 'BLOCKED', 'HIGH', '2026-01-30', 'proj-tevfikusta-web', 'user-digital'),
    
    -- Genel Görevler
    ('task-g1', 'Haftalık Rapor Hazırlama', 'Müşteri raporları', 'TODO', 'LOW', '2026-01-17', NULL, 'user-ops')
ON CONFLICT ("id") DO UPDATE SET
    "title" = EXCLUDED."title",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "assigneeId" = EXCLUDED."assigneeId";

-- ===== TESLİMATLAR =====
INSERT INTO "Deliverable" ("id", "name", "description", "status", "projectId", "revisionCount") VALUES
    ('del-z1', 'Zeytindalı Logo Paketi', 'Logo dosyaları (AI, PNG, SVG)', 'IN_PROGRESS', 'proj-zeytindali-rebrand', 0),
    ('del-z2', 'Zeytindalı Marka Kılavuzu', 'Brand guidelines PDF', 'IN_PROGRESS', 'proj-zeytindali-rebrand', 0),
    ('del-i1', 'İkranur Ocak İçerikleri', '15 adet sosyal medya içeriği', 'IN_REVIEW', 'proj-ikranur-sosyal', 1),
    ('del-l1', 'Louvess Tanıtım Videosu', '60 saniyelik tanıtım videosu', 'IN_REVIEW', 'proj-louvess-video', 2),
    ('del-v1', 'Valora Logo', 'Final logo dosyaları', 'IN_REVIEW', 'proj-valora-marka', 1),
    ('del-h1', 'Hair Chef Kampanya Materyalleri', 'Reklam ve görsel seti', 'DELIVERED', 'proj-hairchef-reklam', 0)
ON CONFLICT ("id") DO UPDATE SET
    "status" = EXCLUDED."status",
    "revisionCount" = EXCLUDED."revisionCount";

-- ===== FATURALAR =====
INSERT INTO "Invoice" ("id", "projectId", "amount", "status", "dueDate", "paidAt") VALUES
    ('inv-z1', 'proj-zeytindali-rebrand', 50000, 'PAID', '2026-01-01', '2026-01-02'),
    ('inv-z2', 'proj-zeytindali-rebrand', 50000, 'PENDING', '2026-02-01', NULL),
    ('inv-i1', 'proj-ikranur-sosyal', 25000, 'PAID', '2026-01-01', '2026-01-03'),
    ('inv-l1', 'proj-louvess-video', 75000, 'PENDING', '2026-01-20', NULL),
    ('inv-v1', 'proj-valora-marka', 35000, 'OVERDUE', '2026-01-10', NULL),
    ('inv-a1', 'proj-alihaydar-dijital', 20000, 'PAID', '2026-01-05', '2026-01-05'),
    ('inv-t1', 'proj-tevfikusta-web', 40000, 'PENDING', '2026-02-15', NULL),
    ('inv-h1', 'proj-hairchef-reklam', 15000, 'PAID', '2025-12-20', '2025-12-22')
ON CONFLICT ("id") DO UPDATE SET
    "status" = EXCLUDED."status",
    "amount" = EXCLUDED."amount";

-- ===== GİDERLER =====
INSERT INTO "Expense" ("id", "title", "amount", "category", "date", "notes") VALUES
    ('exp-1', 'Ofis Kirası', 45000, 'RENT', '2026-01-01', 'Ocak ayı kira'),
    ('exp-2', 'Notion Aboneliği', 510, 'SOFTWARE', '2026-01-01', 'Aylık abonelik'),
    ('exp-3', 'ChatGPT Plus', 500, 'SOFTWARE', '2026-01-01', 'Aylık abonelik'),
    ('exp-4', 'Elektrik Faturası', 3500, 'UTILITIES', '2026-01-05', 'Ocak elektrik'),
    ('exp-5', 'Freelancer Grafiker', 5000, 'FREELANCER', '2026-01-10', 'Logo projesi desteği')
ON CONFLICT ("id") DO UPDATE SET
    "amount" = EXCLUDED."amount";

-- ===== KONTROL =====
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL SELECT 'Clients', COUNT(*) FROM "Client"
UNION ALL SELECT 'Contracts', COUNT(*) FROM "Contract"
UNION ALL SELECT 'Projects', COUNT(*) FROM "Project"
UNION ALL SELECT 'Tasks', COUNT(*) FROM "Task"
UNION ALL SELECT 'Deliverables', COUNT(*) FROM "Deliverable"
UNION ALL SELECT 'Invoices', COUNT(*) FROM "Invoice"
UNION ALL SELECT 'Expenses', COUNT(*) FROM "Expense";
