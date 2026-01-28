
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debug() {
    console.log('--- DEBUG USER & CONTRACTS ---');

    // 1. Check Users (to solve "Who am I?")
    console.log('\n1. USERS:');
    const { data: users } = await supabase.from('User').select('*');
    if (users) {
        users.forEach(u => console.log(`- [${u.id}] ${u.name} (${u.email})`));
    }

    // 2. Check Auth Users (to see real login IDs)
    console.log('\n2. AUTH USERS:');
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    if (authUsers) {
        authUsers.forEach(u => console.log(`- [${u.id}] ${u.email}`));
    }

    // 3. Check Contracts and Retainers for Louvess
    console.log('\n3. LOUVESS DATA:');

    // Find Client ID for Louvess
    const { data: clients } = await supabase.from('Client').select('*').ilike('name', '%Louvess%');

    if (clients && clients.length > 0) {
        for (const client of clients) {
            console.log(`Client: ${client.name} (${client.id})`);

            // Contracts
            const { data: contracts } = await supabase.from('Contract').select('*').eq('clientId', client.id);
            console.log(` -> Found ${contracts?.length} Contracts:`);
            contracts?.forEach(c => console.log(`    - [${c.id}] ${c.name} (Active: ${c.rawAssetsIncluded})`)); // Check fields

            // Retainers
            const { data: retainers } = await supabase.from('Retainer').select('*').eq('clientId', client.id);
            console.log(` -> Found ${retainers?.length} Retainers:`);
            retainers?.forEach(r => console.log(`    - [${r.id}] ${r.name} (${r.status})`));
        }
    } else {
        console.log('No client found matching "Louvess"');
        // List all clients just in case
        const { data: allClients } = await supabase.from('Client').select('id, name').limit(5);
        console.log('Sample Clients:', allClients);
    }
}

debug();
