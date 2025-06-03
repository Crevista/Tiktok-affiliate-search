// app/api/stripe-events/route.js
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
  console.log("Stripe webhook called");
  const body = await req.text();
  const signature = headers().get('Stripe-Signature');

  if (!signature) {
    console.error("No Stripe signature found");
    return NextResponse.json(
      { error: "No Stripe signature found" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("Webhook event verified:", event.type);
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
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

        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            stripeSubscriptionId: subscriptionId,
            status: 'active',
            plan: 'premium',
            stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        console.log(`User ${user.id} upgraded to premium`);
        break;
      }
      
      case 'invoice.paid': {
        console.log("Processing invoice.paid");
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
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
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return NextResponse.json(
      { error: `Error processing webhook: ${error.message}` },
      { status: 500 }
    );
  }
}
