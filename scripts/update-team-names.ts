import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
    console.log('🔄 Updating team member names...');

    const updates = [
        {
            id: 'user-owner',
            newName: 'Ayşegül Güler Ustaosmanoğlu',
        },
        {
            id: 'user-ops',
            newName: 'Ahmet Gürkan Turhan',
        },
        {
            id: 'user-digital',
            newName: 'Şeyma Bora Turhan',
        },
        {
            id: 'user-studio',
            newName: 'Fatih Ustaosmanoğlu',
        },
    ];

    for (const update of updates) {
        const user = await prisma.user.findUnique({
            where: { id: update.id },
        });

        if (user) {
            if (user.name !== update.newName) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { name: update.newName },
                });
                console.log(`✅ Updated (${user.role}): "${user.name}" -> "${update.newName}"`);
            } else {
                console.log(`ℹ️ Already up to date: "${update.newName}"`);
            }
        } else {
            console.warn(`⚠️ User ID not found: "${update.id}"`);
        }
    }

    console.log('✨ Update complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
