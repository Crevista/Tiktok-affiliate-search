import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
    }
    
    // Use YouTube API key from environment variables
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'YouTube API key is not configured' }, { status: 500 });
    }
    
    // Call the YouTube API to search for channels
    const youtubeApiUrl = 
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`;
    
    const response = await fetch(youtubeApiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `YouTube API request failed: ${response.status} - ${errorText}` }, 
        { status: response.status }
      );
    }
    
    // Parse the YouTube API response
    const data = await response.json();
    
    // Transform the YouTube API response to our format
    const channels = [];
    
    if (data && data.items && Array.isArray(data.items)) {
      data.items.forEach(item => {
        if (item.id && item.id.channelId) {
          channels.push({
            id: item.id.channelId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url,
            description: item.snippet.description
          });
        }
      });
    }
    
    // Return the channels
    return NextResponse.json({
      items: channels
    });
  } catch (error) {
    console.error('Channel search error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` }, 
      { status: 500 }
    );
  }
}
