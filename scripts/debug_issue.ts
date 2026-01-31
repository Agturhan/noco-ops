
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local' });

// Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Prisma
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debug() {
    console.log('--- DEBUG START ---');

    // 1. Find the Task "İlk Video" or related to "Hubeyb"
    console.log('\nScanning for "Hubeyb" related tasks...');
    const { data: tasks, error } = await supabase
        .from('Task')
        .select('*')
        .ilike('title', '%Video%') // Searching generic term then filtering
        .order('createdAt', { ascending: false })
        .limit(5);

    if (error) { console.error(error); return; }

    const hubeybTask = tasks.find(t => t.brandName?.includes('Hubeyb') || t.title.includes('26ocak') || t.clientId); // Heuristics

    if (!hubeybTask) {
        console.log('No specific task found. Listing all recent tasks:');
        tasks.forEach(t => console.log(`- ${t.title} (${t.brandName})`));
    } else {
        console.log('Target Task Found:', hubeybTask);

        // 2. Check why Retainer didn't count it
        console.log('\n--- Retainer Logic Check ---');
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        console.log(`Month Range: ${startOfMonth} to ${endOfMonth}`);
        console.log(`Task DueDate: ${hubeybTask.dueDate}`);

        if (hubeybTask.dueDate && hubeybTask.dueDate >= startOfMonth && hubeybTask.dueDate <= endOfMonth) {
            console.log('-> Task SHOULD be counted (Date is in range).');
        } else {
            console.log('-> Task IGNORED (Date null or out of range).');
        }

        // 3. Check why Dashboard didn't show it
        console.log('\n--- Dashboard Logic Check ---');
        const userId = 'user-ops'; // Ahmet
        console.log(`Checking for User: ${userId}`);

        // Prisma Logic check
        const pTask = await prisma.task.findUnique({ where: { id: hubeybTask.id } });
        if (!pTask) {
            console.log('Prisma could not find the task by ID!');
        } else {
            console.log('Prisma Task:', {
                id: pTask.id,
                assigneeId: pTask.assigneeId,
                status: pTask.status,
                dueDate: pTask.dueDate
            });

            if (pTask.assigneeId !== userId) {
                console.log(`-> FAIL: Assignee mismatch. Task: "${pTask.assigneeId}" vs User: "${userId}"`);
            } else {
                console.log('-> MATCH: Assignee matches.');
            }

            if (['TODO', 'IN_PROGRESS'].includes(pTask.status)) {
                console.log('-> MATCH: Status is active.');
            } else {
                console.log(`-> FAIL: Status ${pTask.status} is not active.`);
            }
        }
    }

    console.log('--- DEBUG END ---');
}

debug();
