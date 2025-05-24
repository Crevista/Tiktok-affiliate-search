// app/api/subscription/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    console.log("Subscription API called");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log("No user session found in subscription API");
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    console.log("Fetching subscription for user:", session.user.email);
    
    // Get user and their subscription
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
    
    // If user has no subscription record, create a free one
    if (!user.subscription) {
      console.log("No subscription found, creating one for user:", user.id);
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'free',
          status: 'inactive',
          searchCount: 0
        },
      });
      
      return NextResponse.json({ subscription });
    }
    
    console.log("Returning subscription for user:", user.id, user.subscription);
    return NextResponse.json({ subscription: user.subscription });
    
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ 
      error: 'Error fetching subscription' 
    }, { status: 500 });
  }
}
