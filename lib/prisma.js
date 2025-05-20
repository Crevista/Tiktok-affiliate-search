import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;

// Set up client options with query logging in development
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
};

// Add retry logic for connection issues
function createPrismaClient() {
  const client = new PrismaClient(prismaClientOptions);
  
  // Add middleware to handle database connection errors
  client.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error) {
      // If the error is a connection error, log it
      if (
        error.code === 'P2023' || // Timeout error
        error.code === 'P2024' || // Connection pool timeout
        error.code === 'P2025' || // Record not found
        error.message.includes('prepared statement') // Prepared statement error
      ) {
        console.error('Prisma connection error:', error.message);
      }
      throw error;
    }
  });
  
  return client;
}

// Get or create the Prisma client instance
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// In development, keep the instance across hot reloads
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
