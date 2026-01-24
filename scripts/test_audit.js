const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Testing Audit Log Insertion...');

    // 1. Try to fetch a user to verify connection and user existence
    const { data: user, error: userError } = await supabase
        .from('User')
        .select('id, name')
        .eq('id', 'user-studio')
        .single();

    if (userError) {
        console.error('User fetch error:', userError);
        // Fallback to fetching ANY user
        const { data: anyUser } = await supabase.from('User').select('id').limit(1).single();
        console.log('Fallback user:', anyUser);
    } else {
        console.log('Found user:', user);
    }

    const userId = user ? user.id : 'user-studio';

    // 2. Insert Log
    const { data, error } = await supabase
        .from('AuditLog')
        .insert([{
            action: 'TEST_LOG',
            entityType: 'TEST',
            entityId: 'test-1',
            entityName: 'Test Entry',
            userId: userId,
            details: { test: true }
        }])
        .select();

    if (error) {
        console.error('AuditLog Insert Error:', error);
    } else {
        console.log('Successfully inserted log:', data);
    }

    // 3. Check Count
    const { count, error: countError } = await supabase
        .from('AuditLog')
        .select('*', { count: 'exact', head: true });

    console.log('Total Audit Logs:', count);
}

main();
