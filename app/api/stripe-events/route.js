// app/api/stripe-events/route.js
// ⚠️ TEMPORARY VERSION - NO SIGNATURE VERIFICATION FOR TESTING
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { stripe } from '../../../lib/stripe';
import { prisma } from '../../../lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
  return NextResponse.json({ 
    error: 'This is a Stripe webhook endpoint - use POST method' 
  }, { status: 405 });
}

export async function POST(req) {
  console.log("Stripe webhook called - TESTING WITHOUT SIGNATURE VERIFICATION");
  const body = await req.text();
  
  let event;

  try {
    // TEMPORARILY SKIP SIGNATURE VERIFICATION FOR TESTING
    event = JSON.parse(body);
    console.log("Webhook event received:", event.type);
  } catch (error) {
    console.error(`Webhook parsing error: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook parsing error: ${error.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log("Processing checkout.session.completed");
        const session = event.data.object;
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        
        console.log(`Customer: ${customerId}, Subscription: ${subscriptionId}`);
        
        const user = await prisma.user.findFirst({
          where: {
            subscription: {
              stripeCustomerId: customerId,
            },
          },
          include: { subscription: true },
        });

        if (!user) {
          console.error('User not found for customer:', customerId);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log(`Found user ${user.id}, updating to premium`);

        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            stripeSubscriptionId: subscriptionId,
            status: 'active',
            plan: 'premium',
            stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        console.log(`User ${user.id} successfully upgraded to premium`);
        break;
      }
      
      case 'invoice.paid': {
        console.log("Processing invoice.paid");
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        console.log(`Invoice paid for subscription: ${subscriptionId}`);
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const user = await prisma.user.findFirst({
          where: {
            subscription: { stripeSubscriptionId: subscriptionId },
          },
        });

        if (user) {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              status: 'active',
            },
          });
          console.log(`Updated subscription for user ${user.id}`);
        } else {
          console.log('No user found for subscription:', subscriptionId);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    console.log("Webhook processed successfully");
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    return NextResponse.json(
      { error: `Error processing webhook: ${error.message}` },
      { status: 500 }
    );
  }
}
