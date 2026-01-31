
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Adapter
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function checkPrisma() {
    console.log('Checking Prisma...');
    const userId = 'user-ops';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`Querying for userId: "${userId}"`);
    console.log(`Date range: ${today.toISOString()} - ${tomorrow.toISOString()}`);

    try {
        const tasks = await prisma.task.findMany({
            where: {
                assigneeId: userId,
                OR: [
                    { dueDate: { gte: today, lt: tomorrow } },
                    { status: { in: ['TODO', 'IN_PROGRESS'] } }
                ]
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' }
            ],
            take: 10
        });

        console.log(`Prisma found ${tasks.length} tasks.`);
        tasks.forEach(t => console.log(` - ${t.title} (${t.status}) Assignee: ${t.assigneeId}`));

        // Also check raw count without filters
        const allTasks = await prisma.task.count();
        console.log(`Total tasks in DB via Prisma: ${allTasks}`);

        const exactTask = await prisma.task.findFirst({
            where: { assigneeId: userId }
        });
        console.log(`Task with assigneeId=${userId}:`, exactTask ? 'Found' : 'Not Found');

    } catch (e) {
        console.error('Prisma Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkPrisma();
