
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const client = await pool.connect();

        console.log('--- Raw DB Inspection ---');

        // 1. Transactions
        const resTx = await client.query('SELECT * FROM "FinanceTransaction" ORDER BY "createdAt" DESC LIMIT 5');
        console.log(`Found ${resTx.rowCount} transactions:`);
        console.table(resTx.rows);

        // 2. Clients
        const resClients = await client.query('SELECT name, "monthlyFee" FROM "Client" WHERE "monthlyFee" > 0 LIMIT 5');
        console.log(`\nFound ${resClients.rowCount} clients with fee:`);
        console.table(resClients.rows);

        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

main();
