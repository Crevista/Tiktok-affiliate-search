import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// IMPORTANT: THIS IS FOR EMERGENCY USE ONLY
// REMOVE THIS ENDPOINT AFTER FIXING YOUR AUTH ISSUES

export async function GET(request) {
  try {
    console.log("Testing database connection...");
    let connectionInfo = {
      database_url: process.env.POSTGRES_PRISMA_URL ? "Configured (not shown for security)" : "Not configured"
    };
    
    // Try to create a Prisma client
    const prisma = new PrismaClient({
      log: ['error', 'warn', 'query'],
    });
    
    console.log("Prisma client created, attempting to query...");
    
    try {
      // First try a raw query that should work even if tables don't exist
      const rawResult = await prisma.$queryRaw`SELECT 1 as test`;
      connectionInfo.raw_query = "Success";
      
      // If that works, try to count users
      try {
        const userCount = await prisma.user.count();
        connectionInfo.user_count = userCount;
        connectionInfo.user_table = "Accessible";
      } catch (userError) {
        console.error("User table error:", userError);
        connectionInfo.user_table = "Error";
        connectionInfo.user_error = userError.message;
      }
      
      await prisma.$disconnect();
      
      return NextResponse.json({
        message: 'Database connection test results',
        connection: connectionInfo
      });
    } catch (queryError) {
      console.error("Query error:", queryError);
      await prisma.$disconnect();
      return NextResponse.json({
        error: 'Database query error',
        message: queryError.message,
        code: queryError.code,
        connection: connectionInfo
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({
      error: 'Database connection error',
      message: error.message,
      stack: error.stack,
      code: error.code
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { email, password, action } = data;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    try {
      console.log("Creating PrismaClient for user operation");
      const prisma = new PrismaClient();
      
      if (action === 'create') {
        console.log("Checking if user exists:", email);
        // Check if user exists
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email }
          });
          
          if (existingUser) {
            await prisma.$disconnect();
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
          }
          
          console.log("User doesn't exist, creating new user");
          // Create a new user
          const hashedPassword = await bcrypt.hash(password, 10);
          const user = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              name: email.split('@')[0]
            }
          });
          
          console.log("User created, creating subscription");
          // Create a free subscription
          await prisma.subscription.create({
            data: {
              userId: user.id,
              status: 'active',
              plan: 'free'
            }
          });
          
          await prisma.$disconnect();
          
          return NextResponse.json({
            message: 'User created successfully',
            user: { id: user.id, email: user.email }
          });
        } catch (dbError) {
          console.error("Database operation error:", dbError);
          await prisma.$disconnect();
          return NextResponse.json({
            error: 'Database operation error',
            message: dbError.message,
            code: dbError.code
          }, { status: 500 });
        }
      }
      
      await prisma.$disconnect();
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (prismaError) {
      console.error("Prisma initialization error:", prismaError);
      return NextResponse.json({
        error: 'Prisma initialization error',
        message: prismaError.message,
        code: prismaError.code
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({
      error: 'Server error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
