import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
    }
    
    // Use the server's API key from environment variables
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Server API key is not configured' }, { status: 500 });
    }
    
    // Since there's no direct channel search in the Filmot API,
    // we'll modify our approach to better extract channel info
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'filmot-tube-metadata-archive.p.rapidapi.com'
      }
    };
    
    // Search with the channel name in quotes to get better matches
    const apiUrl = `https://filmot-tube-metadata-archive.p.rapidapi.com/getsearchsubtitles?query=${encodeURIComponent(`"${query}"`)}&limit=20`;
    const response = await fetch(apiUrl, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API request failed: ${response.status} - ${errorText}` }, 
        { status: response.status }
      );
    }
    
    // Parse the API response
    const data = await response.json();
    
    // Extract unique channels from the results and score by relevance
    const channelsMap = new Map();
    
    if (data && data.result && Array.isArray(data.result)) {
      // First pass: collect all channel information
      data.result.forEach(video => {
        if (video.channelid && video.channelname) {
          // Calculate a simple relevance score based on the channel name matching the query
          let score = 0;
          const channelLower = video.channelname.toLowerCase();
          const queryLower = query.toLowerCase();
          
          // Exact match
          if (channelLower === queryLower) {
            score += 100;
          } 
          // Contains the exact query
          else if (channelLower.includes(queryLower)) {
            score += 50;
          } 
          // Contains parts of the query
          else {
            const queryParts = queryLower.split(/\s+/);
            queryParts.forEach(part => {
              if (part.length > 2 && channelLower.includes(part)) {
                score += 10;
              }
            });
          }
          
          // If @ symbol was used in the query, prioritize channels that have @ in their name
          if (queryLower.includes('@') && channelLower.includes('@')) {
            score += 30;
          }
          
          // Add or update channel with the highest score
          if (!channelsMap.has(video.channelid) || channelsMap.get(video.channelid).score < score) {
            channelsMap.set(video.channelid, {
              id: video.channelid,
              title: video.channelname,
              thumbnail: video.channelthumbnailurl,
              subscribers: video.channelsubcount,
              score: score
            });
          }
        }
      });
    }
    
    // Convert to array and sort by relevance score
    const channelsArray = Array.from(channelsMap.values())
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...channel }) => channel); // Remove the score from the output
    
    // Return the channels
    return NextResponse.json({
      items: channelsArray.slice(0, 10) // Return top 10 results
    });
  } catch (error) {
    console.error('Channel search error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` }, 
      { status: 500 }
    );
  }
}
