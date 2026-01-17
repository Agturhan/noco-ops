// Prisma Client - Supabase PostgreSQL bağlantısı (Prisma 7.x)
// Adapter pattern with Pooler URL for IPv4 connections

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Supabase Pooler connection URL (from .env)
const connectionString = process.env.DATABASE_URL!;

// SSL configuration for Supabase
const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Prisma adapter
const adapter = new PrismaPg(pool);

// Global instance for hot reload
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
