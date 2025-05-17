"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [searchCount, setSearchCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const fetchData = async () => {
        try {
          // Get subscription
          const subscriptionRes = await fetch('/api/user/subscription');
          const subscriptionData = await subscriptionRes.json();
          setSubscription(subscriptionData.subscription);
          
          // Get search count
          const searchCountRes = await fetch('/api/user/search-count');
          const searchCountData = await searchCountRes.json();
          setSearchCount(searchCountData);
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setIsLoading(false);
        }
      };
      
      fetchData();
    }
  }, [status, router]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0219] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1B7BFF]"></div>
      </div>
    );
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
        <div className="flex items-center gap-4">
          <Link href="/search">
            <button className="px-4 py-2 text-white hover:text-gray-200">
              Search
            </button>
          </Link>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-[#1B7BFF]/10 text-white"
          >
            Log Out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account</h1>
          <p className="text-gray-300">Manage your subscription and account details</p>
        </div>

        {/* User Profile */}
        <div className="bg-[#0D0225] rounded-lg p-6 mb-6 border border-[#1B7BFF]/30">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Email</p>
              <p className="text-white">{session?.user?.email || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm">Name</p>
              <p className="text-white">{session?.user?.name || 'Not provided'}</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm">Member Since</p>
              <p className="text-white">{subscription?.createdAt ? formatDate(subscription.createdAt) : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Subscription Information */}
        <div className="bg-[#0D0225] rounded-lg p-6 mb-6 border border-[#1B7BFF]/30">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Subscription</h2>
            {subscription?.plan === 'free' && (
              <Link href="/pricing">
                <button className="px-4 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg text-sm">
                  Upgrade
                </button>
              </Link>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Current Plan</p>
              <p className="text-white capitalize">{subscription?.plan || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-white capitalize">{subscription?.status || 'N/A'}</p>
            </div>
            
            {subscription?.plan === 'free' ? (
              <div>
                <p className="text-gray-400 text-sm">Searches Remaining</p>
                <p className="text-white">{searchCount?.remaining || 0} of 5</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 text-sm">Next Billing Date</p>
                <p className="text-white">
                  {subscription?.stripeCurrentPeriodEnd ? 
                    formatDate(subscription.stripeCurrentPeriodEnd) : 
                    'N/A'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-[#0D0225] rounded-lg p-6 border border-[#1B7BFF]/30">
          <h2 className="text-xl font-bold mb-4">Quick Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/search">
              <div className="p-4 bg-[#0B0219] rounded-lg border border-gray-700 hover:border-[#1B7BFF] cursor-pointer transition">
                <h3 className="font-medium mb-1">Search Tool</h3>
                <p className="text-gray-400 text-sm">Find product mentions in YouTube videos</p>
              </div>
            </Link>
            
            <Link href="/pricing">
              <div className="p-4 bg-[#0B0219] rounded-lg border border-gray-700 hover:border-[#1B7BFF] cursor-pointer transition">
                <h3 className="font-medium mb-1">Pricing</h3>
                <p className="text-gray-400 text-sm">View available plans and pricing</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
