import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;

// Function to add parameters to database URL if they don't exist
function getEnhancedDatabaseUrl() {
  const originalUrl = process.env.POSTGRES_PRISMA_URL;
  
  if (!originalUrl) {
    return undefined; // Let Prisma use default from schema
  }
  
  // Add pgbouncer=true and statement timeout if not present
  let url = new URL(originalUrl);
  
  if (!url.searchParams.has('pgbouncer')) {
    url.searchParams.append('pgbouncer', 'true');
  }
  
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.append('connection_limit', '1');
  }
  
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.append('pool_timeout', '20');
  }
  
  // Add prepare=false to disable prepared statements (this helps with the error)
  if (!url.searchParams.has('prepare')) {
    url.searchParams.append('prepare', 'false');
  }
  
  return url.toString();
}

// Use a simple client with enhanced URL
const prisma = globalForPrisma.prisma || 
  new PrismaClient({
    datasources: {
      db: {
        url: getEnhancedDatabaseUrl(),
      },
    },
    log: ['error'],
  });

// In development, keep the instance across hot reloads
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };
