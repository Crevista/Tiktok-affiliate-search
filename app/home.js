"use client";

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="bg-[#0B0219] min-h-screen">
      {/* Navigation */}
      <nav className="max-w-6xl mx-auto flex justify-between items-center p-6">
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
              <Link href="/search" className="px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5">
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

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Find <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B7BFF] to-[#7742F6]">Exact Moments</span> Products Are Mentioned
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Discover precisely when products are mentioned in YouTube videos. Create better affiliate content with timestamped links directly to product mentions.
        </p>
        
        {/* Main CTA - If logged in, go to search, otherwise go to login with redirect */}
        <Link 
          href={session ? "/search" : "/login?redirect=search"}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition text-lg font-medium inline-block"
        >
          Try It Now
        </Link>
      </div>

      {/* Feature Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            The Content Tool helps TikTok Shop creators and affiliates find exactly what they need to create viral short-form content.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-[#0D0225] p-6 rounded-lg border border-gray-800">
            <div className="w-12 h-12 bg-[#1B7BFF]/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Search By Keyword</h3>
            <p className="text-gray-300">
              Enter any product or topic, and we'll search millions of YouTube video transcripts to find exact mentions.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-[#0D0225] p-6 rounded-lg border border-gray-800">
            <div className="w-12 h-12 bg-[#7742F6]/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⏱️</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Get Exact Timestamps</h3>
            <p className="text-gray-300">
              Jump directly to the precise moment products are mentioned. No more watching entire videos to find what you need.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-[#0D0225] p-6 rounded-lg border border-gray-800">
            <div className="w-12 h-12 bg-[#1B7BFF]/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Boost Affiliate Sales</h3>
            <p className="text-gray-300">
              Create more targeted content by referencing real product discussions, increasing your conversion rates.
            </p>
          </div>
        </div>
      </div>

      {/* How It Helps Section */}
      <div className="bg-[#0D0225] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Perfect For TikTok Shop Affiliates</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Find untapped product mentions to repurpose into viral TikTok content that drives affiliate sales.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Find Product Reviews</h3>
                    <p className="text-gray-300">
                      Search for specific products to find real reviewers discussing features and benefits.
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Clip Key Moments</h3>
                    <p className="text-gray-300">
                      Jump to exact timestamps where products are mentioned, and use those clips for your content.
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Create TikTok Content</h3>
                    <p className="text-gray-300">
                      Transform those moments into engaging TikTok videos with your affiliate links.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="relative h-[400px] rounded-lg overflow-hidden border border-gray-800">
              {/* Placeholder for screenshot or illustration */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1B7BFF]/20 to-[#7742F6]/20 flex items-center justify-center">
                <div className="text-center p-6">
                  <span className="text-5xl mb-4 block">🎬</span>
                  <h3 className="text-xl font-bold text-white mb-2">Content Creation Made Easy</h3>
                  <p className="text-gray-300">
                    Transform YouTube product mentions into viral TikTok content
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing CTA */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Boost Your Affiliate Income?</h2>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
          Start with our free plan or upgrade to premium for unlimited access to product mentions across YouTube.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/pricing" 
            className="px-8 py-3 bg-transparent border border-[#1B7BFF] text-[#1B7BFF] rounded-lg hover:bg-[#1B7BFF]/10 transition text-lg font-medium"
          >
            View Pricing
          </Link>
          
          <Link 
            href={session ? "/search" : "/login?redirect=search"}
            className="px-8 py-3 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition text-lg font-medium"
          >
            Try It Now
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 mr-2 rounded-full bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] flex items-center justify-center">
                <span className="text-sm font-bold text-white">CT</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-transparent bg-clip-text">
                The Content Tool
              </span>
            </div>
            
            <div className="flex gap-8">
              <Link href="/pricing" className="text-gray-400 hover:text-white">
                Pricing
              </Link>
              <Link href="/login" className="text-gray-400 hover:text-white">
                Login
              </Link>
              <Link href="/signup" className="text-gray-400 hover:text-white">
                Sign Up
              </Link>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} The Content Tool. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
