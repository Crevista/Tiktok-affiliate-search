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
    
    // This is a temporary implementation - in production you'd want to use a proper YouTube API
    // For now, we'll use the same Filmot API by searching for channel names
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'filmot-tube-metadata-archive.p.rapidapi.com'
      }
    };
    
    // Search with a small result size to just get channel info
    const apiUrl = `https://filmot-tube-metadata-archive.p.rapidapi.com/getsearchsubtitles?query=${encodeURIComponent(query)}&limit=5`;
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
    
    // Extract unique channels from the results
    const channels = new Map();
    if (data && data.result && Array.isArray(data.result)) {
      data.result.forEach(video => {
        if (video.channelid && !channels.has(video.channelid)) {
          channels.set(video.channelid, {
            id: video.channelid,
            title: video.channelname,
            thumbnail: video.channelthumbnailurl,
            subscribers: video.channelsubcount
          });
        }
      });
    }
    
    // Return the channels
    return NextResponse.json({
      items: Array.from(channels.values())
    });
  } catch (error) {
    console.error('Channel search error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` }, 
      { status: 500 }
    );
  }
}
