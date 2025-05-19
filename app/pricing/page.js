"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleFreeTrial = () => {
    if (status === 'authenticated') {
      // If already logged in, go to search page
      router.push('/search');
    } else {
      // Otherwise go to signup page
      router.push('/signup');
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    try {
      // If not logged in, redirect to signup
      if (status !== 'authenticated') {
        router.push('/signup');
        return;
      }
      
      // Create Stripe checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_premium', // This will be replaced with your actual Stripe price ID later
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('Error creating checkout session:', data.error);
        alert('An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="flex gap-4">
          {status === 'authenticated' ? (
            <Link href="/search">
              <button className="px-4 py-2 text-white hover:text-gray-200">
                Dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <button className="px-4 py-2 text-white hover:text-gray-200">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-6 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the plan that works for your TikTok affiliate needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="bg-[#0D0225] border border-gray-700 rounded-xl p-6 flex flex-col h-full">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-gray-400 mb-6">Perfect for trying out the tool</p>
            
            <div className="flex items-end mb-6">
              <span className="text-4xl font-bold">£0</span>
              <span className="text-gray-400 ml-2">/month</span>
            </div>
            
            <ul className="mb-8 flex-grow">
              <li className="flex items-start mb-3">
                <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>5 searches per month</span>
              </li>
              <li className="flex items-start mb-3">
                <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>2 videos shown per search</span>
              </li>
              <li className="flex items-start mb-3">
                <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Basic search features</span>
              </li>
              <li className="flex items-start mb-3 text-gray-500">
                <svg className="h-5 w-5 text-gray-500 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>Unlimited searches</span>
              </li>
              <li className="flex items-start mb-3 text-gray-500">
                <svg className="h-5 w-5 text-gray-500 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>All matching videos</span>
              </li>
            </ul>
            
            <button
              onClick={handleFreeTrial}
              className="w-full py-3 rounded-lg bg-white text-[#0B0219] hover:bg-gray-200 transition"
            >
              Get Started
            </button>
          </div>

          {/* Premium Tier */}
          <div className="bg-[#0D0225] border border-[#1B7BFF] rounded-xl p-6 flex flex-col h-full relative">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] px-4 py-1 rounded-tr-xl rounded-bl-xl text-sm font-medium">
              Popular
            </div>
            
            <h3 className="text-2xl font-bold mb-2">Premium</h3>
            <p className="text-gray-400 mb-6">For serious TikTok affiliates</p>
            
            <div className="flex items-end mb-6">
              <span className="text-4xl font-bold">£14.99</span>
              <span className="text-gray-400 ml-2">/month</span>
            </div>
            
            <ul className="mb-8 flex-grow">
              <li className="flex items-start mb-3">
                <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="font-bold">Unlimited searches</span>
              </li>
              <li className="flex items-start mb-3">
                <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="font-bold">All matching videos shown</span>
              </li>
              <li className="flex items-start mb-3">
                <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Download timestamps</span>
              </li>
              <li className="flex items-start mb-3">
                <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Priority support</span>
              </li>
              <li className="flex items-start mb-3">
                <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Early access to new features</span>
              </li>
            </ul>
            
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] hover:opacity-90 transition"
            >
              {isLoading ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-400">
            All plans include a 14-day money-back guarantee. No questions asked.
          </p>
          <p className="text-gray-400 mt-2">
            Need help choosing? <Link href="/contact" className="text-[#1B7BFF] hover:underline">Contact us</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
