"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function UpgradePrompt({ 
  limitType,  // 'search' (monthly limit) or 'results' (too many results)
  onClose,    // callback when modal is closed
  searchesRemaining = 0
}) {
  const [isVisible, setIsVisible] = useState(true);
  
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };
  
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {limitType === 'search' ? 'Monthly Search Limit Reached' : 'Free Plan Result Limit'}
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="my-4">
            {limitType === 'search' ? (
              <p className="text-gray-500">
                You've used all of your 5 free searches for this month. Upgrade to our Premium plan for unlimited searches.
              </p>
            ) : (
              <p className="text-gray-500">
                Free accounts are limited to 2 video results per search. We found more results, but you'll need to upgrade to see them all.
              </p>
            )}
            
            {searchesRemaining > 0 && limitType === 'results' && (
              <p className="mt-2 text-gray-500">
                You have <span className="font-medium">{searchesRemaining}</span> searches remaining this month.
              </p>
            )}
          </div>
          
          <div className="mt-8 bg-gray-50 -m-6 p-6 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-medium">Premium Plan</p>
                <p className="text-sm text-gray-500">£14.99/month</p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                onClick={handleClose}
              >
                Upgrade Now
              </Link>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900">Premium Features:</h4>
              <ul className="mt-2 space-y-2 text-sm text-gray-500">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Unlimited searches
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  See all search results
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Priority support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
