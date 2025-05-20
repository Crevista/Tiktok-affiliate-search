import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;

// Create a new client if not already created
export const prisma = globalForPrisma.prisma || new PrismaClient();

// Keep connection in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
