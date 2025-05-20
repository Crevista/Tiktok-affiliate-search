"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [message, setMessage] = useState(success ? 'Subscription activated successfully!' : '');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=account');
    }
  }, [status, router]);

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setLoading(true);
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
  }, [status]);

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscriptionId) {
      setError('No active subscription to cancel');
      return;
    }
    
    try {
      setCancelLoading(true);
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      
      const data = await response.json();
      
      // Update subscription status
      setSubscription({
        ...subscription,
        status: 'canceled'
      });
      
      setMessage('Your subscription has been canceled. You will have access until the end of your billing period.');
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  // Loading state
  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-[#0B0219] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#1B7BFF] border-t-transparent rounded-full inline-block mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-[#0B0219] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Please log in to view your account.</p>
          <Link 
            href="/login?redirect=account" 
            className="px-6 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Get subscription status and plan details
  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active';
  const isCanceled = subscription?.status === 'canceled';
  const searchCount = subscription?.searchCount || 0;
  const searchesRemaining = Math.max(0, 5 - searchCount);
  const subscriptionEndDate = subscription?.stripeCurrentPeriodEnd 
    ? new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) 
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#0B0219] min-h-screen">
      {/* Navigation */}
      <nav className="flex justify-between items-center mb-8">
        <Link href="/" className="flex items-center">
          <div className="w-10 h-10 mr-2 rounded-full bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] flex items-center justify-center">
            <span className="text-xl font-bold text-white">CT</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-transparent bg-clip-text">
            The Content Tool
          </span>
        </Link>
        <div className="flex gap-4">
          <Link href="/search" className="px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5">
            Search
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-white hover:text-gray-200"
          >
            Log Out
          </button>
        </div>
      </nav>

      <div className="bg-[#0D0225] rounded-lg shadow-lg border border-gray-800 p-8 mb-8">
        <h1 className="text-2xl font-bold text-white mb-6">Account Information</h1>
        
        {message && (
          <div className="mb-6 p-4 bg-green-900/20 text-green-400 rounded-lg border border-green-700">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 text-red-400 rounded-lg border border-red-700">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-white mb-2">Profile</h2>
            <div className="bg-[#0B0219] p-4 rounded-lg border border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white">{session?.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-white">{session?.user?.name || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium text-white mb-2">Subscription</h2>
            <div className="bg-[#0B0219] p-4 rounded-lg border border-gray-800">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <p className="text-sm text-gray-400">Current Plan</p>
                  <p className="text-white font-medium">
                    {isPremium ? 'Premium' : 'Free'} 
                    {isCanceled && ' (Canceled)'}
                  </p>
                  
                  {isPremium && subscriptionEndDate && (
                    <p className="text-sm text-gray-400 mt-2">
                      {isCanceled 
                        ? `Access until: ${subscriptionEndDate}` 
                        : `Renews on: ${subscriptionEndDate}`}
                    </p>
                  )}
                  
                  {!isPremium && (
                    <p className="text-sm text-gray-400 mt-2">
                      {searchesRemaining} searches remaining this month
                    </p>
                  )}
                </div>
                
                <div className="mt-4 md:mt-0">
                  {isPremium && !isCanceled ? (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={cancelLoading}
                      className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition disabled:opacity-50"
                    >
                      {cancelLoading ? 'Processing...' : 'Cancel Subscription'}
                    </button>
                  ) : !isPremium && (
                    <Link
                      href="/pricing"
                      className="px-4 py-2 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition inline-block"
                    >
                      Upgrade to Premium
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium text-white mb-2">Usage</h2>
            <div className="bg-[#0B0219] p-4 rounded-lg border border-gray-800">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Searches This Month</p>
                  <p className="text-white">
                    {isPremium ? 'Unlimited' : `${searchCount} of 5 (${searchesRemaining} remaining)`}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Results Per Search</p>
                  <p className="text-white">
                    {isPremium ? 'Unlimited' : 'Limited to 2 results'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#0D0225] rounded-lg shadow-lg border border-gray-800 p-8">
        <h2 className="text-lg font-medium text-white mb-4">Account Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link 
            href="/search" 
            className="px-6 py-2 bg-[#1B7BFF] text-white rounded-lg hover:opacity-90 transition"
          >
            Search Videos
          </Link>
          
          <Link 
            href="/pricing" 
            className="px-6 py-2 border border-[#1B7BFF] text-[#1B7BFF] rounded-lg hover:bg-[#1B7BFF]/10 transition"
          >
            View Plans
          </Link>
          
          <button
            onClick={handleLogout}
            className="px-6 py-2 text-gray-400 hover:text-white"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
