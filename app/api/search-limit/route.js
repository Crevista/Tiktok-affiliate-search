'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SearchLimitWarning() {
  const { data: session, status } = useSession();
  const [searchesRemaining, setSearchesRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    const fetchSearchCount = async () => {
      if (status === 'authenticated' && session) {
        try {
          const response = await fetch('/api/subscription');
          if (response.ok) {
            const data = await response.json();
            setSubscriptionStatus(data.subscription);
            
            // If user has premium subscription, no limits
            if (data.subscription?.plan === 'premium' && data.subscription?.status === 'active') {
              setSearchesRemaining(null);
              setLoading(false);
              return;
            }
            
            // For free users, calculate searches remaining
            const searchCount = data.subscription?.searchCount || 0;
            const maxSearches = 5; // Free tier limit
            const remaining = Math.max(0, maxSearches - searchCount);
            setSearchesRemaining(remaining);
          } else {
            console.error('Failed to fetch subscription status');
          }
        } catch (error) {
          console.error('Error fetching search count:', error);
        }
      }
      setLoading(false);
    };

    fetchSearchCount();
  }, [status, session]);

  // Don't show anything if loading or if user has premium
  if (loading || status !== 'authenticated' || !session) {
    return null;
  }

  // Don't show for premium users
  if (subscriptionStatus?.plan === 'premium' && subscriptionStatus?.status === 'active') {
    return null;
  }

  // Show warning if searches remaining is low
  if (searchesRemaining !== null && searchesRemaining <= 2) {
    return (
      <div className={`mb-6 p-4 rounded-lg border ${
        searchesRemaining === 0 
          ? 'bg-red-900/20 text-red-400 border-red-700' 
          : 'bg-yellow-900/20 text-yellow-400 border-yellow-700'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg 
              className={`w-5 h-5 mr-2 ${searchesRemaining === 0 ? 'text-red-500' : 'text-yellow-500'}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            <div>
              {searchesRemaining === 0 ? (
                <>
                  <p className="font-medium">Search limit reached</p>
                  <p className="text-sm">You've used all 5 monthly searches. Upgrade to continue.</p>
                </>
              ) : (
                <>
                  <p className="font-medium">
                    {searchesRemaining} search{searchesRemaining !== 1 ? 'es' : ''} remaining
                  </p>
                  <p className="text-sm">
                    You have {searchesRemaining} out of 5 monthly searches left.
                  </p>
                </>
              )}
            </div>
          </div>
          <Link 
            href="/pricing" 
            className="px-4 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition text-sm font-medium"
          >
            Upgrade
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
