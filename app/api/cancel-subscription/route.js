// app/api/cancel-subscription/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { stripe } from '@/lib/stripe';

const prisma = new PrismaClient();

export async function POST() {
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
    
    if (!user.subscription || !user.subscription.stripeSubscriptionId) {
      return NextResponse.json({ 
        error: 'No active subscription found' 
      }, { status: 400 });
    }
    
    // Cancel subscription in Stripe
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );
    
    // Update status in database
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        status: 'canceled',
      }
    });
    
    return NextResponse.json({ 
      message: 'Subscription canceled successfully',
      endsAt: new Date(subscription.current_period_end * 1000)
    });
    
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json({ 
      error: 'Error canceling subscription' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
