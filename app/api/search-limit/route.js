// app/api/search-limit/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Get user and their subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // If user has no subscription, create a free one
    if (!user.subscription) {
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'free',
          status: 'inactive',
          searchCount: 0
        },
      });
      
      return NextResponse.json({ 
        plan: 'free',
        searchCount: 0,
        searchesRemaining: 5,
        unlimited: false
      });
    }
    
    // Calculate searches remaining for free tier
    const searchCount = user.subscription.searchCount || 0;
    const FREE_TIER_LIMIT = 5;
    const searchesRemaining = user.subscription.plan === 'premium' 
      ? null 
      : Math.max(0, FREE_TIER_LIMIT - searchCount);
    
    return NextResponse.json({
      plan: user.subscription.plan,
      searchCount,
      searchesRemaining,
      unlimited: user.subscription.plan === 'premium' && user.subscription.status === 'active'
    });
    
  } catch (error) {
    console.error('Error fetching search limit:', error);
    return NextResponse.json({ 
      error: 'Error fetching search limit' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
