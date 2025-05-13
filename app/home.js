"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
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
    <button className="px-4 py-2 text-white hover:text-gray-200">
      Login
    </button>
    <button className="px-6 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition">
      Sign Up
    </button>
  </div>
</nav>

      {/* Hero Section */}
      <section className="px-6 py-12 max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-transparent bg-clip-text">
            Smart Tools
          </span>{" "}
          for<br />
          TikTok Affiliates<br />
          and Content Creators
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
          Save time, create better content, and maximize your affiliate revenue with our suite of specialized creator tools.
        </p>
        <Link href="/search">
          <button className="px-8 py-4 text-xl bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition">
            Start Free Trial
          </button>
        </Link>
      </section>

      {/* Currently Available Section */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="border border-[#1B7BFF]/30 rounded-2xl p-8 bg-[#0D0225]">
          <h2 className="text-xl text-center text-gray-400 uppercase tracking-wider mb-6">
            Currently Available
          </h2>
          <h3 className="text-4xl font-bold text-center mb-4">
            YouTube Mention Search Tool
          </h3>
          <p className="text-xl text-center text-gray-300 mb-8">
            Find exact moments when products are mentioned in YouTube videos
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-transparent bg-clip-text">
          YouTube Mention Search
        </h2>
        <p className="text-xl text-center text-gray-300 mb-12">
          Our first tool helps you find and monetize product mentions in YouTube videos
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="border border-[#1B7BFF]/30 rounded-2xl p-6 bg-[#0D0225]">
            <div className="w-12 h-12 bg-[#1B7BFF] rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Precise Timestamp Search</h3>
            <p className="text-gray-300">
              Find exact moments when products are mentioned in YouTube videos
            </p>
          </div>

          {/* Feature 2 */}
          <div className="border border-[#1B7BFF]/30 rounded-2xl p-6 bg-[#0D0225]">
            <div className="w-12 h-12 bg-[#1B7BFF] rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Bulk Video Processing</h3>
            <p className="text-gray-300">
              Analyze multiple YouTube videos at once to save time
            </p>
          </div>

          {/* Feature 3 */}
          <div className="border border-[#1B7BFF]/30 rounded-2xl p-6 bg-[#0D0225]">
            <div className="w-12 h-12 bg-[#1B7BFF] rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Link Generation</h3>
            <p className="text-gray-300">
              Create timestamped links to share with your audience
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-transparent bg-clip-text">
          How It Works
        </h2>
        <p className="text-xl text-center text-gray-300 mb-12">
          Find product mentions in YouTube videos in three simple steps
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-8 mb-12">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1B7BFF] flex items-center justify-center text-2xl font-bold mb-4">
              1
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Paste YouTube URL</h3>
            <p className="text-gray-300 text-center">
              Add the YouTube video URL you want to analyze
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#4461FF] flex items-center justify-center text-2xl font-bold mb-4">
              2
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Enter Search Terms</h3>
            <p className="text-gray-300 text-center">
              Type the products or phrases you want to find
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#7742F6] flex items-center justify-center text-2xl font-bold mb-4">
              3
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Get Timestamps</h3>
            <p className="text-gray-300 text-center">
              View exact moments with links to share
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <Link href="/search">
            <button className="px-8 py-3 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition">
              Try It Now
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-xl font-bold bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-transparent bg-clip-text">
              The Content Tool
            </span>
          </div>
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} The Content Tool. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
