import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// IMPORTANT: THIS IS FOR EMERGENCY USE ONLY
// REMOVE THIS ENDPOINT AFTER FIXING YOUR AUTH ISSUES

export async function GET(request) {
  try {
    const prisma = new PrismaClient();
    
    // Get user count
    const userCount = await prisma.user.count();
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      message: 'Database connection successful',
      userCount
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Database error',
      message: error.message
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
    
    const prisma = new PrismaClient();
    
    if (action === 'create') {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        await prisma.$disconnect();
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }
      
      // Create a new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: email.split('@')[0]
        }
      });
      
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
    }
    
    await prisma.$disconnect();
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      message: error.message
    }, { status: 500 });
  }
}
