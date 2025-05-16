import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId }
    });
    
    // If no subscription exists, create a free tier subscription
    if (!subscription) {
      const newSubscription = await prisma.subscription.create({
        data: {
          userId,
          status: 'active',
          plan: 'free',
          stripeCurrentPeriodEnd: null, // No expiration for free tier
        }
      });
      
      return NextResponse.json({ subscription: newSubscription });
    }
    
    return NextResponse.json({ subscription });
    
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// This endpoint will also handle upgrading to premium (stub for now)
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
