// app/api/cancel-subscription/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

import { stripe } from '../../../lib/stripe'; // Updated import path


export async function POST() {
  try {
    console.log("Cancel subscription API called");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log("No user session found in cancel subscription API");
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    console.log("Processing cancellation for user:", session.user.email);
    
    // Get user and their subscription
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });
    
    if (!user) {
      console.log("User not found:", session.user.email);
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    if (!user.subscription || !user.subscription.stripeSubscriptionId) {
      console.log("No active subscription found for user:", user.id);
      return NextResponse.json({ 
        error: 'No active subscription found' 
      }, { status: 400 });
    }
    
    console.log(`Canceling Stripe subscription: ${user.subscription.stripeSubscriptionId}`);
    
    // Cancel subscription in Stripe
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );
    
    console.log(`Subscription canceled in Stripe, updating database for user: ${user.id}`);
    
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
      error: 'Error canceling subscription: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
