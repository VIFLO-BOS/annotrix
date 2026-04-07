/**
 * @file prisma.ts
 * @description Configures and exports a singleton PrismaClient instance.
 * In development, it attaches the client to the global object to prevent 
 * multiple instances during hot-reloads.
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * The shared PrismaClient instance used throughout the backend.
 * Uses @prisma/adapter-pg with a pg Pool for Prisma 7+ driver adapter support.
 */
let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }

  // Create a pg Pool with the DATABASE_URL and SSL enabled for cloud databases
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Create the Prisma adapter with the pg Pool
  const adapter = new PrismaPg(pool);

  prismaInstance = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as any);
}

export const prisma = prismaInstance;

// Save the instance to the global object in non-production environments
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

