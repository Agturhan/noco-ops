
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const USER_MAPPING = {
    'user-ops': 'Ahmet Gürkan Turhan',
    'user-studio': 'Fatih Ustaosmanoğlu',
    'user-digital': 'Şeyma Bora',
    'user-owner': 'Ayşegül Güler Ustaosmanoğlu'
};

async function fixNames() {
    console.log('Starting User Name Fix...');

    for (const [id, name] of Object.entries(USER_MAPPING)) {
        console.log(`Updating ${id} -> ${name}`);
        const { error } = await supabaseAdmin
            .from('User')
            .update({ name: name })
            .eq('id', id);

        if (error) {
            console.error(`Failed to update ${id}:`, error);
        } else {
            console.log(`Success: ${id}`);
        }
    }

    console.log('Done.');
}

fixNames();
