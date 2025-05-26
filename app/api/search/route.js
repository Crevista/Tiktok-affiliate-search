// app/api/search/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// Handle POST requests for search functionality
export async function POST(req) {
  try {
    // Get session to verify user
    let session;
    let userId = null;
    
    try {
      session = await getServerSession(authOptions);
      userId = session?.user?.id;
      console.log("Session check completed", session ? "User authenticated" : "No session");
      
      // Require authentication
      if (!userId) {
        return NextResponse.json({
          error: 'You must be logged in to search'
        }, { status: 401 });
      }
    } catch (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json({
        error: 'Authentication error'
      }, { status: 401 });
    }
    
    // Check subscription status and search limits
    let isPremium = false;
    let searchesRemaining = 0;
    
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
      
      // If no subscription found, create a free one
      if (!user?.plan) {
        await prisma.subscription.create({
          data: {
            userId,
            plan: 'free',
            status: 'inactive',
            searchCount: 0
          }
        });
        
        searchesRemaining = 5; // Fresh free account
      } else {
        // Check if user is premium
        isPremium = user.plan === 'premium' && user.status === 'active';
        
        // If not premium, check free tier limitations
        if (!isPremium) {
          const searchCount = user.searchCount || 0;
          const FREE_TIER_LIMIT = 5;
          
          searchesRemaining = Math.max(0, FREE_TIER_LIMIT - searchCount);
          
          // Check if user has reached the search limit
          if (searchesRemaining <= 0) {
            console.log("User reached search limit");
            return NextResponse.json({
              error: 'You have reached your monthly search limit. Please upgrade to continue searching.',
              requiresUpgrade: true
            }, { status: 403 });
          }
          
          // Increment search count for free users
          await prisma.$executeRaw`
            UPDATE "Subscription" 
            SET "searchCount" = "searchCount" + 1
            WHERE "userId" = ${userId}
          `;
          console.log(`Updated search count for user ${userId}`);
          
          // Decrease remaining searches
          searchesRemaining--;
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Continue anyway to avoid blocking search
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
    
    // Add all search parameters - WITH THE CHANNEL FIX
    for (const [key, value] of Object.entries(searchData)) {
      if (value !== null && value !== undefined && value !== '') {
        // Map channelID to the correct Filmot parameter name
        let paramName = key;
        if (key === 'channelID') {
          paramName = 'channel'; // Filmot uses 'channel', not 'channelID'
        }
        searchParams.append(paramName, value);
      }
    }
    
    // Add the missing required parameter
    searchParams.append('searchManualSubs', '1');
    
    // Use the server's API key from environment variables
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Server API key is not configured' 
      }, { status: 500 });
    }
    
    // Set up options for the Filmot API request with correct headers
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'filmot-tube-metadata-archive.p.rapidapi.com'
      }
    };
    
    // Make the API request with proper URL encoding
    const apiUrl = `https://filmot-tube-metadata-archive.p.rapidapi.com/getsearchsubtitles?${searchParams.toString()}`;
    
    console.log(`Making API request to: ${apiUrl}`);
    console.log('Search data received:', searchData);
    console.log('Channel ID being used:', searchData.channelID || searchData.channelId || 'NONE');
    console.log('Final URL params:', searchParams.toString());
    
    const response = await fetch(apiUrl, options);
    
    console.log('API request status:', response.status);
    console.log('API request ok:', response.ok);
    
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
    
    console.log('Raw API response (first 300 chars):', rawText.substring(0, 300));
    
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
    
    console.log('API response keys:', Object.keys(data));
    console.log('Has result:', !!data.result);
    console.log('Has results:', !!data.results);
    console.log('Result length:', data.result?.length || 0);
    console.log('Results length:', data.results?.length || 0);
    console.log('Total result count:', data.totalresultcount);
    
    // Apply free tier limitations - restrict to 2 results if not premium
    if (!isPremium && data && data.result && Array.isArray(data.result) && data.result.length > 2) {
      data.result = data.result.slice(0, 2);
      data.totalresultcount = data.result.length;
      data.freeAccountLimited = true;
      data.searchesRemaining = searchesRemaining;
    }
    
    // Add premium status and searches remaining to response
    data.isPremium = isPremium;
    data.searchesRemaining = isPremium ? null : searchesRemaining;
    
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

// Keep the GET method for backward compatibility but add same restrictions
export async function GET(request) {
  try {
    // Get session to verify user
    let session;
    let userId = null;
    
    try {
      session = await getServerSession(authOptions);
      userId = session?.user?.id;
      
      // Require authentication
      if (!userId) {
        return NextResponse.json({
          error: 'You must be logged in to search'
        }, { status: 401 });
      }
    } catch (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json({
        error: 'Authentication error'
      }, { status: 401 });
    }
    
    // Check subscription status
    let isPremium = false;
    let searchesRemaining = 0;
    
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
      
      // If no subscription, create a free one
      if (!user?.plan) {
        await prisma.subscription.create({
          data: {
            userId,
            plan: 'free',
            status: 'inactive',
            searchCount: 0
          }
        });
        
        searchesRemaining = 5; // Fresh account
      } else {
        // Check if user is premium
        isPremium = user.plan === 'premium' && user.status === 'active';
        
        // If not premium, check limits
        if (!isPremium) {
          const searchCount = user.searchCount || 0;
          const FREE_TIER_LIMIT = 5;
          
          searchesRemaining = Math.max(0, FREE_TIER_LIMIT - searchCount);
          
          // Check if user has reached search limit
          if (searchesRemaining <= 0) {
            return NextResponse.json({
              error: 'You have reached your monthly search limit. Please upgrade to continue searching.',
              requiresUpgrade: true
            }, { status: 403 });
          }
          
          // Increment search count
          await prisma.$executeRaw`
            UPDATE "Subscription" 
            SET "searchCount" = "searchCount" + 1
            WHERE "userId" = ${userId}
          `;
          
          // Decrease remaining searches
          searchesRemaining--;
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
    
    // Use the parsed URL object from Next.js
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }
    
    // Add the missing required parameter
    searchParams.append('searchManualSubs', '1');
    
    // Use the server's API key from environment variables
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Server API key is not configured' }, { status: 500 });
    }
    
    // Set up options for the Filmot API request with correct headers
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'filmot-tube-metadata-archive.p.rapidapi.com'
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
    
    // Apply free tier limitations - restrict to 2 results if not premium
    if (!isPremium && data && data.result && Array.isArray(data.result) && data.result.length > 2) {
      data.result = data.result.slice(0, 2);
      data.totalresultcount = data.result.length;
      data.freeAccountLimited = true;
      data.searchesRemaining = searchesRemaining;
    }
    
    // Add premium status and searches remaining to response
    data.isPremium = isPremium;
    data.searchesRemaining = isPremium ? null : searchesRemaining;
    
    // Return the API data
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
