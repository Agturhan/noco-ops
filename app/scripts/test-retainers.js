
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('--- Testing Client Retainer Query ---');
    try {
        // 1. Fetch raw clients to see what's there
        const allClients = await prisma.client.findMany({
            select: { name: true, isActive: true, monthlyFee: true }
        });
        console.log('All Clients:', allClients);

        // 2. Run the exact query from finance.ts
        const activeClientsWithFee = await prisma.client.findMany({
            where: {
                isActive: true,
                monthlyFee: { not: 0 }
            },
            select: { monthlyFee: true, name: true }
        });
        console.log('Filtered Clients (isActive=true, fee!=0):', activeClientsWithFee);

        // 3. Calculate Sum
        const sum = activeClientsWithFee.reduce((acc, client) => {
            const fee = Number(client.monthlyFee) || 0;
            console.log(`Adding ${client.name}: ${fee}`);
            return acc + fee;
        }, 0);
        console.log('Total Retainer Income:', sum);

    } catch (err) {
        console.error('❌ Query Failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
