import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get user details
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
    
    // Check if the user already has an active subscription
    const existingSubscription = user.subscriptions[0];
    
    if (existingSubscription && existingSubscription.status === 'active' && existingSubscription.plan === 'premium') {
      return NextResponse.json({
        alreadySubscribed: true,
        message: 'You already have an active premium subscription'
      });
    }
    
    // Create Stripe customer if doesn't exist
    let stripeCustomerId = existingSubscription?.stripeCustomerId || null;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId }
      });
      
      stripeCustomerId = customer.id;
    }
    
    // Set app URL based on environment
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Your premium plan price ID
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
      success_url: `${appUrl}/account?checkout_success=true`,
      cancel_url: `${appUrl}/pricing?checkout_canceled=true`,
    });
    
    // Return the checkout URL
    return NextResponse.json({ url: checkoutSession.url });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
