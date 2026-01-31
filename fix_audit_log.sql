-- AuditLog tablosundaki userId alanını User tablosuna bağla
-- Bu sayede "Unknown System" yerine kullanıcı adını çekebileceğiz.

BEGIN;

-- Eğer constraint yoksa ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_userId_fkey') THEN
        ALTER TABLE "AuditLog" 
        ADD CONSTRAINT "AuditLog_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "User"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

COMMIT;
