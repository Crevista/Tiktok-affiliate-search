// app/api/search/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic'; // This tells Next.js this is a dynamic route

export async function POST(req) {
  try {
    console.log("Search API called");
    
    // Get session to verify user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log("No user session found");
      return NextResponse.json({
        error: 'You must be logged in to search'
      }, { status: 401 });
    }
    
    console.log("User authenticated:", session.user.email);
    
    // Get search parameters from request
    let data;
    try {
      data = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json({
        error: 'Invalid request format'
      }, { status: 400 });
    }
    
    const { query, channel } = data || {};
    console.log("Search parameters:", { query, channel });
    
    if (!query) {
      console.log("Missing query parameter");
      return NextResponse.json({
        error: 'Search query is required'
      }, { status: 400 });
    }
    
    // Check if user can search (subscription status)
    try {
      // Get user with subscription using raw SQL to avoid prepared statement issues
      const users = await prisma.$queryRaw`
        SELECT u.id, u.email, s.plan, s.status, s."searchCount"
        FROM "User" u
        LEFT JOIN "Subscription" s ON u.id = s."userId"
        WHERE u.id = ${session.user.id}
        LIMIT 1
      `;
      
      const user = users.length > 0 ? users[0] : null;
      
      if (!user) {
        console.log("User not found:", session.user.id);
        return NextResponse.json({ 
          error: 'User not found' 
        }, { status: 404 });
      }
      
      // If no subscription or not premium, check limits
      if (!user.plan || user.plan !== 'premium' || user.status !== 'active') {
        const searchCount = user.searchCount || 0;
        const FREE_TIER_LIMIT = 5;
        
        console.log(`User ${user.id} search count: ${searchCount}/${FREE_TIER_LIMIT}`);
        
        if (searchCount >= FREE_TIER_LIMIT) {
          console.log("User reached search limit");
          return NextResponse.json({
            error: 'You have reached your monthly search limit. Please upgrade to continue searching.',
            requiresUpgrade: true
          }, { status: 403 });
        }
        
        // Increment search count for free users using raw SQL
        try {
          await prisma.$executeRaw`
            UPDATE "Subscription" 
            SET "searchCount" = "searchCount" + 1
            WHERE "userId" = ${user.id}
          `;
          console.log(`Updated search count for user ${user.id}: ${searchCount} -> ${searchCount + 1}`);
        } catch (error) {
          console.error("Error updating search count:", error);
          // Continue anyway to not block the search
        }
      }
    } catch (error) {
      console.error('Error checking search permission:', error);
      // Continue anyway to not block the search
    }
    
    // This would be where you would call your actual search API
    console.log("Performing search for:", query);
    
    // For now, return mock data
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
    
    console.log("Returning mock results");
    
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
