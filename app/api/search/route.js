import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // This tells Next.js this is a dynamic route

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
    
    // Build the API URL with parameters
    let apiUrlParams = new URLSearchParams();
    apiUrlParams.append('query', query);
    
    // Add any additional parameters from the request
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'query' && value) {
        apiUrlParams.append(key, value);
      }
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
    const apiUrl = `https://filmot-tube-metadata-archive.p.rapidapi.com/getsearchsubtitles?${apiUrlParams.toString()}`;
    
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

// Make sure the route is set to no-cache to prevent stale responses
export const fetchCache = 'force-no-store';
export const revalidate = 0;
