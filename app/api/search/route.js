// app/api/search/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic'; // This tells Next.js this is a dynamic route

export async function POST(req) {
  console.log("Search API called with lenient authentication");
  
  try {
    // Try to get the session, but don't fail if it doesn't exist
    let session = null;
    let userId = null;
    
    try {
      session = await getServerSession(authOptions);
      userId = session?.user?.id;
      console.log("Session check completed:", session ? "User authenticated" : "No session");
    } catch (sessionError) {
      console.error("Session error (continuing anyway):", sessionError);
    }
    
    // Get search parameters from request
    let data = {};
    try {
      const rawBody = await req.text();
      if (rawBody) {
        data = JSON.parse(rawBody);
      }
    } catch (parseError) {
      console.error("Request parsing error:", parseError);
      return NextResponse.json({
        error: 'Invalid request format'
      }, { status: 400 });
    }
    
    const { query = '', channel = null } = data;
    
    if (!query) {
      return NextResponse.json({
        error: 'Search query is required'
      }, { status: 400 });
    }
    
    // If user is logged in, track their search count
    if (userId) {
      try {
        // Use raw SQL to avoid prepared statement issues
        const users = await prisma.$queryRaw`
          SELECT u.id, s.plan, s.status, s."searchCount"
          FROM "User" u
          LEFT JOIN "Subscription" s ON u.id = s."userId"
          WHERE u.id = ${userId}
          LIMIT 1
        `;
        
        const user = users.length > 0 ? users[0] : null;
        
        // If no subscription or not premium, check limits
        if (user && (!user.plan || user.plan !== 'premium' || user.status !== 'active')) {
          const searchCount = user.searchCount || 0;
          const FREE_TIER_LIMIT = 5;
          
          if (searchCount >= FREE_TIER_LIMIT) {
            console.log("User reached search limit");
            return NextResponse.json({
              error: 'You have reached your monthly search limit. Please upgrade to continue searching.',
              requiresUpgrade: true
            }, { status: 403 });
          }
          
          // Increment search count for free users
          try {
            await prisma.$executeRaw`
              UPDATE "Subscription" 
              SET "searchCount" = "searchCount" + 1
              WHERE "userId" = ${userId}
            `;
          } catch (error) {
            console.error("Error updating search count:", error);
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    } else {
      console.log("User not logged in, but continuing with search");
    }
    
    // Mock search results
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
          }
        ]
      }
    ];
    
    // Return results
    return NextResponse.json({
      results: mockResults,
      query: query,
      channel: channel,
      isLoggedIn: !!userId
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      error: 'An error occurred during search: ' + error.message
    }, { status: 500 });
  }
}
