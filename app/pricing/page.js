// app/pricing/page.jsx
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function PricingPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!session) {
      // Redirect to login if not logged in
      window.location.href = '/login?redirect=pricing';
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      setError(`Failed to start checkout: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-[#0B0219] min-h-screen">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 mb-8">
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
              <Link href="/search" className="px-6 py-2 text-white border border-white/20 rounded-lg hover:bg-white/5">
                Search
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

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-300">Choose the plan that works for you</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="bg-[#0D0225] rounded-lg p-8 border border-gray-800 flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-4">Free Plan</h2>
          <div className="text-4xl font-bold text-white mb-6">£0 <span className="text-lg font-normal text-gray-400">/month</span></div>
          
          <ul className="space-y-3 mb-8 flex-grow">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-gray-300">5 searches per month</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-gray-300">2 video results per search</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-gray-300">Basic timestamp access</span>
            </li>
          </ul>
          
          <Link 
            href={session ? "/search" : "/signup"}
            className="w-full py-3 text-center border border-[#1B7BFF] text-[#1B7BFF] rounded-lg hover:bg-[#1B7BFF]/10 transition"
          >
            {session ? "Start Searching" : "Sign Up Free"}
          </Link>
        </div>
        
        {/* Premium Plan */}
        <div className="bg-gradient-to-b from-[#0D0225] to-[#0D0225] rounded-lg p-8 border border-[#1B7BFF] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#1B7BFF] text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
            RECOMMENDED
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Premium Plan</h2>
          <div className="text-4xl font-bold text-white mb-6">£14.99 <span className="text-lg font-normal text-gray-400">/month</span></div>
          
          <ul className="space-y-3 mb-8 flex-grow">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-white">Unlimited searches</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-white">Full video results</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-white">Advanced filtering options</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-white">Priority support</span>
            </li>
          </ul>
          
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full py-3 text-center bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition disabled:opacity-70"
          >
            {isLoading ? 'Processing...' : 'Upgrade Now'}
          </button>
          
          {error && (
            <p className="mt-3 text-sm text-red-500">{error}</p>
          )}
          
          <p className="mt-3 text-xs text-center text-gray-400">
            Secure payment with Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
