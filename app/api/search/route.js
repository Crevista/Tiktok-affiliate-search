// File: app/api/search/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { checkUserCanSearch, incrementSearchCount } from '../../../lib/subscription';

export const dynamic = 'force-dynamic'; // This tells Next.js this is a dynamic route

export async function GET(request) {
  try {
    // Check if user is logged in and has search permissions
    const session = await getServerSession(authOptions);
    
    // If not logged in, require authentication
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to search' },
        { status: 401 }
      );
    }
    
    // Check if user can perform a search based on their subscription
    const { canSearch, reason, searchesRemaining } = await checkUserCanSearch(session.user.id);
    
    // If user cannot search (e.g., free tier limit reached), return error
    if (!canSearch) {
      return NextResponse.json(
        { 
          error: reason || 'Search limit reached', 
          upgradeRequired: true,
          searchesRemaining: 0
        },
        { status: 403 }
      );
    }
    
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
    
    // Increment the user's search count
    await incrementSearchCount(session.user.id);
    
    // Add searches remaining info to the response
    const responseData = {
      ...data,
      searchInfo: {
        remaining: searchesRemaining,
        unlimited: session.user.subscription?.plan === 'premium' && session.user.subscription?.status === 'active'
      }
    };
    
    // Return the data
    return NextResponse.json(responseData);
  } catch (error) {
    // Handle any errors
    console.error('API route error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` }, 
      { status: 500 }
    );
  }
}
