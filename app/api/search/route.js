import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Get search parameters from the URL
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    
    // Get API key from request body
    const { apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
    
    // Set up options for the Filmot API request
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'filmot-tube-metadata-archive.p.rapidapi.com'
      }
    };
    
    // Make the API request
    const apiUrl = `https://filmot-tube-metadata-archive.p.rapidapi.com/getsearchsubtitles?${searchParams}`;
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
