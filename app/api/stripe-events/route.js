// app/api/stripe-events/route.js
// WORKING VERSION WITH DATABASE UPDATES

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  return new Response("Webhook endpoint is working", { status: 200 });
}

export async function POST(request) {
  try {
    console.log("=== WEBHOOK CALLED ===");
    
    const body = await request.text();
    const event = JSON.parse(body);
    
    console.log("Event type:", event.type);
    console.log("Event ID:", event.id);
    
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
          return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
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
        
        const user = await prisma.user.findFirst({
          where: {
            subscription: { stripeSubscriptionId: subscriptionId },
          },
        });

        if (user) {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              status: 'active',
              plan: 'premium',
              stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
    
    console.log("=== WEBHOOK SUCCESS ===");
    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("=== WEBHOOK ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
