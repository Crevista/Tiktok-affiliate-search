"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchLimitWarning from '../components/SearchLimitWarning';
import UpgradePrompt from '../components/UpgradePrompt';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Initialize as false
  
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

  // Debug logs
  useEffect(() => {
    console.log("URL success parameter:", success);
    console.log("Show success message state:", showSuccessMessage);
    
    // Set success message if URL parameter exists
    if (success === 'true') {
      setShowSuccessMessage(true);
    }
  }, [success]);

  // Session debug logs
  useEffect(() => {
    console.log("Session status:", status);
    console.log("Session data:", session);
  }, [status, session]);

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
              <Link href="/pricing" className="px-6 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition text-white">
                Upgrade
              </Link>
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
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-[#0D0225] rounded-lg shadow p-6 mb-8 border border-[#1B7BFF]/30">
        {/* Rest of your form code remains the same */}
        {/* ... */}
      </form>
      
      {/* Results Display */}
      {/* ... */}
      
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          limitType={upgradePromptType}
          searchesRemaining={searchesRemaining}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </div>
  );
}
