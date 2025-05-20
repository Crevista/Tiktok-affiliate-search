// app/api/search/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { incrementSearchCount } from '../../../lib/subscription'; // Updated import path

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic'; // This tells Next.js this is a dynamic route

export async function GET(request) {
  try {
    console.log("Search API called");
    
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

    // Try to get the user session
    try {
      const session = await getServerSession(authOptions);
      
      // If user is not logged in, we'll still allow the search but log it
      if (!session?.user) {
        console.log("No user session found, but continuing with search");
      } else {
        console.log("User session found:", session.user.email);
        
        // Try to increment search count (but don't block the search if it fails)
        try {
          // Increment search count for the user
          await incrementSearchCount(session.user.id);
        } catch (subscriptionError) {
          console.error("Error updating search count, but continuing with search:", subscriptionError);
        }
      }
    } catch (sessionError) {
      console.error("Error getting session, but continuing with search:", sessionError);
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
    
    console.log("Making API request to:", apiUrl);
    const response = await fetch(apiUrl, options);
    
    // If the API request failed, return the error
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API request failed:", response.status, errorText);
      return NextResponse.json(
        { error: `API request failed: ${response.status} - ${errorText}` }, 
        { status: response.status }
      );
    }
    
    // Parse the API response
    const data = await response.json();
    console.log("API request successful, returning results");
    
    // Return the data
    return NextResponse.json(data);
  } catch (error) {
    // Handle any errors
    console.error('API route error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
