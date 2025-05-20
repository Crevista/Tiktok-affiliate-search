import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;

// Use connection pooling for serverless environment
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Use the connection pooling URL for queries
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
      },
    },
    // Log only errors in production to reduce noise
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
};

// Use the existing instance or create a new one
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// In development, keep the instance across hot reloads
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
