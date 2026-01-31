-- Enable RLS and create policies safely
-- This script checks if each table exists before trying to secure it.
-- This prevents errors if your database schema is slightly different.

DO $$
DECLARE
    t text;
    -- List of all potential tables in the system
    tables text[] := ARRAY[
        'User', 'Session', 'Client', 'Contract', 'Project',
        'Deliverable', 'RevisionCycle', 'Invoice', 'Asset',
        'AuditLog', 'Task', 'CalendarEvent', 'LoginLog',
        'Expense', 'Income', 'Report', 'Notification', 'Settings',
        'TaskTimeLog', 'UserHourlyCost', 'FinanceAccount',
        'FinanceTransaction', 'FinanceCategory'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- 1. Enable RLS
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
            
            -- 2. Create Policy (if not exists)
            BEGIN
                EXECUTE format('CREATE POLICY "Allow all for authenticated users" ON %I FOR ALL USING (auth.role() = ''authenticated'')', t);
            EXCEPTION WHEN duplicate_object THEN
                NULL; -- Policy already exists, ignore
            END;
            
            RAISE NOTICE '✅ Secured table: %', t;
        ELSE
            RAISE NOTICE '⚠️ Table not found (skipping): %', t;
        END IF;
    END LOOP;
END $$;
