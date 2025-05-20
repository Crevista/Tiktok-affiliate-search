// app/api/webhooks/route.js
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

// This endpoint doesn't need CSRF protection
export const POST = async (req) => {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
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
        const session = event.data.object;
        
        // Extract the subscription ID
        const subscriptionId = session.subscription;
        
        // Extract customer ID
        const customerId = session.customer;
        
        // Find user by customer ID
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

        // Update subscription in database
        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            stripeSubscriptionId: subscriptionId,
            status: 'active',
            plan: 'premium',
            stripePriceId: session.line_items?.data[0]?.price?.id || null,
            stripeCurrentPeriodEnd: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days from now as fallback
            ),
          },
        });

        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Find user by subscription ID
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

        // Update subscription end date
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
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        
        // Find user by subscription ID
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
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        
        // Find user by subscription ID
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

        // Update subscription status
        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            status: 'canceled',
            plan: 'free',
          },
        });
        
        break;
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
};
