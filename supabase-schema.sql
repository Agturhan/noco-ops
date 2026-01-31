-- NOCO Ops - Supabase Database Schema
-- Bu SQL'i Supabase SQL Editor'e yapıştırın

-- ===== ENUM TYPES =====
CREATE TYPE "Role" AS ENUM ('OWNER', 'OPS', 'STUDIO', 'DIGITAL', 'CLIENT');
CREATE TYPE "PaymentTerms" AS ENUM ('UPFRONT', 'NET_15', 'NET_30', 'MILESTONE');
CREATE TYPE "ProjectStatus" AS ENUM ('PENDING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "DeliverableStatus" AS ENUM ('IN_PROGRESS', 'IN_REVIEW', 'APPROVED', 'DELIVERED', 'REVISION_LIMIT_MET');
CREATE TYPE "RevisionCycleStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'REFUNDED');
CREATE TYPE "AssetType" AS ENUM ('FINAL', 'RAW');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "CalendarEventType" AS ENUM ('TASK', 'MEETING', 'DEADLINE', 'CONTENT', 'SHOOT', 'REVIEW', 'OTHER');
CREATE TYPE "ExpenseCategory" AS ENUM ('SALARY', 'RENT', 'SOFTWARE', 'HARDWARE', 'MARKETING', 'TRAVEL', 'FOOD', 'UTILITIES', 'FREELANCER', 'OTHER');
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- ===== USER & AUTHENTICATION =====
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'DIGITAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Session" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- ===== CLIENT & CONTRACT =====
CREATE TABLE "Client" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contract" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxRevisions" INTEGER NOT NULL DEFAULT 2,
    "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'UPFRONT',
    "rawAssetsIncluded" BOOLEAN NOT NULL DEFAULT false,
    "retainerHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ===== PROJECT =====
CREATE TABLE "Project" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING',
    "contractId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Project_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ===== DELIVERABLE =====
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "projectId" TEXT NOT NULL,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Deliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ===== REVISION CYCLE =====
CREATE TABLE "RevisionCycle" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "deliverableId" TEXT NOT NULL,
    "status" "RevisionCycleStatus" NOT NULL DEFAULT 'OPEN',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "RevisionCycle_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RevisionCycle_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ===== INVOICE =====
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "projectId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ===== ASSET =====
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "deliverableId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "type" "AssetType" NOT NULL DEFAULT 'FINAL',
    "isProtected" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Asset_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ===== AUDIT LOG =====
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ===== TASK =====
CREATE TABLE "Task" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "projectId" TEXT,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- ===== CALENDAR EVENT =====
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "CalendarEventType" NOT NULL DEFAULT 'TASK',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT,
    "assigneeId" TEXT,
    "clientId" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CalendarEvent_startDate_idx" ON "CalendarEvent"("startDate");
CREATE INDEX "CalendarEvent_projectId_idx" ON "CalendarEvent"("projectId");

-- ===== LOGIN LOG =====
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LoginLog_userId_idx" ON "LoginLog"("userId");
CREATE INDEX "LoginLog_createdAt_idx" ON "LoginLog"("createdAt");

-- ===== EXPENSE =====
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "projectId" TEXT,
    "vendorName" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Expense_category_idx" ON "Expense"("category");
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- ===== INCOME =====
CREATE TABLE "Income" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "source" TEXT,
    "projectId" TEXT,
    "invoiceId" TEXT,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Income_date_idx" ON "Income"("date");

-- ===== REPORT =====
CREATE TABLE "Report" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Report_clientId_idx" ON "Report"("clientId");
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- ===== FEEDBACK =====
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BUG', -- BUG, FEATURE, UX, OTHER
    "message" TEXT NOT NULL,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, CLOSED
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ===== INITIAL DATA - USERS =====
INSERT INTO "User" ("id", "email", "name", "passwordHash", "role") VALUES
('user_owner', 'owner@noco.studio', 'Şeyma Bora', '$2a$10$abcdefg', 'OWNER'),
('user_ops', 'ops@noco.studio', 'Fatih Ustaosmanoğlu', '$2a$10$abcdefg', 'OPS'),
('user_studio', 'studio@noco.studio', 'Ayşegül Güler', '$2a$10$abcdefg', 'STUDIO'),
('user_digital', 'digital@noco.studio', 'Ahmet Gürkan Turhan', '$2a$10$abcdefg', 'DIGITAL');

-- ===== SUCCESS MESSAGE =====
-- Tüm tablolar başarıyla oluşturuldu!
-- 17 tablo ve 16 enum tipi oluşturuldu.
