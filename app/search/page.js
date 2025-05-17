"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [searchRemaining, setSearchRemaining] = useState(5);
  const [isPremium, setIsPremium] = useState(false);

  // Your existing state variables
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

  // Fetch search count function
  const fetchSearchCount = async () => {
    try {
      const response = await fetch('/api/user/search-count');
      if (!response.ok) {
        throw new Error('Failed to fetch search count');
      }
      const data = await response.json();
      setSearchRemaining(data.remaining);
      setIsPremium(data.isPremium);
    } catch (error) {
      console.error('Error fetching search count:', error);
    }
  };

  // Auth and subscription check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      // Check user's subscription
      const checkSubscription = async () => {
        try {
          const response = await fetch('/api/user/subscription');
          const data = await response.json();
          
          setSubscription(data.subscription);
          
          // Also fetch search count
          await fetchSearchCount();
          
          setPageIsLoading(false);
        } catch (error) {
          console.error('Error checking subscription:', error);
          setPageIsLoading(false);
        }
      };
      
      checkSubscription();
    }
  }, [status, router]);

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
    
    // Check if free user has reached search limit
    if (!isPremium && searchRemaining <= 0) {
      setError('You have reached your monthly search limit. Please upgrade to continue searching.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setResults([]);
    setTotalResults(0);
    
    try {
      // First, increment search count for free users
      if (!isPremium) {
        const countResponse = await fetch('/api/user/search-count', {
          method: 'POST',
        });
        
        if (!countResponse.ok) {
          throw new Error('Failed to update search count');
        }
        
        const countData = await countResponse.json();
        setSearchRemaining(countData.remaining);
      }
      
      // Build query parameters - add quotes around search term as shown in API example
      const params = new URLSearchParams();
      params.append('query', `"${searchTerm}"`);
      params.append('lang', lang);
      
      // Add channel filter if specified
      if (searchType === 'channel' && channelId) {
        params.append('channelID', channelId);
      }
      
      // Add advanced filters if specified
      if (category) params.append('category', category);
      if (excludeCategory) params.append('excludeCategory', excludeCategory);
      if (minViews) params.append('minViews', minViews);
      if (maxViews) params.append('maxViews', maxViews);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('sortField', sortField);
      params.append('sortOrder', sortOrder);
      
      // Use the server-side API route which now uses the environment variable
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.result && Array.isArray(data.result)) {
        // For free tier, limit results to 2 videos
        if (subscription && subscription.plan === 'free') {
          setResults(data.result.slice(0, 2));
        } else {
          setResults(data.result);
        }
        setTotalResults(data.totalresultcount || data.result.length);
      } else {
        setResults([]);
        setError('No results found or unexpected API response format');
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

  // Show loading state
  if (status === 'loading' || pageIsLoading) {
    return (
      <div className="min-h-screen bg-[#0B0219] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1B7BFF]"></div>
      </div>
    );
  }

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
          {session ? (
            <div className="text-white">
              {session.user.email}
            </div>
          ) : (
            <>
              <Link href="/login">
                <button className="px-4 py-2 text-white hover:text-gray-200">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-6 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition text-white">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">Affiliate Content Search</h1>
        <p className="text-gray-300 mt-2">Find exact moments products are mentioned in videos</p>
      </div>

      {/* Subscription Status */}
      {subscription && (
        <div className="bg-[#0D0225] p-3 mb-6 rounded-lg border border-[#1B7BFF]/30">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-300">Current Plan:</span>
              <span className="ml-2 font-bold capitalize">
                {subscription.plan === 'free' ? 'Free' : 'Premium'}
              </span>
            </div>
            {subscription.plan === 'free' && (
              <Link href="/pricing">
                <button className="bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] px-4 py-2 rounded-lg text-sm">
                  Upgrade
                </button>
              </Link>
            )}
          </div>
          {subscription.plan === 'free' && (
            <div className="mt-2 text-sm text-gray-400">
              <p>Free plan: 5 searches per month, limited to 2 videos per search.</p>
              <p className="mt-1">
                Searches remaining this month: <span className="font-bold">{searchRemaining}</span>
              </p>
            </div>
          )}
        </div>
      )}
      
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full p-2 border border-gray-700 bg-[#0B0219] text-white rounded"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-700 bg-[#0B0219] text-white rounded"
                >
                  <option value="">Any Category</option>
                  <option value="Music">Music</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Sports">Sports</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Howto & Style">How-to & Style</option>
                  <option value="Science & Technology">Science & Technology</option>
                  <option value="Education">Education</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exclude Categories (comma separated)
                </label>
                <input
                  type="text"
                  value={excludeCategory}
                  onChange={(e) => setExcludeCategory(e.target.value)}
                  className="w-full p-2 border border-gray-700 bg-[#0B0219] text-white rounded"
                  placeholder="e.g. Gaming,Music"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Views
                </label>
                <input
                  type="number"
                  value={minViews}
                  onChange={(e) => setMinViews(e.target.value)}
                  className="w-full p-2 border border-gray-700 bg-[#0B0219] text-white rounded"
                  placeholder="e.g. 1000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Views
                </label>
                <input
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  className="w-full p-2 border border-gray-700 bg-[#0B0219] text-white rounded"
                  placeholder="e.g. 1000000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-700 bg-[#0B0219] text-white rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-700 bg-[#0B0219] text-white rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="w-full p-2 border border-gray-700 bg-[#0B0219] text-white rounded"
                >
                  <option value="uploaddate">Upload Date</option>
                  <option value="viewcount">View Count</option>
                  <option value="relevance">Relevance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full p-2 border border-gray-700 bg-[#0B0219] text-white rounded"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 text-red-400 rounded-lg border border-red-700">
            {error}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || (!isPremium && searchRemaining <= 0)}
            className="px-6 py-2.5 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 disabled:opacity-75"
          >
            {isLoading ? 'Searching...' : 'Search Videos'}
            {!isLoading && <span>🔍</span>}
          </button>
        </div>
        
        {!isPremium && searchRemaining <= 0 && (
          <div className="mt-4 text-center">
            <p className="text-yellow-400 mb-2">You've used all your free searches this month</p>
            <Link href="/pricing">
              <button className="px-6 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90">
                Upgrade to Premium
              </button>
            </Link>
          </div>
        )}
      </form>
      
      {/* Results Display */}
      {results.length > 0 ? (
        <div className="bg-[#0D0225] rounded-lg shadow border border-[#1B7BFF]/30">
          <h2 className="text-xl font-semibold p-4 border-b border-gray-700 text-white">
            Found {totalResults.toLocaleString()} videos with "{searchTerm}"
          </h2>
          
          {/* Free tier upgrade notice */}
          {subscription && subscription.plan === 'free' && totalResults > 2 && (
            <div className="p-4 mb-2 bg-[#0D0225] border-b border-gray-700">
              <div className="p-4 bg-[#1B7BFF]/10 rounded-lg text-center">
                <p className="text-white mb-2">
                  <span className="font-bold">Showing 2 of {totalResults} matching videos.</span>
                </p>
                <p className="text-gray-300 mb-4">Upgrade to Premium to see all matching videos and get unlimited searches.</p>
                <Link href="/pricing">
                  <button className="px-6 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90">
                    Upgrade to Premium
                  </button>
                </Link>
              </div>
            </div>
          )}
          
          <div className="divide-y divide-gray-700">
            {results.map((result, index) => (
              <div key={index} className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Video Thumbnail */}
                  <div className="w-full md:w-1/3 lg:w-1/4">
                    <div className="relative">
                      <img 
                        src={`https://i.ytimg.com/vi/${result.id}/hqdefault.jpg`}
                        alt={result.title}
                        className="w-full rounded-lg"
                      />
                      <a 
                        href={`https://www.youtube.com/watch?v=${result.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <span className="w-12 h-12 text-white opacity-80 hover:opacity-100 text-3xl">▶️</span>
                      </a>
                    </div>
                    <div className="mt-2">
                      <h3 className="font-medium text-white">{result.title}</h3>
                      <p className="text-sm text-gray-400">{result.channelname}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                        <span>{formatTimestamp(result.duration)}</span>
                        <span>•</span>
                        <span>{result.viewcount?.toLocaleString()} views</span>
                        <span>•</span>
                        <span>{result.uploaddate}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Occurrences */}
                  <div className="w-full md:w-2/3 lg:w-3/4">
                    <h4 className="font-medium mb-2 text-white">Mentions of "{searchTerm}" ({result.hits?.length || 0}):</h4>
                    <div className="space-y-3">
                      {result.hits && result.hits.length > 0 ? (
                        result.hits.map((hit, idx) => (
                          <div key={idx} className="p-3 bg-[#0B0219] rounded-lg border border-gray-700">
                            <a 
                              href={`https://www.youtube.com/watch?v=${result.id}&t=${Math.floor(hit.start)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-[#1B7BFF] hover:text-[#4461FF] font-medium mb-1"
                            >
                              <span className="bg-[#1B7BFF]/20 px-2 py-1 rounded text-sm">
                                {formatTimestamp(hit.start)}
                              </span>
                              Jump to this mention
                            </a>
                            <p className="text-gray-300">
                              {hit.ctx_before && <span className="text-gray-400">"...{hit.ctx_before} </span>}
                              <span className="font-medium text-white">{hit.token}</span>
                              {hit.ctx_after && <span className="text-gray-400"> {hit.ctx_after}..."</span>}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-[#0B0219] rounded-lg border border-gray-700">
                          <p className="text-gray-300">No specific timestamp information available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        isLoading ? (
          <div className="bg-[#0D0225] p-8 rounded-lg shadow border border-[#1B7BFF]/30 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 mb-4 bg-[#1B7BFF]/20 rounded-full"></div>
              <div className="h-4 bg-[#1B7BFF]/10 rounded w-3/4 mb-2.5"></div>
              <div className="h-4 bg-[#1B7BFF]/10 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          searchTerm && !error && (
            <div className="bg-[#0D0225] p-8 rounded-lg shadow border border-[#1B7BFF]/30 text-center">
              <p className="text-gray-300">No results found. Try different search terms.</p>
            </div>
          )
        )
      )}
    </div>
  );
                          }
