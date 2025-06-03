// app/api/stripe-webhook/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { prisma } from '../../../lib/prisma';
import { headers } from 'next/headers';

export async function POST(req) {
  console.log("Stripe webhook API called");
  const body = await req.text();
  const signature = headers().get('Stripe-Signature');

  if (!signature) {
    console.error("No Stripe signature found in webhook request");
    return NextResponse.json(
      { error: "No Stripe signature found in request" },
      { status: 400 }
    );
  }

  let event;

  try {
    console.log("Verifying Stripe webhook signature");
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

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log("Processing checkout.session.completed event");
        const session = event.data.object;
        
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        
        console.log(`Checkout completed: Customer ${customerId}, Subscription ${subscriptionId}`);
        
        const user = await prisma.user.findFirst({
          where: {
            subscription: {
              stripeCustomerId: customerId,
            },
          },
          include: {
            subscription: true,
          },
        });

        if (!user) {
          console.error('User not found for customer:', customerId);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log(`Updating subscription for user ${user.id} to premium`);
        
        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            stripeSubscriptionId: subscriptionId,
            status: 'active',
            plan: 'premium',
            stripeCurrentPeriodEnd: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
          },
        });

        break;
      }
      
      case 'invoice.paid': {
        console.log("Processing invoice.paid event");
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        console.log(`Invoice paid for subscription ${subscriptionId}`);
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const user = await prisma.user.findFirst({
          where: {
            subscription: {
              stripeSubscriptionId: subscriptionId,
            },
          },
        });

        if (!user) {
          console.error('User not found for subscription:', subscriptionId);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log(`Updating subscription period for user ${user.id}`);
        
        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: 'active',
          },
        });
        
        break;
      }
      
      case 'customer.subscription.updated': {
        console.log("Processing customer.subscription.updated event");
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        
        console.log(`Subscription ${subscriptionId} updated to status: ${subscription.status}`);
        
        const user = await prisma.user.findFirst({
          where: {
            subscription: {
              stripeSubscriptionId: subscriptionId,
            },
          },
        });

        if (!user) {
          console.error('User not found for subscription:', subscriptionId);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log(`Updating subscription status for user ${user.id} to ${subscription.status}`);
        
        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            status: subscription.status,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        console.log("Processing customer.subscription.deleted event");
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        
        console.log(`Subscription ${subscriptionId} deleted`);
        
        const user = await prisma.user.findFirst({
          where: {
            subscription: {
              stripeSubscriptionId: subscriptionId,
            },
          },
        });

        if (!user) {
          console.error('User not found for subscription:', subscriptionId);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log(`Downgrading user ${user.id} to free plan`);
        
        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            status: 'canceled',
            plan: 'free',
          },
        });
        
        break;
      }
      
      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return NextResponse.json(
      { error: `Error processing webhook: ${error.message}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
