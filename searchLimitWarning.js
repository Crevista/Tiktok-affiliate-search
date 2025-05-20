'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SearchLimitWarning() {
  const { data: session } = useSession();
  const [searchLimit, setSearchLimit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchSearchLimit();
    } else {
      setLoading(false);
    }
  }, [session]);

  async function fetchSearchLimit() {
    try {
      setLoading(true);
      const response = await fetch('/api/search-limit');
      
      if (!response.ok) {
        throw new Error('Failed to fetch search limit');
      }
      
      const data = await response.json();
      setSearchLimit(data);
    } catch (error) {
      console.error('Error fetching search limit:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !session || !searchLimit) {
    return null;
  }

  // If on premium plan with active status, don't show anything
  if (searchLimit.unlimited) {
    return null;
  }

  // If searches remaining is 0, show a warning
  if (searchLimit.searchesRemaining === 0) {
    return (
      <div className="p-4 mb-6 bg-red-900/20 border border-red-500 text-white rounded-lg">
        <p className="font-medium mb-2">You have reached your monthly search limit</p>
        <p className="text-gray-300 text-sm mb-3">
          Upgrade to our Premium plan for unlimited searches.
        </p>
        <Link
          href="/pricing"
          className="inline-block px-4 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition text-sm"
        >
          Upgrade Now
        </Link>
      </div>
    );
  }

  // If searches remaining is low (1-2), show a warning
  if (searchLimit.searchesRemaining <= 2) {
    return (
      <div className="p-4 mb-6 bg-yellow-900/20 border border-yellow-500 text-white rounded-lg">
        <p className="font-medium mb-1">
          You have {searchLimit.searchesRemaining} {searchLimit.searchesRemaining === 1 ? 'search' : 'searches'} remaining this month
        </p>
        <p className="text-gray-300 text-sm mb-3">
          Consider upgrading to Premium for unlimited searches.
        </p>
        <Link
          href="/pricing"
          className="inline-block px-4 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition text-sm"
        >
          View Plans
        </Link>
      </div>
    );
  }

  // If more than 2 searches remaining, show a simpler message
  return (
    <div className="p-4 mb-6 bg-[#0D0225] border border-gray-700 text-white rounded-lg">
      <p className="text-sm">
        <span className="text-gray-300">Free searches remaining this month: </span>
        <span className="font-medium">{searchLimit.searchesRemaining}</span>
        <Link
          href="/pricing"
          className="ml-3 text-[#1B7BFF] hover:text-[#4461FF] transition"
        >
          Upgrade for unlimited
        </Link>
      </p>
    </div>
  );
}
