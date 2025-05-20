import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from "../../../../lib/prismaClient";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get the current search count
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get user data including subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get or create search count record
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const searchCount = await prisma.searchCount.findUnique({
      where: {
        userId_month: {
          userId,
          month: startOfMonth
        }
      }
    });
    
    const isPremium = user.subscriptions.length > 0 && 
                      user.subscriptions[0].plan === 'premium' && 
                      user.subscriptions[0].status === 'active';
    
    return NextResponse.json({
      searchCount: searchCount ? searchCount.count : 0,
      monthLimit: isPremium ? Infinity : 5,
      remaining: isPremium ? Infinity : (searchCount ? 5 - searchCount.count : 5),
      isPremium
    });
    
  } catch (error) {
    console.error('Error getting search count:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// Increment the search count
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Check if user has premium subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        plan: 'premium'
      }
    });
    
    // Premium users don't need search count tracking
    if (subscription) {
      return NextResponse.json({
        success: true,
        remaining: Infinity,
        isPremium: true
      });
    }
    
    // For free users, track search count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Use upsert for better reliability with the unique constraint
    const searchCount = await prisma.searchCount.upsert({
      where: {
        userId_month: {
          userId,
          month: startOfMonth
        }
      },
      update: {
        count: {
          increment: 1
        }
      },
      create: {
        userId,
        month: startOfMonth,
        count: 1
      }
    });
    
    const remaining = Math.max(0, 5 - searchCount.count);
    
    return NextResponse.json({
      success: true,
      count: searchCount.count,
      remaining,
      isPremium: false
    });
    
  } catch (error) {
    console.error('Error incrementing search count:', error);
    return NextResponse.json({ error: 'Failed to update search count' }, { status: 500 });
  }
}
