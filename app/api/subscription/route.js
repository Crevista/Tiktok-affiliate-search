// app/api/subscription/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Get user and their subscription
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // If user has no subscription record, create a free one
    if (!user.subscription) {
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'free',
          status: 'inactive',
        },
      });
      
      return NextResponse.json({ subscription });
    }
    
    return NextResponse.json({ subscription: user.subscription });
    
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ 
      error: 'Error fetching subscription' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
