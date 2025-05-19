import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Add this line at the top of the file
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
        
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        await handleSubscriptionUpdated(updatedSubscription);
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionDeleted(deletedSubscription);
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        await handlePaymentFailed(failedInvoice);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return NextResponse.json(
      { error: 'An error occurred while processing the webhook' },
      { status: 500 }
    );
  }
}

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  if (session.mode !== 'subscription') return;

  try {
    // Get customer and subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const customerId = session.customer;
    const userId = session.metadata.userId || subscription.metadata.userId;

    if (!userId) {
      console.error('No userId found in session or subscription metadata');
      return;
    }

    // Get existing subscription from database
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        stripeSubscriptionId: subscription.id,
      },
    });

    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: subscription.status,
          plan: 'premium',
        },
      });
    } else {
      // Create new subscription
      await prisma.subscription.create({
        data: {
          userId: userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: subscription.status,
          plan: 'premium',
        },
      });
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed webhook:', error);
    throw error;
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  try {
    const subscriptionData = {
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };

    // Update subscription in database
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: subscriptionData,
    });
  } catch (error) {
    console.error('Error handling customer.subscription.updated webhook:', error);
    throw error;
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  try {
    // Update subscription in database
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'canceled',
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  } catch (error) {
    console.error('Error handling customer.subscription.deleted webhook:', error);
    throw error;
  }
}

// Handle payment failures
async function handlePaymentFailed(invoice) {
  try {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) return;
    
    // Update subscription status in database
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: 'past_due' },
    });
  } catch (error) {
    console.error('Error handling invoice.payment_failed webhook:', error);
    throw error;
  }
}

// REMOVE THIS SECTION:
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
