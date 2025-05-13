import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });
    
    if (existingUser) {
      return NextResponse.json({
        message: 'Demo user already exists',
        userId: existingUser.id
      });
    }
    
    // Create demo user
    const hashedPassword = await hash('password123', 12);
    
    const user = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: 'demo@example.com',
        password: hashedPassword,
        newsletter: false,
      },
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Demo user created successfully',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ 
      error: 'Error creating demo user' 
    }, { status: 500 });
  }
}
