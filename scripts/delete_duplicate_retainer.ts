
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const idToDelete = '84ed7ab6-32bd-4d32-a6c0-bf51f7124f2c';
    const { error } = await supabase.from('Retainer').delete().eq('id', idToDelete);
    if (error) console.error(error);
    else console.log('Deleted retainer', idToDelete);
}
run();
