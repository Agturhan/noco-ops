-- NOCO Ops - Finance Module Schema
-- Bu SQL'i Supabase SQL Editor'e yapıştırın

-- ===== NEW ENUMS =====
CREATE TYPE "AccountType" AS ENUM ('BANK', 'CASH', 'CREDIT_CARD');
CREATE TYPE "CurrencyCode" AS ENUM ('TRY', 'USD', 'EUR', 'GBP');
CREATE TYPE "CategoryType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- ===== FINANCE ACCOUNTS =====
CREATE TABLE "FinanceAccount" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL DEFAULT 'BANK',
    "currency" "CurrencyCode" NOT NULL DEFAULT 'TRY',
    "balance" DECIMAL(15, 2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinanceAccount_pkey" PRIMARY KEY ("id")
);

-- ===== FINANCE CATEGORIES =====
CREATE TABLE "FinanceCategory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "isTaxDeductible" BOOLEAN DEFAULT FALSE,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinanceCategory_pkey" PRIMARY KEY ("id")
);

-- ===== TRANSACTIONS (Ledger) =====
CREATE TABLE "FinanceTransaction" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT,
    "amount" DECIMAL(15, 2) NOT NULL, -- Positive for Income, Negative for Expense/Transfer
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "description" TEXT,
    "status" "TransactionStatus" DEFAULT 'COMPLETED',
    "relatedClientId" TEXT,
    "relatedProjectId" TEXT,
    "invoiceFileUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FinanceTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinanceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FinanceTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinanceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinanceTransaction_relatedClientId_fkey" FOREIGN KEY ("relatedClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinanceTransaction_relatedProjectId_fkey" FOREIGN KEY ("relatedProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinanceTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX "FinanceTransaction_accountId_idx" ON "FinanceTransaction"("accountId");
CREATE INDEX "FinanceTransaction_date_idx" ON "FinanceTransaction"("date");
CREATE INDEX "FinanceTransaction_categoryId_idx" ON "FinanceTransaction"("categoryId");

-- ===== USER HOURLY COSTS =====
CREATE TABLE "UserHourlyCost" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "hourlyCost" DECIMAL(10, 2) NOT NULL, -- Cost to company
    "currency" "CurrencyCode" DEFAULT 'TRY',
    "effectiveFrom" DATE DEFAULT CURRENT_DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserHourlyCost_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserHourlyCost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ===== TASK TIME LOGS (Activity-Based Costing) =====
CREATE TABLE "TaskTimeLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stageLabel" TEXT, -- e.g. "KURGULANIYOR"
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "isAuto" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskTimeLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TaskTimeLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskTimeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "TaskTimeLog_taskId_idx" ON "TaskTimeLog"("taskId");
CREATE INDEX "TaskTimeLog_userId_idx" ON "TaskTimeLog"("userId");

-- ===== RLS POLICIES (Simple) =====
ALTER TABLE "FinanceAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinanceCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinanceTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserHourlyCost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskTimeLog" ENABLE ROW LEVEL SECURITY;

-- Allow Access to Authenticated Users (Refine roles later)
CREATE POLICY "Allow All For Authenticated" ON "FinanceAccount" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow All For Authenticated" ON "FinanceCategory" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow All For Authenticated" ON "FinanceTransaction" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow All For Authenticated" ON "UserHourlyCost" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow All For Authenticated" ON "TaskTimeLog" FOR ALL USING (auth.role() = 'authenticated');

-- ===== SEED DATA (Categories) =====
INSERT INTO "FinanceCategory" ("name", "type", "isTaxDeductible", "color") VALUES
('Retainer Geliri', 'INCOME', false, '#32D74B'),
('Proje Geliri', 'INCOME', false, '#329FF5'),
('Stüdyo Geliri', 'INCOME', false, '#BF5AF2'),
('Personel Maaş', 'EXPENSE', true, '#FF453A'),
('Ofis Kirası', 'EXPENSE', true, '#FF9F0A'),
('Freelancer Ödemesi', 'EXPENSE', true, '#FF375F'),
('Yazılım/Lisans', 'EXPENSE', true, '#64D2FF'),
('Ekipman', 'EXPENSE', true, '#AC8E68'),
('Yemek/Gıda', 'EXPENSE', true, '#FFD60A'),
('Ulaşım', 'EXPENSE', true, '#5E5CE6');

-- ===== SEED DATA (Accounts) =====
INSERT INTO "FinanceAccount" ("name", "type", "currency", "balance") VALUES
('Şirket Kasası', 'CASH', 'TRY', 0),
('Ana Banka Hesabı', 'BANK', 'TRY', 0),
('Şirket Kredi Kartı', 'CREDIT_CARD', 'TRY', 0);
