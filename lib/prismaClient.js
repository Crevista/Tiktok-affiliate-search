import { PrismaClient } from '@prisma/client';

// Define global for Prisma client
let prisma;

// Check for the existing global prisma client
if (process.env.NODE_ENV === 'production') {
  // In production, create a new client
  prisma = new PrismaClient();
} else {
  // In development, reuse the client to avoid multiple connections
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
