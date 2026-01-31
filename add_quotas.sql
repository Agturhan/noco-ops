-- Add quota columns to Contract table
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "monthlyVideoQuota" INTEGER DEFAULT 0;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "monthlyPostQuota" INTEGER DEFAULT 0;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "retainerAmount" DECIMAL(10,2);

-- Comment explaining the columns
COMMENT ON COLUMN "Contract"."monthlyVideoQuota" IS 'Monthly video production quota (e.g. 20)';
COMMENT ON COLUMN "Contract"."monthlyPostQuota" IS 'Monthly social media post quota (e.g. 10)';
COMMENT ON COLUMN "Contract"."retainerAmount" IS 'Monthly retainer fee amount';

-- Success message
SELECT 'Contract quotas added successfully' as message;
