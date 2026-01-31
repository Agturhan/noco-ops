
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAssignees() {
    console.log('Starting assignee fix...');

    // 1. Get all Users map (Name -> ID)
    const { data: users, error: userError } = await supabase
        .from('User')
        .select('id, name');

    if (userError || !users) {
        console.error('Error fetching users:', userError);
        return;
    }

    const userMap = new Map(users.map(u => [u.name.trim(), u.id]));
    console.log(`Found ${users.length} users.`);

    // 2. Get all Tasks
    const { data: tasks, error: taskError } = await supabase
        .from('Task')
        .select('id, title, assigneeId');

    if (taskError || !tasks) {
        console.error('Error fetching tasks:', taskError);
        return;
    }

    console.log(`Checking ${tasks.length} tasks...`);

    let updatedCount = 0;

    for (const task of tasks) {
        if (!task.assigneeId) continue;

        // Check if assigneeId is a Name (exists in map) and NOT a UUID (not in values)
        // Actually, just check if it matches a name in our map
        // Optimization: Check if it's already a valid ID (UUID/CUID)
        // CUIDs are ~25 chars starting with c. UUIDs are 36 chars.
        // Names are... names.

        // If assigneeId is exactly a user's Name, we fix it.
        if (userMap.has(task.assigneeId)) {
            const correctId = userMap.get(task.assigneeId);
            console.log(`Fixing Task "${task.title}": "${task.assigneeId}" -> "${correctId}"`);

            const { error: updateError } = await supabase
                .from('Task')
                .update({ assigneeId: correctId })
                .eq('id', task.id);

            if (updateError) {
                console.error(`Failed to update task ${task.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`Finished. Fixed ${updatedCount} tasks.`);
}

fixAssignees();
