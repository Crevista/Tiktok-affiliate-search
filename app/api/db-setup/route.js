import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Log which URL we're using
    const dbUrl = process.env.POSTGRES_PRISMA_URL || 'Not set';
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':******@');
    console.log('Using database URL:', maskedUrl);
    
    // Try to connect
    await prisma.$connect();
    console.log('Successfully connected to database');
    
    // Create tables
    // User table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT,
        "email" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "emailVerified" TIMESTAMP,
        "image" TEXT,
        "newsletter" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Created User table');
    
    // Account table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        UNIQUE("provider", "providerAccountId")
      )
    `;
    console.log('Created Account table');
    
    // Session table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY,
        "sessionToken" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `;
    console.log('Created Session table');
    
    // VerificationToken table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT UNIQUE NOT NULL,
        "expires" TIMESTAMP NOT NULL,
        UNIQUE("identifier", "token")
      )
    `;
    console.log('Created VerificationToken table');
    
    // Subscription table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Subscription" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "stripeCustomerId" TEXT UNIQUE,
        "stripeSubscriptionId" TEXT UNIQUE,
        "stripePriceId" TEXT,
        "stripeCurrentPeriodEnd" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT NOT NULL DEFAULT 'inactive',
        "plan" TEXT NOT NULL DEFAULT 'free',
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `;
    console.log('Created Subscription table');
    
    // Check tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
      tables: tables.map(t => t.table_name)
    });
  } catch (error) {
    console.error('Database setup error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      name: error.name
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
