"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SearchLimitWarning() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/subscription');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription info');
        }
        
        const data = await response.json();
        setSubscription(data.subscription);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, []);

  // Don't show anything while loading
  if (loading) {
    return null;
  }

  // Don't show anything for premium users
  if (subscription?.plan === 'premium' && subscription?.status === 'active') {
    return null;
  }

  const searchCount = subscription?.searchCount || 0;
  const searchesRemaining = Math.max(0, 5 - searchCount);
  const isLimitReached = searchesRemaining <= 0;

  return (
    <div className={`mb-8 p-4 rounded-lg border ${isLimitReached ? 'bg-red-900/20 border-red-700' : 'bg-[#1B7BFF]/10 border-[#1B7BFF]/30'}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 p-1 rounded ${isLimitReached ? 'bg-red-700/30' : 'bg-[#1B7BFF]/20'}`}>
          {isLimitReached ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#1B7BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        
        <div className="flex-grow">
          {isLimitReached ? (
            <>
              <h3 className="font-medium text-red-400">Search Limit Reached</h3>
              <p className="text-gray-300 mt-1 text-sm">
                You've used all 5 searches in your free plan this month.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-medium text-[#1B7BFF]">Free Plan</h3>
              <p className="text-gray-300 mt-1 text-sm">
                You have <span className="font-medium">{searchesRemaining} searches</span> remaining this month. Free accounts are limited to 5 searches per month and 2 results per search.
              </p>
            </>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <Link 
            href="/pricing" 
            className={`px-4 py-1.5 rounded text-sm font-medium ${isLimitReached ? 'bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white' : 'text-[#1B7BFF] border border-[#1B7BFF] hover:bg-[#1B7BFF]/10'}`}
          >
            {isLimitReached ? 'Upgrade Now' : 'Upgrade Plan'}
          </Link>
        </div>
      </div>
    </div>
  );
}
