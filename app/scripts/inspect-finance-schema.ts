
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspect(table: string) {
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

    if (error) {
        console.log(`❌ Error fetching ${table}:`, error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log(`⚠️  Table ${table} is empty, cannot infer full schema from data. Attempting to insert dummy to read structure? No, too risky.`);
        return;
    }

    console.log(`✅ Table ${table} keys:`, Object.keys(data[0]));
    console.log('Sample:', data[0]);
}

async function main() {
    await inspect('Client');
}

main();
