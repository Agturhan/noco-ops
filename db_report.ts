import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('============= DATABASE REPORT =============');
    console.log('Connecting to DB via DATABASE_URL...');

    try {
        // Users
        const userCount = await prisma.user.count();
        console.log(`\n--- USERS (${userCount}) ---`);
        if (userCount > 0) {
            const users = await prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' }
            });
            users.forEach(u => console.log(`- ${u.name} (${u.email}) [Role: ${u.role}]`));
        }

        // Clients
        const clientCount = await prisma.client.count();
        console.log(`\n--- CLIENTS (${clientCount}) ---`);
        if (clientCount > 0) {
            const clients = await prisma.client.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' }
            });
            clients.forEach(c => console.log(`- ${c.name} (Company: ${c.company || 'N/A'})`));
        }

        // Projects
        const projectCount = await prisma.project.count();
        console.log(`\n--- PROJECTS (${projectCount}) ---`);
        if (projectCount > 0) {
            const projects = await prisma.project.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { contract: { include: { client: true } } }
            });
            projects.forEach(p => console.log(`- ${p.name} (Status: ${p.status}) - Client: ${p.contract.client.name}`));
        }

        // Contracts
        const contractCount = await prisma.contract.count();
        console.log(`\n--- CONTRACTS (${contractCount}) ---`);

        // Tasks
        const taskCount = await prisma.task.count();
        console.log(`\n--- TASKS (${taskCount}) ---`);
        if (taskCount > 0) {
            const tasks = await prisma.task.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
            tasks.forEach(t => console.log(`- ${t.title} [Status: ${t.status}]`));
        }

        // Deliverables
        const deliverableCount = await prisma.deliverable.count();
        console.log(`\n--- DELIVERABLES (${deliverableCount}) ---`);

        // Notifications
        const notificationCount = await prisma.notification.count();
        console.log(`\n--- NOTIFICATIONS (${notificationCount}) ---`);

    } catch (e) {
        console.error('Error querying database:', e);
    } finally {
        await prisma.$disconnect();
        console.log('\n===========================================');
    }
}

main();
