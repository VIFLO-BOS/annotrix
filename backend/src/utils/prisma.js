"use strict";
/**
 * @file prisma.ts
 * @description Configures and exports a singleton PrismaClient instance.
 * In development, it attaches the client to the global object to prevent
 * multiple instances during hot-reloads.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
var client_1 = require("@prisma/client");
var pg_1 = require("pg");
var adapter_pg_1 = require("@prisma/adapter-pg");
// Prevent multiple instances of Prisma Client in development
var globalForPrisma = globalThis;
/**
 * The shared PrismaClient instance used throughout the backend.
 * Uses @prisma/adapter-pg with a pg Pool for Prisma 7+ driver adapter support.
 */
var prismaInstance;
if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
}
else {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is missing.');
    }
    // Create a pg Pool with the DATABASE_URL and SSL enabled for cloud databases
    var pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });
    // Create the Prisma adapter with the pg Pool
    var adapter = new adapter_pg_1.PrismaPg(pool);
    prismaInstance = new client_1.PrismaClient({
        adapter: adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}
exports.prisma = prismaInstance;
// Save the instance to the global object in non-production environments
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
