import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get current month for search counts
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Fetch user with subscription and search count
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            OR: [
              { status: 'active' },
              { status: 'past_due' },
              { 
                AND: [
                  { status: 'canceled' },
                  { stripeCurrentPeriodEnd: { gt: new Date() } }
                ]
              }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        searchCounts: {
          where: {
            month: {
              gte: startOfMonth
            }
          },
          take: 1,
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // If no subscription exists, create a free tier subscription
    if (user.subscriptions.length === 0) {
      const newSubscription = await prisma.subscription.create({
        data: {
          userId,
          status: 'active',
          plan: 'free',
          stripeCurrentPeriodEnd: null, // No expiration for free tier
        }
      });
      
      user.subscriptions = [newSubscription];
    }
    
    // Format response
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        searchCounts: user.searchCounts[0],
      },
      subscription: user.subscriptions[0],
    });
    
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription information' },
      { status: 500 }
    );
  }
}

// Handle upgrading to premium (if you have a POST method)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { plan } = await request.json();
    
    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { 
        userId 
      },
      update: {
        status: 'active',
        plan: plan || 'premium',
        // In a real implementation, this would come from Stripe
        stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      create: {
        userId,
        status: 'active',
        plan: plan || 'premium',
        stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    
    return NextResponse.json({ 
      success: true,
      subscription
    });
    
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
