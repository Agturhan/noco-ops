
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Manual env load
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Finance Transactions ---');
    const transactions = await prisma.financeTransaction.findMany({
        orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${transactions.length} transactions.`);
    console.table(transactions);

    console.log('\n--- Inspecting Finance Accounts ---');
    const accounts = await prisma.financeAccount.findMany();
    console.table(accounts);

    console.log('\n--- Inspecting Clients with Retainers ---');
    const clients = await prisma.client.findMany({
        where: { monthlyFee: { gt: 0 } },
        select: { name: true, monthlyFee: true }
    });
    console.table(clients);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
