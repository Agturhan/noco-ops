
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
    console.log('--- Testing Transaction Insertion ---');
    try {
        // 1. Get an Account
        const account = await prisma.financeAccount.findFirst();
        if (!account) {
            console.error('❌ No FinanceAccount found! Cannot insert transaction.');
            return;
        }
        console.log('Using Account:', account.id, account.name);

        // 2. Get a Category
        const category = await prisma.financeCategory.findFirst({ where: { type: 'INCOME' } });
        if (!category) {
            console.error('❌ No Income Category found!');
            return;
        }
        console.log('Using Category:', category.id, category.name);

        // 3. Insert Transaction
        const newTx = await prisma.financeTransaction.create({
            data: {
                accountId: account.id,
                categoryId: category.id,
                amount: 100.50,
                date: new Date(),
                description: 'Debug Transaction',
                status: 'COMPLETED'
            }
        });
        console.log('✅ Transaction Inserted:', newTx);

    } catch (err) {
        console.error('❌ Insertion Failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
