// pages/api/youtube/subscriber-count/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const channelName = searchParams.get('channelName');
    
    if (!channelName) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
    }
    
    // Use YouTube API key from environment variables
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'YouTube API key is not configured' }, { status: 500 });
    }
    
    // Step 1: Search for the channel by exact name to get channel ID
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelName)}&maxResults=1&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      return NextResponse.json(
        { error: `YouTube search API request failed: ${searchResponse.status} - ${errorText}` }, 
        { status: searchResponse.status }
      );
    }
    
    const searchData = await searchResponse.json();
    
    // Check if we found the channel
    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ 
        error: 'Channel not found',
        subscriberCount: 0,
        formattedCount: ''
      }, { status: 404 });
    }
    
    const channelId = searchData.items[0].id.channelId;
    
    // Step 2: Get channel statistics (including subscriber count)
    const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
    
    const statsResponse = await fetch(statsUrl);
    
    if (!statsResponse.ok) {
      const errorText = await statsResponse.text();
      return NextResponse.json(
        { error: `YouTube stats API request failed: ${statsResponse.status} - ${errorText}` }, 
        { status: statsResponse.status }
      );
    }
    
    const statsData = await statsResponse.json();
    
    // Check if we got statistics
    if (!statsData.items || statsData.items.length === 0) {
      return NextResponse.json({ 
        error: 'Channel statistics not found',
        subscriberCount: 0,
        formattedCount: ''
      }, { status: 404 });
    }
    
    const statistics = statsData.items[0].statistics;
    const subscriberCount = parseInt(statistics.subscriberCount) || 0;
    
    // Return both raw count and formatted version
    return NextResponse.json({
      channelName,
      channelId,
      subscriberCount,
      formattedCount: formatSubscriberCount(subscriberCount),
      viewCount: parseInt(statistics.viewCount) || 0,
      videoCount: parseInt(statistics.videoCount) || 0
    });
    
  } catch (error) {
    console.error('Subscriber count API error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` }, 
      { status: 500 }
    );
  }
}

// Helper function to format subscriber count like "150K subs"
function formatSubscriberCount(count) {
  if (!count || count === 0) {
    return '';
  }
  
  if (count >= 1000000) {
    const millions = (count / 1000000).toFixed(1);
    // Remove .0 if it's a whole number
    const formatted = millions.endsWith('.0') ? millions.slice(0, -2) : millions;
    return `${formatted}M subs`;
  } else if (count >= 1000) {
    const thousands = Math.round(count / 1000);
    return `${thousands}K subs`;
  } else {
    return `${count} subs`;
  }
}
