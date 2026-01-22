const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/"/g, '');
    }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Database Connection Info ---');
console.log('URL:', SUPABASE_URL);
console.log('Key length:', SUPABASE_KEY ? SUPABASE_KEY.length : 0);

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log('\n--- Checking Tables ---');

    // Check Users
    const { data: users, error: userError } = await supabase.from('User').select('id, name, email');
    if (userError) console.error('Error fetching Users:', userError.message);
    else {
        console.log(`Users count: ${users.length}`);
        console.table(users);
    }

    // Check Tasks
    const { count: taskCount, error: taskError } = await supabase.from('Task').select('*', { count: 'exact', head: true });
    if (taskError) console.error('Error counting Tasks:', taskError.message);
    else console.log(`Tasks count: ${taskCount}`);

    // Check Projects
    const { count: projectCount, error: projectError } = await supabase.from('Project').select('*', { count: 'exact', head: true });
    if (projectError) console.error('Error counting Projects:', projectError.message);
    else console.log(`Projects count: ${projectCount}`);
}

check();
