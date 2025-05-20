'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getStripe } from '@/lib/stripe';
import { useSession } from 'next-auth/react';

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
    <div className="max-w-5xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-center mb-10">Choose Your Plan</h1>
      
      {canceled && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8" role="alert">
          <p>Payment canceled. You have not been charged.</p>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free Plan */}
        <div className="border rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Basic</h2>
          <p className="text-3xl font-bold mb-6">Free</p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>5 searches per month</span>
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Basic results</span>
            </li>
            <li className="flex items-center text-gray-500">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span>No priority support</span>
            </li>
          </ul>
          <button 
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded transition duration-150 ease-in-out"
            onClick={() => router.push('/search')}
          >
            Current Plan
          </button>
        </div>
        
        {/* Premium Plan */}
        <div className="border rounded-lg p-8 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="bg-blue-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full inline-block mb-4">
            Recommended
          </div>
          <h2 className="text-2xl font-bold mb-4">Premium</h2>
          <p className="text-3xl font-bold mb-1">£14.99</p>
          <p className="text-gray-600 mb-6">per month</p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span><strong>Unlimited</strong> searches</span>
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Enhanced results</span>
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Priority support</span>
            </li>
          </ul>
          <button 
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-150 ease-in-out ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upgrade Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
