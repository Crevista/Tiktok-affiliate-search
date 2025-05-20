// app/api/cancel-subscription/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';
import { stripe } from '../../../lib/stripe';

export async function POST(req) {
  try {
    console.log("Cancel subscription API called");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log("No user session found in cancel subscription API");
      return NextResponse.json({ 
        error: 'You must be logged in to cancel a subscription' 
      }, { status: 401 });
    }
    
    console.log("Fetching user for cancellation:", session.user.email);
    
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
    
    // Check if user has a subscription
    if (!user.subscription || !user.subscription.stripeSubscriptionId) {
      console.log("No active subscription to cancel for user:", user.id);
      return NextResponse.json({ 
        error: 'No active subscription found' 
      }, { status: 400 });
    }
    
    const stripeSubscriptionId = user.subscription.stripeSubscriptionId;
    
    console.log("Canceling Stripe subscription:", stripeSubscriptionId);
    
    try {
      // Cancel the subscription with Stripe
      const subscription = await stripe.subscriptions.update(
        stripeSubscriptionId,
        { cancel_at_period_end: true }
      );
      
      console.log("Stripe subscription canceled at period end:", subscription.id);
      
      // Update the subscription status in the database
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { 
          status: 'canceled',
          // Keep the premium plan until the subscription actually ends
          // This allows the user to continue using premium features until the end of their billing period
        }
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Subscription will be canceled at the end of the billing period'
      });
    } catch (stripeError) {
      console.error("Stripe error canceling subscription:", stripeError);
      return NextResponse.json({ 
        error: `Error canceling subscription: ${stripeError.message}` 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in cancel subscription API:', error);
    return NextResponse.json({
      error: `Server error: ${error.message}`
    }, { status: 500 });
  }
}
