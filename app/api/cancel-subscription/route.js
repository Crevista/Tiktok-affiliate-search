import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        plan: 'premium',
      },
    });
    
    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.redirect(new URL('/account?error=no-subscription', process.env.NEXTAUTH_URL));
    }
    
    // Cancel the subscription in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    
    // Update subscription in database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'canceled',
      },
    });
    
    // Redirect back to account page with success message
    return NextResponse.redirect(new URL('/account?canceled=true', process.env.NEXTAUTH_URL));
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.redirect(new URL('/account?error=cancel-failed', process.env.NEXTAUTH_URL));
  }
}
