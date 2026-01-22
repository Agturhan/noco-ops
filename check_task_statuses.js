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
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log('\n--- Checking Task Statuses ---');
    const { data, error } = await supabase.from('Task').select('id, title, status');

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data.slice(0, 10)); // Show first 10
        // Group by status
        const counts = {};
        data.forEach(t => {
            const s = t.status === null ? 'NULL' : t.status;
            counts[s] = (counts[s] || 0) + 1;
        });
        console.log('Status Counts:', counts);
    }
}

check();
