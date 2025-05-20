import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;

// Create a new PrismaClient with proper connection URL formatting
// The URL itself should include any necessary parameters
const prismaClientOptions = {
  log: ['error'],
};

// Create or reuse the Prisma client
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

// In development, keep the instance across hot reloads
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
