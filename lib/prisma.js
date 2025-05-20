import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;

// Create a new PrismaClient with specific options
const prismaClientOptions = {
  log: ['error'],
  // Disable prepared statements to avoid the "prepared statement already exists" error
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
      // Add Prisma connection options to help with serverless environments
      options: {
        // These options help prevent the "prepared statement already exists" error
        pgBouncer: true,
        // Prevent using cached prepared statements
        prepare: false
      }
    }
  }
};

// Create or reuse the Prisma client
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

// In development, keep the instance across hot reloads
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
