
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debug() {
    console.log('--- DEEP DEBUG DASHBOARD ---');

    const userId = 'user-ops'; // Ahmet
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`Target User: ${userId}`);
    console.log(`Date: ${today.toISOString()}`);

    // 1. Simulate getUserTodayTasks Query
    console.log('\n1. Fetching ALL Tasks (limit 100) to inspect IDs...');

    const { data: tasks, error } = await supabaseAdmin
        .from('Task')
        .select('*')
        .or(`status.in.(TODO,IN_PROGRESS),dueDate.gte.${today.toISOString()}`)
        .order('createdAt', { ascending: false })
        .limit(100);

    if (error) {
        console.error('DB Error:', error);
    } else {
        console.log(`Fetched ${tasks.length} candidates.`);

        console.log('\n--- RAW ASSIGNEE DATA INSPECTION ---');
        tasks.forEach(t => {
            // Only log relevant tasks to avoid noise
            if (t.title.includes('28') || t.title.includes('26') || t.title.includes('İlk') || t.status === 'TODO') {
                console.log(`Task [${t.title}] (ID: ${t.id})`);
                console.log(`   - Status: ${t.status}`);
                console.log(`   - AssigneeId: '${t.assigneeId}' (Type: ${typeof t.assigneeId})`);
                console.log(`   - AssigneeIds:`, t.assigneeIds, `(Type: ${typeof t.assigneeIds})`);
            }
        });
        console.log('------------------------------------\n');

        // Apply Logic
        const filtered = tasks.filter(t => {
            const isAssigned =
                t.assigneeId === userId ||
                (Array.isArray(t.assigneeIds) && t.assigneeIds.includes(userId)) ||
                (typeof t.assigneeIds === 'string' && t.assigneeIds.includes(userId));

            if (!isAssigned) return false;

            const isActive = ['TODO', 'IN_PROGRESS'].includes(t.status);
            let isToday = false;
            if (t.dueDate) {
                const d = new Date(t.dueDate);
                isToday = d >= today; // Simplified for debug
            }
            return isToday || isActive;
        });

        console.log(`\nFiltered Result: ${filtered.length} tasks match.`);
        filtered.forEach(t => console.log(` - MATCH: ${t.title} (${t.status})`));
    }

    // 2. Check Retainer Duplicates
    console.log('\n2. Checking Retainers for "Hubeyb"...');
    const { data: retainers } = await supabaseAdmin
        .from('Retainer')
        .select('id, name, status, clientId')
        .neq('status', 'EXPIRED');

    const hubeyb = retainers?.filter(r => r.name.includes('Hubeyb'));
    console.log(`Found ${hubeyb?.length} Active Retainers for Hubeyb:`);
    hubeyb?.forEach(r => console.log(` - [${r.id}] ${r.name} (Status: ${r.status}, Client: ${r.clientId})`));

    console.log('--- END ---');
}

debug();
