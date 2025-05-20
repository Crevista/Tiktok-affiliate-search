// File: app/api/search/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

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
          // Only track search count for free users
          const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { subscription: true }
          });
          
          if (!user) {
            console.log("User not found in database:", session.user.email);
          } else {
            const isPremium = user.subscription?.plan === 'premium' && 
                              user.subscription?.status === 'active';
            
            // For free users, track search count but still allow the search
            if (!isPremium) {
              console.log("Free user search, tracking count");
              
              // If user has no subscription record, create a free one
              if (!user.subscription) {
                await prisma.subscription.create({
                  data: {
                    userId: user.id,
                    plan: 'free',
                    status: 'inactive',
                    searchCount: 1
                  }
                });
              } else {
                await prisma.subscription.update({
                  where: { userId: user.id },
                  data: { 
                    searchCount: (user.subscription.searchCount || 0) + 1 
                  }
                });
              }
            } else {
              console.log("Premium user search, not tracking count");
            }
          }
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
