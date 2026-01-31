
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const USERS = [
    { email: 'admin@noco.studio', password: 'demo123', name: 'Admin User', role: 'OWNER' },
    { email: 'seyma@noco.studio', password: 'seyma2026', name: 'Şeyma Bora', role: 'DIGITAL' },
    { email: 'fatih@noco.studio', password: 'fatih2026', name: 'Fatih Ustaosmanoğlu', role: 'DIGITAL' },
    { email: 'aysegul@noco.studio', password: 'aysegul2026', name: 'Ayşegül Güler', role: 'DIGITAL' },
    { email: 'ahmet@noco.studio', password: 'ahmet2026', name: 'Ahmet Gürkan Turhan', role: 'OPS' },
];

async function main() {
    console.log('Starting user creation...');

    for (const u of USERS) {
        console.log(`Processing: ${u.email}`);
        let userId = '';

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: {
                name: u.name,
                role: u.role
            }
        });

        if (authError) {
            console.log(`ℹ️ Auth Info for ${u.email}:`, authError.message);
            // If user exists, find ID
            const { data: listData } = await supabase.auth.admin.listUsers();
            const existing = listData.users.find(x => x.email === u.email);
            if (existing) {
                userId = existing.id;
                console.log(`✅ Found existing user ID: ${userId}`);
            } else {
                console.error(`❌ Could not find user ID for ${u.email}`);
                continue;
            }
        } else {
            userId = authData.user.id;
            console.log(`✅ Auth user created: ${userId}`);
        }

        // 2. Sync to public.User
        if (userId) {
            const { error: upsertError } = await supabase
                .from('User')
                .upsert({
                    id: userId,
                    email: u.email,
                    name: u.name,
                    role: u.role,
                    // avatar removed to fix schema error
                    updatedAt: new Date().toISOString()
                }, { onConflict: 'email' });

            if (upsertError) {
                console.error(`❌ Failed to sync public.User for ${u.email}:`, upsertError.message);
            } else {
                console.log(`✅ Synced to public.User`);
            }
        }
    }
}

main();
