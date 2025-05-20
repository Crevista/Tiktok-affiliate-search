'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getStripe } from '@/lib/stripe';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  
  const canceled = searchParams.get('canceled');
  
  async function handleCheckout() {
    // If not logged in, redirect to login page
    if (!session) {
      router.push('/login?callbackUrl=/pricing');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Error:', data.error);
        alert('Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-[#0B0219] text-white">
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center p-6">
        <Link href="/" className="flex items-center">
          <div className="w-10 h-10 mr-2 rounded-full bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] flex items-center justify-center">
            <span className="text-xl font-bold text-white">CT</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-transparent bg-clip-text">
            The Content Tool
          </span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <Link href="/search" className="text-gray-300 hover:text-white transition">
                Search
              </Link>
              <Link href="/account" className="text-gray-300 hover:text-white transition">
                Account
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white transition">
                Log In
              </Link>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
        <p className="text-gray-400 text-center mb-10">Get unlimited access to powerful TikTok content search tools</p>
        
        {canceled && (
          <div className="bg-red-900/20 border-l-4 border-red-500 text-red-400 p-4 mb-8 rounded" role="alert">
            <p>Payment canceled. You have not been charged.</p>
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="border border-gray-800 rounded-lg p-8 bg-[#0D0225] shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Basic</h2>
            <p className="text-3xl font-bold mb-6">Free</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-[#1B7BFF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>5 searches per month</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-[#1B7BFF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Basic results</span>
              </li>
              <li className="flex items-center text-gray-500">
                <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>No priority support</span>
              </li>
            </ul>
            <button 
              className="w-full p-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition"
              onClick={() => router.push('/search')}
            >
              Current Plan
            </button>
          </div>
          
          {/* Premium Plan */}
          <div className="border border-[#1B7BFF]/30 rounded-lg p-8 bg-gradient-to-br from-[#0D0225] to-[#130D35] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-xs font-bold uppercase px-4 py-1 transform rotate-0 translate-x-2 -translate-y-0">
                Recommended
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Premium</h2>
            <p className="text-3xl font-bold mb-1">£14.99</p>
            <p className="text-gray-400 mb-6">per month</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-[#1B7BFF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Unlimited</strong> searches</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-[#1B7BFF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Enhanced results</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-[#1B7BFF] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Priority support</span>
              </li>
            </ul>
            <button 
              className={`w-full p-3 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Upgrade Now'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto mt-6 p-4 text-center text-xs text-gray-500">
        <p>All plans include secure payment processing through Stripe.</p>
        <p>Cancel anytime. No hidden fees. No commitment required.</p>
      </div>
    </div>
  );
}
