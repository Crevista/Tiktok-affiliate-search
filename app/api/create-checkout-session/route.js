// app/api/create-checkout-session/route.js
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe'; // Updated import path
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';


export async function POST(req) {
  try {
    console.log("Create checkout session API called");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log("No user session found in checkout API");
      return NextResponse.json({ 
        error: 'You must be logged in to subscribe' 
      }, { status: 401 });
    }
    
    console.log("Creating checkout session for user:", session.user.email);
    
    // Get user from database
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
    
    // Create or get customer
    let customerId = user.subscription?.stripeCustomerId;
    
    if (!customerId) {
      console.log("Creating new Stripe customer for user:", user.id);
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.email
      });
      
      customerId = customer.id;
      
      // Create subscription record if it doesn't exist
      if (!user.subscription) {
        console.log("Creating subscription record in database for user:", user.id);
        await prisma.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: customerId,
            plan: 'free',
            status: 'inactive',
            searchCount: 0
          }
        });
      } else {
        console.log("Updating subscription with Stripe customer ID for user:", user.id);
        await prisma.subscription.update({
          where: { userId: user.id },
          data: { stripeCustomerId: customerId }
        });
      }
    }
    
    // Get price ID from environment variable
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      console.error("STRIPE_PRICE_ID environment variable not set");
      return NextResponse.json({ 
        error: 'Stripe price ID not configured'
      }, { status: 500 });
    }
    
    console.log("Creating Stripe checkout session with price:", priceId);
    
    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId, // Premium plan price ID from Stripe
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
    
    console.log("Checkout session created:", checkoutSession.id);
    return NextResponse.json({ url: checkoutSession.url });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ 
      error: 'Error creating checkout session: ' + error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
