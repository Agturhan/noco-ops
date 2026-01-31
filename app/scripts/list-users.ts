import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
    console.log('📋 Listing all users...');
    const users = await prisma.user.findMany();
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
