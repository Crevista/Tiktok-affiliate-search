// hooks/useSubscriberCounts.js
import { useState, useEffect } from 'react';

export function useSubscriberCounts(results) {
  const [subscriberCounts, setSubscriberCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset state when results change
    setSubscriberCounts({});
    setError(null);
    
    if (!results || results.length === 0) {
      setLoading(false);
      return;
    }

    const fetchSubscriberCounts = async () => {
      setLoading(true);
      
      try {
        // Get unique channel names from results
        const uniqueChannels = [...new Set(
          results
            .map(result => result.channelname)
            .filter(channelName => channelName && channelName.trim())
        )];
        
        if (uniqueChannels.length === 0) {
          setLoading(false);
          return;
        }
        
        console.log('Fetching subscriber counts for channels:', uniqueChannels);
        
        // Fetch subscriber counts for each unique channel
        const counts = {};
        
        // Use Promise.allSettled to handle some failures gracefully
        const promises = uniqueChannels.map(async (channelName) => {
          try {
            const response = await fetch(`/api/youtube/subscriber-count?channelName=${encodeURIComponent(channelName)}`);
            
            if (response.ok) {
              const data = await response.json();
              counts[channelName] = {
                formattedCount: data.formattedCount,
                subscriberCount: data.subscriberCount,
                channelId: data.channelId
              };
              console.log(`✓ Got subscriber count for ${channelName}: ${data.formattedCount}`);
            } else {
              console.warn(`Failed to get subscriber count for ${channelName}: ${response.status}`);
            }
          } catch (error) {
            console.error(`Error fetching subscriber count for ${channelName}:`, error);
          }
        });
        
        await Promise.allSettled(promises);
        
        setSubscriberCounts(counts);
        console.log('Final subscriber counts:', counts);
        
      } catch (error) {
        console.error('Error in fetchSubscriberCounts:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to let search results render first
    const timeoutId = setTimeout(fetchSubscriberCounts, 500);
    
    return () => clearTimeout(timeoutId);
  }, [results]);

  return { 
    subscriberCounts, 
    loading, 
    error,
    // Helper function to get formatted count for a channel
    getFormattedCount: (channelName) => subscriberCounts[channelName]?.formattedCount || '',
    // Helper function to check if a channel has subscriber data
    hasSubscriberData: (channelName) => !!subscriberCounts[channelName]
  };
}
