// app/api/search/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic'; // This tells Next.js this is a dynamic route

// Handle POST requests for new search implementation
export async function POST(req) {
  try {
    // Get session to verify user (optional - will proceed even if not logged in)
    let session;
    let userId = null;
    
    try {
      session = await getServerSession(authOptions);
      userId = session?.user?.id;
      console.log("Session check completed", session ? "User authenticated" : "No session");
    } catch (sessionError) {
      console.error("Session error (continuing anyway):", sessionError);
    }
    
    // Check subscription status if user is logged in
    if (userId) {
      try {
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
        // Continue anyway to avoid blocking search
      }
    }
    
    // Get search parameters from request body
    let searchData;
    try {
      const rawBody = await req.text();
      searchData = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json({ 
        error: 'Invalid request format' 
      }, { status: 400 });
    }
    
    // Convert POST body parameters to URL search params for the API
    const searchParams = new URLSearchParams();
    
    // Add all search parameters
    for (const [key, value] of Object.entries(searchData)) {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    }
    
    // Use the server's API key from environment variables
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Server API key is not configured' 
      }, { status: 500 });
    }
    
    // Set up options for the Filmot API request
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'filmot-tube-metadata-archive.p.rapidapi.com'
      }
    };
    
    // Make the API request with proper URL encoding
    const apiUrl = `https://filmot-tube-metadata-archive.p.rapidapi.com/getsearchsubtitles?${searchParams.toString()}`;
    
    console.log(`Making API request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, options);
    
    // If the API request failed, return the error
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `API request failed: ${response.status} - ${errorText}` }, 
        { status: response.status }
      );
    }
    
    // Get the raw response text for better error handling
    const rawText = await response.text();
    
    // Check if empty response
    if (!rawText.trim()) {
      throw new Error('Empty response received from API');
    }
    
    // Parse the API response
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      console.error('Raw response:', rawText.substring(0, 500) + '...');
      throw new Error(`Failed to parse API response: ${parseError.message}`);
    }
    
    // Return the API data
    return NextResponse.json(data);
    
  } catch (error) {
    // Handle any errors
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` }, 
      { status: 500 }
    );
  }
}

// Keep the GET method for backward compatibility
export async function GET(request) {
  try {
    // Use the parsed URL object from Next.js
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }
    
    // Use the server's API key from environment variables
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Server API key is not configured' }, { status: 500 });
    }
    
    // Set up options for the Filmot API request
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'filmot-tube-metadata-archive.p.rapidapi.com'
      }
    };
    
    // Make the API request with proper URL encoding
    const apiUrl = `https://filmot-tube-metadata-archive.p.rapidapi.com/getsearchsubtitles?${searchParams.toString()}`;
    
    const response = await fetch(apiUrl, options);
    
    // If the API request failed, return the error
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API request failed: ${response.status} - ${errorText}` }, 
        { status: response.status }
      );
    }
    
    // Parse the API response
    const data = await response.json();
    
    // Return the data
    return NextResponse.json(data);
  } catch (error) {
    // Handle any errors
    console.error('API route error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` }, 
      { status: 500 }
    );
  }
}
