// app/api/auth/seed/route.js
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log("Seed API called - creating demo user");
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });
    
    if (existingUser) {
      console.log("Demo user already exists:", existingUser.id);
      
      // Check if demo user has a subscription
      const subscription = await prisma.subscription.findFirst({
        where: { userId: existingUser.id }
      });
      
      // Create subscription if it doesn't exist
      if (!subscription) {
        console.log("Creating subscription for existing demo user");
        await prisma.subscription.create({
          data: {
            userId: existingUser.id,
            plan: 'free',
            status: 'inactive',
            searchCount: 0
          }
        });
      }
      
      return NextResponse.json({
        message: 'Demo user already exists',
        userId: existingUser.id
      });
    }
    
    // Create demo user
    const hashedPassword = await hash('password123', 12);
    
    console.log("Creating new demo user");
    const user = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: 'demo@example.com',
        password: hashedPassword,
        newsletter: false,
      },
    });
    
    console.log("Demo user created successfully:", user.id);
    
    // Create a subscription for the demo user
    console.log("Creating subscription for new demo user");
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'free',
        status: 'inactive',
        searchCount: 0
      }
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
  } finally {
    await prisma.$disconnect();
  }
}
