// app/api/search-limit/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    console.log("Search limit API called");
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log("No user session found in search limit API");
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    console.log("Fetching search limit for user:", session.user.id);
    
    // Get user and their subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    });
    
    if (!user) {
      console.log("User not found:", session.user.id);
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // If user has no subscription, create a free one
    if (!user.subscription) {
      console.log("No subscription found, creating one for user:", user.id);
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
    
    const isPremium = user.subscription.plan === 'premium' && 
                      user.subscription.status === 'active';
    
    console.log(`User ${user.id} stats:`, {
      plan: user.subscription.plan,
      searchCount,
      searchesRemaining,
      unlimited: isPremium
    });
    
    return NextResponse.json({
      plan: user.subscription.plan,
      searchCount,
      searchesRemaining,
      unlimited: isPremium
    });
    
  } catch (error) {
    console.error('Error fetching search limit:', error);
    return NextResponse.json({ 
      error: 'Error fetching search limit' 
    }, { status: 500 });
  }
}
