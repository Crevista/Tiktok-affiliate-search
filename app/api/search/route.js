// app/api/search/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';
// Remove this import if the function doesn't exist
// import { incrementSearchCount } from '../../../lib/subscription';

export const dynamic = 'force-dynamic'; // This tells Next.js this is a dynamic route

export async function POST(req) {
  try {
    // Get session to verify user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({
        error: 'You must be logged in to search'
      }, { status: 401 });
    }
    
    // Get search parameters from request
    const data = await req.json();
    const { query, channel } = data;
    
    if (!query) {
      return NextResponse.json({
        error: 'Search query is required'
      }, { status: 400 });
    }
    
    // Check if user can search (subscription status)
    try {
      // Get user with subscription
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { subscription: true }
      });
      
      // If no subscription or not premium, check limits
      if (!user?.subscription || user.subscription.plan !== 'premium' || user.subscription.status !== 'active') {
        const searchCount = user?.subscription?.searchCount || 0;
        const FREE_TIER_LIMIT = 5;
        
        if (searchCount >= FREE_TIER_LIMIT) {
          return NextResponse.json({
            error: 'You have reached your monthly search limit. Please upgrade to continue searching.',
            requiresUpgrade: true
          }, { status: 403 });
        }
        
        // Increment search count for free users
        // Instead of using incrementSearchCount, increment directly
        if (user?.subscription) {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: { searchCount: searchCount + 1 }
          });
        }
      }
    } catch (error) {
      console.error('Error checking search permission:', error);
      // Continue anyway to not block the search
    }
    
    // Perform the actual search using the provided API
    // This is a mock response - replace with your actual API call
    const mockResults = [
      {
        id: '1',
        title: 'Great Product Review',
        thumbnail: 'https://i.ytimg.com/vi/abc123/maxresdefault.jpg',
        channelName: 'TechReviewer',
        mentions: [
          {
            time: '5:37',
            timeSeconds: 337,
            context: '...and this new wireless charger is amazing, I use it every day...'
          }
        ]
      },
      {
        id: '2',
        title: 'Top 10 Products of 2023',
        thumbnail: 'https://i.ytimg.com/vi/def456/maxresdefault.jpg',
        channelName: 'BestProducts',
        mentions: [
          {
            time: '2:14',
            timeSeconds: 134,
            context: '...coming in at number 3 is this incredible wireless charger...'
          },
          {
            time: '8:45',
            timeSeconds: 525,
            context: '...you can get this wireless charger for just $49.99...'
          }
        ]
      }
    ];
    
    // Return mock results for now
    return NextResponse.json({
      results: mockResults,
      query: query,
      channel: channel || null
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      error: 'An error occurred during search: ' + error.message
    }, { status: 500 });
  }
}
