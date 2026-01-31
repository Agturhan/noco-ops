// Veritabanı bağlantı testi
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Veritabanına bağlanılıyor...');

    try {
        // Basit bir sorgu dene
        const users = await prisma.user.findMany();
        console.log('✅ Bağlantı başarılı!');
        console.log(`Kullanıcı sayısı: ${users.length}`);
        console.log('Kullanıcılar:', users);
    } catch (error) {
        console.error('❌ Bağlantı hatası:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
