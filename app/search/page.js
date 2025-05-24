"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchLimitWarning from '../components/SearchLimitWarning';
import UpgradePrompt from '../components/UpgradePrompt';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [channelId, setChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  
  // Channel search state
  const [channelName, setChannelName] = useState('');
  const [isSearchingChannel, setIsSearchingChannel] = useState(false);
  const [channelResults, setChannelResults] = useState([]);
  
  // Additional filter states
  const [lang, setLang] = useState('en');
  const [category, setCategory] = useState('');
  const [excludeCategory, setExcludeCategory] = useState('');
  const [minViews, setMinViews] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState('uploaddate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Upgrade prompt state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptType, setUpgradePromptType] = useState(null);
  const [searchesRemaining, setSearchesRemaining] = useState(0);

  // State for subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // Fetch subscription status when session is available
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (status === 'authenticated' && session) {
        try {
          const response = await fetch('/api/subscription');
          if (response.ok) {
            const data = await response.json();
            setSubscriptionStatus(data.subscription);
          } else {
            console.error('Failed to fetch subscription status');
            setSubscriptionStatus(null);
          }
        } catch (error) {
          console.error('Error fetching subscription status:', error);
          setSubscriptionStatus(null);
        }
      }
    };

    fetchSubscriptionStatus();
  }, [status, session]);

  // Set success message if URL parameter exists
  useEffect(() => {
    console.log("URL success parameter:", success);
    console.log("Show success message state:", showSuccessMessage);
    
    if (success === 'true') {
      setShowSuccessMessage(true);
    }
  }, [success]);

  // Force session refresh after successful subscription
  useEffect(() => {
    const refreshSession = async () => {
      if (success === 'true') {
        console.log("Refreshing session after successful subscription");
        
        // Force NextAuth to refresh the session
        await getSession();
        
        // Wait a bit longer for the session to update, then reload
        setTimeout(() => {
          console.log("Reloading page to ensure session is updated");
          window.location.reload();
        }, 2000);
      }
    };
    
    refreshSession();
  }, [success]);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to login page with a redirect parameter back to the search page
      router.push('/login?redirect=search');
    }
  }, [status, router]);

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-[#0B0219] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#1B7BFF] border-t-transparent rounded-full inline-block mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Function to lookup channels by name
  const searchChannelsByName = async (name) => {
    if (!name) return;
    
    setIsSearchingChannel(true);
    
    try {
      const response = await fetch(`/api/channel-search?q=${encodeURIComponent(name)}`);
      const data = await response.json();
      
      if (data && data.items && Array.isArray(data.items)) {
        setChannelResults(data.items);
      } else {
        setChannelResults([]);
      }
    } catch (error) {
      console.error('Error searching channels:', error);
      setChannelResults([]);
    } finally {
      setIsSearchingChannel(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setResults([]);
    setTotalResults(0);
    
    try {
      // Build search parameters
      const searchParams = {
        query: searchTerm,
        lang: lang
      };
      
      // Add channel filter if specified
      if (searchType === 'channel' && channelId) {
        searchParams.channelID = channelId;
      }
      
      // Add advanced filters if specified
      if (category) searchParams.category = category;
      if (excludeCategory) searchParams.excludeCategory = excludeCategory;
      if (minViews) searchParams.minViews = minViews;
      if (maxViews) searchParams.maxViews = maxViews;
      if (startDate) searchParams.startDate = startDate;
      if (endDate) searchParams.endDate = endDate;
      searchParams.sortField = sortField;
      searchParams.sortOrder = sortOrder;
      
      console.log('Sending search request:', searchParams);
      
      // Use POST with JSON body
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });
      
      console.log('Search response status:', response.status);
      
      // Get the raw text first for better error handling
      const rawText = await response.text();
      
      // If the response is empty, throw an error
      if (!rawText.trim()) {
        throw new Error('Empty response received from server');
      }
      
      // Parse the JSON manually
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        console.error('Raw response:', rawText);
        throw new Error(`Failed to parse server response: ${parseError.message}`);
      }
      
      // Check for error in the data
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Check if user has reached their search limit
      if (data.requiresUpgrade) {
        setError('You have reached your monthly search limit. Please upgrade to continue searching.');
        setUpgradePromptType('search');
        setShowUpgradePrompt(true);
        setIsLoading(false);
        return;
      }
      
      // Update searches remaining if available
      if (data.searchesRemaining !== undefined) {
        setSearchesRemaining(data.searchesRemaining);
      }
      
      // Process search results
      if (data && data.results && Array.isArray(data.results)) {
        setResults(data.results);
        setTotalResults(data.results.length);
      } else if (data && data.result && Array.isArray(data.result)) {
        // Backwards compatibility with original API format
        setResults(data.result);
        setTotalResults(data.totalresultcount || data.result.length);
      } else {
        setResults([]);
        setError('No results found or unexpected API response format');
      }
      
      // Check if free account has limited results
      if (data.freeAccountLimited) {
        setUpgradePromptType('results');
        setShowUpgradePrompt(true);
      }
      
    } catch (error) {
      console.error('Error fetching search results:', error);
      setError(`Failed to fetch results: ${error.message}`);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-[#0B0219] min-h-screen">
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center p-6 mb-4">
        <Link href="/" className="flex items-center">
          <div className="w-10 h-10 mr-2 rounded-full bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] flex items-center justify-center">
            <span className="text-xl font-bold text-white">CT</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-transparent bg-clip-text">
            The Content Tool
          </span>
        </Link>
        <div className="flex gap-4">
          {status === 'authenticated' && session ? (
            <>
              <Link href="/account" className="px-4 py-2 text-white hover:text-gray-200">
                Account
              </Link>
              {subscriptionStatus && subscriptionStatus.plan === 'premium' && subscriptionStatus.status === 'active' ? (
                <Link href="/account" className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                  Manage
                </Link>
              ) : (
                <Link href="/pricing" className="px-6 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition text-white">
                  Upgrade
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-white hover:text-gray-200">
                Login
              </Link>
              <Link href="/signup" className="px-6 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition text-white">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-8 p-4 bg-green-900/20 text-green-400 rounded-lg border border-green-700 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Subscription activated successfully!</p>
              <p className="text-sm">You now have full access to all premium features.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSuccessMessage(false)} 
            className="text-green-400 hover:text-green-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">Affiliate Content Search</h1>
        <p className="text-gray-300 mt-2">Find exact moments products are mentioned in videos</p>
      </div>
      
      {/* Search Limit Warning Component */}
      {session && <SearchLimitWarning />}
      
      {/* Upgrade Prompt Modal */}
      <UpgradePrompt 
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        type={upgradePromptType}
        searchesRemaining={searchesRemaining}
      />
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-[#0D0225] rounded-lg shadow p-6 mb-8 border border-[#1B7BFF]/30">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Term
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-700 bg-[#0B0219] text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter product, keyword or phrase"
              />
              <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
            </div>
          </div>
          
          <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Type
            </label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full p-3 border border-gray-700 bg-[#0B0219] text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Videos</option>
              <option value="channel">Specific Channel</option>
            </select>
          </div>
          
          {searchType === 'channel' && (
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Channel Selection
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      className="w-full p-3 border border-gray-700 bg-[#0B0219] text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Search by channel name..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => searchChannelsByName(channelName)}
                    disabled={isSearchingChannel || !channelName}
                    className="px-4 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
                  >
                    {isSearchingChannel ? 'Searching...' : 'Find Channel'}
                  </button>
                </div>
                
                {channelResults.length > 0 && (
                  <div className="border border-gray-700 rounded-lg max-h-60 overflow-y-auto bg-[#0B0219]">
                    <ul className="divide-y divide-gray-700">
                      {channelResults.map((channel) => (
                        <li 
                          key={channel.id} 
                          className="p-2 hover:bg-[#1B7BFF]/10 cursor-pointer flex items-center gap-2"
                          onClick={() => {
                            setChannelId(channel.id);
                            setChannelName(channel.title);
                            setChannelResults([]);
                          }}
                        >
                          {channel.thumbnail && (
                            <img 
                              src={channel.thumbnail} 
                              alt={channel.title} 
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium text-sm text-white">{channel.title}</p>
                            <p className="text-xs text-gray-400">{channel.id}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="border border-gray-700 rounded-lg p-3 bg-[#0D0225]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Selected Channel ID
                  </label>
                  <input
                    type="text"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    className="w-full p-2 border border-gray-700 bg-[#0B0219] text-white rounded focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. UC3w193M5tYPJqF0Hi-7U-2g"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Channel ID will be used to search for videos on this specific channel
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Advanced Filters Toggle */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-[#1B7BFF] hover:text-[#4461FF] text-sm flex items-center"
          >
            {showAdvancedFilters ? '- Hide' : '+ Show'} Advanced Filters
          </button>
        </div>
        
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 p-4 bg-[#0B0219] rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
