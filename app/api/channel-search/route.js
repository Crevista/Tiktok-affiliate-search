export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

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
    
    // Transform the YouTube API response to our format and get subscriber counts
    const channels = [];
    
    if (data && data.items && Array.isArray(data.items)) {
      // Get all channel IDs first
      const channelIds = data.items
        .filter(item => item.id && item.id.channelId)
        .map(item => item.id.channelId);
      
      // Fetch subscriber counts for all channels in one API call
      let subscriberData = {};
      if (channelIds.length > 0) {
        try {
          const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds.join(',')}&key=${apiKey}`;
          const statsResponse = await fetch(statsUrl);
          
          if (statsResponse.ok) {
            const statsResult = await statsResponse.json();
            
            // Create a map of channelId -> subscriber count
            if (statsResult.items) {
              statsResult.items.forEach(channel => {
                const subscriberCount = parseInt(channel.statistics.subscriberCount) || 0;
                subscriberData[channel.id] = {
                  subscriberCount,
                  formattedCount: formatSubscriberCount(subscriberCount)
                };
              });
            }
          }
        } catch (error) {
          console.error('Error fetching subscriber counts:', error);
          // Continue without subscriber counts if this fails
        }
      }
      
      // Build the final channel list with subscriber counts
      data.items.forEach(item => {
        if (item.id && item.id.channelId) {
          const channelId = item.id.channelId;
          const subscriberInfo = subscriberData[channelId] || { formattedCount: '' };
          
          channels.push({
            id: channelId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url,
            description: item.snippet.description,
            subscriberCount: subscriberInfo.subscriberCount || 0,
            subscriberDisplay: subscriberInfo.formattedCount
          });
        }
      });
    }
    
    // Return the channels with subscriber counts
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
