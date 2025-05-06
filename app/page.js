"use client";

import { useState } from 'react';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [channelId, setChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  
  // Additional filter states
  const [category, setCategory] = useState('');
  const [excludeCategory, setExcludeCategory] = useState('');
  const [minViews, setMinViews] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState({ start: '', end: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!apiKey) {
      setError('Please enter your RapidAPI key');
      return;
    }
    
    if (!searchTerm) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('query', searchTerm);
      
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
      if (duration.start) params.append('startDuration', duration.start);
      if (duration.end) params.append('endDuration', duration.end);
      
      // Create a server-side API route to hide our API key
      // This is more secure than including it in frontend code
      const response = await fetch(`/api/search?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        setResults(data);
      } else if (data && Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        setResults([]);
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
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-indigo-800">Affiliate Content Search</h1>
        <p className="text-gray-600 mt-2">Find exact moments products are mentioned in videos</p>
      </div>
      
      {/* API Key Input */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your RapidAPI Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter your RapidAPI key for Filmot"
        />
        <p className="text-xs text-gray-500 mt-2">
          Your API key is stored locally in your browser and only sent securely to our server
        </p>
      </div>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Term
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter product, keyword or phrase"
              />
              <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
            </div>
          </div>
          
          <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Type
            </label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Videos</option>
              <option value="channel">Specific Channel</option>
            </select>
          </div>
          
          {searchType === 'channel' && (
            <div className="w-full md:w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel ID
              </label>
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="YouTube Channel ID"
              />
            </div>
          )}
        </div>
        
        {/* Advanced Filters Toggle */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
          >
            {showAdvancedFilters ? '- Hide' : '+ Show'} Advanced Filters
          </button>
        </div>
        
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">Any Category</option>
                  <option value="Music">Music</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Sports">Sports</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Howto & Style">How-to & Style</option>
                  <option value="Science & Technology">Science & Technology</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exclude Categories (comma separated)
                </label>
                <input
                  type="text"
                  value={excludeCategory}
                  onChange={(e) => setExcludeCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g. Gaming,Music"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Views
                </label>
                <input
                  type="number"
                  value={minViews}
                  onChange={(e) => setMinViews(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g. 1000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Views
                </label>
                <input
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g. 1000000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Duration (seconds)
                </label>
                <input
                  type="number"
                  value={duration.start}
                  onChange={(e) => setDuration({...duration, start: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g. 60"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Duration (seconds)
                </label>
                <input
                  type="number"
                  value={duration.end}
                  onChange={(e) => setDuration({...duration, end: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g. 3600"
                />
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 flex items-center gap-2 disabled:opacity-75"
          >
            {isLoading ? 'Searching...' : 'Search Videos'}
            {!isLoading && <span>🔍</span>}
          </button>
        </div>
      </form>
      
      {/* Results Display */}
      {results.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold p-4 border-b">Search Results</h2>
          <div className="divide-y">
            {results.map((result, index) => (
              <div key={index} className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Video Thumbnail */}
                  <div className="w-full md:w-1/3 lg:w-1/4">
                    <div className="relative">
                      <img 
                        src={result.thumbnail || `https://i.ytimg.com/vi/${result.videoId}/hqdefault.jpg`} 
                        alt={result.title}
                        className="w-full rounded-lg"
                      />
                      <a 
                        href={`https://www.youtube.com/watch?v=${result.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <span className="w-12 h-12 text-white opacity-80 hover:opacity-100 text-3xl">▶️</span>
                      </a>
                    </div>
                    <div className="mt-2">
                      <h3 className="font-medium">{result.title}</h3>
                      <p className="text-sm text-gray-600">{result.channel}</p>
                    </div>
                  </div>
                  
                  {/* Occurrences */}
                  <div className="w-full md:w-2/3 lg:w-3/4">
                    <h4 className="font-medium mb-2">Mentions of "{searchTerm}":</h4>
                    <div className="space-y-3">
                      {result.occurrences && result.occurrences.map((occurrence, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <a 
                            href={`https://www.youtube.com/watch?v=${result.videoId}&t=${occurrence.timestamp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mb-1"
                          >
                            <span className="bg-indigo-100 px-2 py-1 rounded text-sm">
                              {formatTimestamp(occurrence.timestamp)}
                            </span>
                            Jump to this mention
                          </a>
                          <p className="text-gray-700">
                            "{occurrence.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        isLoading ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 mb-4 bg-indigo-200 rounded-full"></div>
              <div className="h-4 bg-indigo-100 rounded w-3/4 mb-2.5"></div>
              <div className="h-4 bg-indigo-100 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          searchTerm && !error && (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600">No results found. Try different search terms or check your API key.</p>
            </div>
          )
        )
      )}
    </div>
  );
        }
