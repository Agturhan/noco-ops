
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const ids = ['84ed7ab6-32bd-4d32-a6c0-bf51f7124f2c', '25a3c91b-e05c-4462-9315-b711f1a7c7db'];
    for (const id of ids) {
        const { count } = await supabase.from('RetainerHourLog').select('*', { count: 'exact', head: true }).eq('retainerId', id);
        const { data: r } = await supabase.from('Retainer').select('created_at, monthlyHours').eq('id', id).single();
        console.log(`Retainer ${id}: ${count} logs. Hours: ${r?.monthlyHours}. Created: ${r?.created_at}`);
    }
}
run();
