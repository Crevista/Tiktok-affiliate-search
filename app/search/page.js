"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SearchPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setResults([]);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchTerm,
          lang: 'en'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Handle different response formats
      if (data.results && Array.isArray(data.results)) {
        setResults(data.results);
      } else if (data.result && Array.isArray(data.result)) {
        setResults(data.result);
      } else {
        setResults([]);
        setError('No results found');
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setError(`Search failed: ${error.message}`);
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
          {session ? (
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

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">Affiliate Content Search</h1>
        <p className="text-gray-300 mt-2">Find exact moments products are mentioned in videos</p>
      </div>
      
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
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 text-red-400 rounded-lg border border-red-700">
            {error}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 disabled:opacity-75"
          >
            {isLoading ? 'Searching...' : 'Search Videos'}
            {!isLoading && <span>🔍</span>}
          </button>
        </div>
      </form>
      
      {/* Results Display */}
      {results.length > 0 ? (
        <div className="bg-[#0D0225] rounded-lg shadow border border-[#1B7BFF]/30">
          <h2 className="text-xl font-semibold p-4 border-b border-gray-700 text-white">
            Found {results.length} videos with "{searchTerm}"
          </h2>
          <div className="divide-y divide-gray-700">
            {results.map((result, index) => (
              <div key={index} className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
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
