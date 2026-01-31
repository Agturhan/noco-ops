-- Set quotas for the first contract in the database for testing
UPDATE "Contract" 
SET "monthlyVideoQuota" = 10, "monthlyPostQuota" = 20 
WHERE id = (SELECT id FROM "Contract" LIMIT 1);
