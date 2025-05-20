// app/api/search/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic'; // This tells Next.js this is a dynamic route

export async function POST(req) {
  console.log("Search API called - simplified version");
  
  try {
    // Get session to verify user
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log("Session check completed", session ? "User authenticated" : "No session");
    } catch (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json({
        error: 'Authentication error'
      }, { status: 401 });
    }
    
    if (!session?.user) {
      console.log("No user session found");
      return NextResponse.json({
        error: 'You must be logged in to search'
      }, { status: 401 });
    }
    
    // Get search parameters from request
    let data = {};
    try {
      const rawBody = await req.text(); // Get raw text first
      console.log("Raw request body:", rawBody);
      
      if (rawBody) {
        data = JSON.parse(rawBody);
      }
      console.log("Parsed request data:", data);
    } catch (parseError) {
      console.error("Request parsing error:", parseError);
      return NextResponse.json({
        error: 'Invalid request format'
      }, { status: 400 });
    }
    
    const { query = '', channel = null } = data;
    console.log("Search parameters:", { query, channel });
    
    if (!query) {
      console.log("Missing query parameter");
      return NextResponse.json({
        error: 'Search query is required'
      }, { status: 400 });
    }
    
    // Skip subscription checks for now
    
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
    
    console.log("Returning mock results");
    
    return NextResponse.json({
      results: mockResults,
      query: query,
      channel: channel
    });
    
  } catch (error) {
    console.error('Overall search handler error:', error);
    
    // Always return a valid JSON response
    return NextResponse.json({
      error: 'An error occurred during search: ' + error.message
    }, { status: 500 });
  }
}
