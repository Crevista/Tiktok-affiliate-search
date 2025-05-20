import { PrismaClient } from '@prisma/client';

// This solution prevents multiple instances of Prisma Client in development
const globalForPrisma = global;

// Add debug logging in production to diagnose the "prepared statement" errors
const options = process.env.NODE_ENV === 'production' 
  ? { log: ['error', 'warn'] }
  : {};

// Create a new PrismaClient if one doesn't exist
const prismaClientSingleton = () => new PrismaClient(options);

// Check if we already have a connection to reuse
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Save the connection for future use
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Add error handling for common issues
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    // Log errors with more context
    console.error(`Prisma ${params.model}.${params.action} error:`, error);
    throw error;
  }
});

export { prisma };
