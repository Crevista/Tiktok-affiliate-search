// app/api/search/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic'; // This tells Next.js this is a dynamic route

export async function POST(req) {
  console.log("Search API called");
  
  try {
    // Get session to verify user
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log("Session check completed", session ? "User authenticated" : "No session");
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
      console.log("Search request data:", data);
    } catch (parseError) {
      console.error("Request parsing error:", parseError);
      return NextResponse.json({
        error: 'Invalid request format'
      }, { status: 400 });
    }
    
    const { query = '', channelID = null } = data;
    
    if (!query) {
      return NextResponse.json({
        error: 'Search query is required'
      }, { status: 400 });
    }
    
    // If user is logged in, check subscription
    const userId = session?.user?.id;
    
    if (userId) {
      try {
        // Check subscription status (using raw SQL to avoid prepared statement issues)
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
            console.log(`Updated search count for user ${userId}`);
          } catch (error) {
            console.error("Error updating search count:", error);
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }
    
    // Prepare improved mock results
    // This data structure matches what the frontend is expecting
    const mockResults = [
      {
        id: 'abc123',
        title: 'Great Product Review: Ultimate Guide',
        channelname: 'TechReviewer',
        duration: 780, // 13 minutes
        viewcount: 354879,
        uploaddate: '2023-11-15',
        hits: [
          {
            start: 337,
            token: query,
            ctx_before: "I've been testing this for weeks and I can confirm that",
            ctx_after: "is definitely worth the investment. The quality is outstanding"
          },
          {
            start: 452,
            token: query,
            ctx_before: "Many people asked me about whether",
            ctx_after: "is better than the competition, and I would say yes"
          }
        ]
      },
      {
        id: 'def456',
        title: 'Top 10 Products of 2023 You Need to Buy',
        channelname: 'BestProducts',
        duration: 1260, // 21 minutes
        viewcount: 1254632,
        uploaddate: '2023-10-23',
        hits: [
          {
            start: 134,
            token: query,
            ctx_before: "Coming in at number 3 on our list is this incredible",
            ctx_after: "which has been taking the market by storm for good reasons"
          },
          {
            start: 525,
            token: query,
            ctx_after: "is currently on sale for just $49.99, which is a steal for what you get"
          }
        ]
      }
    ];
    
    // Return mock results
    console.log("Returning mock results");
    
    return NextResponse.json({
      results: mockResults,
      query: query,
      channel: channelID,
      isLoggedIn: !!userId,
      totalresultcount: mockResults.length
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      error: 'An error occurred during search: ' + error.message
    }, { status: 500 });
  }
}
