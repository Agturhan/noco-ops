DO $$
DECLARE
    target_client_id text;
    i integer;
BEGIN
    -- Get the client ID from the first contract (same as used for quota)
    SELECT "clientId" INTO target_client_id FROM "Contract" LIMIT 1;

    -- Insert 9 Video Tasks (90% of 10)
    FOR i IN 1..9 LOOP
        INSERT INTO "Task" ("id", "clientId", "contentType", "status", "dueDate", "title", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), target_client_id, 'VIDEO', 'DONE', NOW(), 'Test Video Task ' || i, NOW(), NOW());
    END LOOP;
END $$;
