// app/api/create-checkout-session/route.js
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'You must be logged in to subscribe' 
      }, { status: 401 });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // Create or get customer
    let customerId = user.subscription?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.email
      });
      
      customerId = customer.id;
      
      // Create subscription record if it doesn't exist
      if (!user.subscription) {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: customerId,
            plan: 'free',
            status: 'inactive'
          }
        });
      } else {
        await prisma.subscription.update({
          where: { userId: user.id },
          data: { stripeCustomerId: customerId }
        });
      }
    }
    
    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Premium plan price ID from Stripe
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/account?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: user.id
        }
      }
    });
    
    return NextResponse.json({ url: checkoutSession.url });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ 
      error: 'Error creating checkout session'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
