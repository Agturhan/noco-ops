
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAssignees() {
    console.log('Starting assignee fix...');

    // 0. Check Auth Users
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Error fetching auth users:', authError);
    } else {
        console.log(`Found ${authUsers.length} Auth Users:`);
        authUsers.forEach(u => console.log(` - ${u.email} (${u.id})`));
    }

    // 1. Get all Users map (Name -> ID)
    const { data: users, error: userError } = await supabase
        .from('User')
        .select('id, name, email'); // Added email for matching


    if (userError || !users) {
        console.error('Error fetching users:', userError);
        return;
    }

    const userMap = new Map(users.map(u => [u.name.trim(), u.id]));
    console.log(`Found ${users.length} users:`);
    users.forEach(u => console.log(` - ${u.name} (${u.id})`));


    // 2. Get all Tasks
    const { data: tasks, error: taskError } = await supabase
        .from('Task')
        .select('id, title, assigneeId, assigneeIds, status, dueDate');

    if (taskError || !tasks) {
        console.error('Error fetching tasks:', taskError);
        return;
    }

    console.log(`Checking ${tasks.length} tasks...`);

    let updatedCount = 0;

    for (const task of tasks) {
        console.log(`Task: ${task.title}
    - ID: ${task.id}
    - Assignee: ${task.assigneeId}
    - AssigneeIds: ${JSON.stringify(task.assigneeIds)}
    - Status: ${task.status}
    - DueDate: ${task.dueDate}`);

        let newAssigneeId = task.assigneeId;

        // Auto-fix: if assigneeId is null BUT assigneeIds has values (Names), pick first one
        if (!newAssigneeId && task.assigneeIds && task.assigneeIds.length > 0) {
            newAssigneeId = task.assigneeIds[0];
            console.log(`-> Found candidate from array: "${newAssigneeId}"`);
        }

        if (!newAssigneeId) continue;

        // Check if assigneeId is a Name (exists in map) and NOT a UUID (not in values)
        // Actually, just check if it matches a name in our map

        // If assigneeId is exactly a user's Name, we fix it.
        if (userMap.has(newAssigneeId)) {
            const correctId = userMap.get(newAssigneeId);
            console.log(`Fixing Task "${task.title}": "${newAssigneeId}" -> "${correctId}"`);

            const { error: updateError } = await supabase
                .from('Task')
                .update({ assigneeId: correctId })
                .eq('id', task.id);

            if (updateError) {
                console.error(`Failed to update task ${task.id}:`, updateError);
            } else {
                updatedCount++;
            }
        } else {
            // Maybe it is already a UUID?
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newAssigneeId) || /^[a-z0-9]{20,}$/.test(newAssigneeId);
            if (!isUuid) {
                console.log(`-> Warning: Assignee "${newAssigneeId}" is not a known user name and not a UUID/CUID.`);
            }
        }
    }

    console.log(`Finished. Fixed ${updatedCount} tasks.`);
}

fixAssignees();
