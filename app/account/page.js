"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Check for success message from URL
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const error = searchParams.get('error');
    
    if (success) {
      setMessage('Your subscription has been successfully activated!');
    } else if (canceled) {
      setMessage('Your subscription has been canceled. You will have access until the end of your billing period.');
    } else if (error === 'no-subscription') {
      setMessage('No active subscription found to cancel.');
    } else if (error === 'cancel-failed') {
      setMessage('Failed to cancel subscription. Please try again or contact support.');
    }
  }, [searchParams]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account');
    }
  }, [status, router]);
  
  // Fetch user data and subscription status
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === 'authenticated') {
        try {
          setLoading(true);
          const response = await fetch('/api/user/subscription');
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setSubscription(data.subscription);
          } else {
            console.error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
  }, [status]);
  
  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0B0219] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-[#1B7BFF] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading your account...</p>
        </div>
      </div>
    );
  }
  
  // Not logged in
  if (status === 'unauthenticated') {
    return null; // Will redirect to login
  }
  
  return (
    <div className="min-h-screen bg-[#0B0219] text-white">
      {/* Navigation */}
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
          <Link href="/search">
            <button className="px-4 py-2 text-white hover:text-gray-200">
              Search
            </button>
          </Link>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto p-6">
        {/* Success/Error Messages */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('failed') || message.includes('No active subscription') 
              ? 'bg-red-900/50 border border-red-500' 
              : 'bg-green-900/50 border border-green-500'
          }`}>
            {message}
          </div>
        )}
        
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        {/* User Profile Section */}
        <div className="bg-[#0D0225] border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Your Profile</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 mb-1">Name</p>
              <p className="text-xl">{user?.name || session?.user?.name || 'Not provided'}</p>
            </div>
            
            <div>
              <p className="text-gray-400 mb-1">Email</p>
              <p className="text-xl">{user?.email || session?.user?.email}</p>
            </div>
          </div>
        </div>
        
        {/* Subscription Section */}
        <div className="bg-[#0D0225] border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Your Subscription</h2>
          
          {subscription ? (
            <div>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-gray-400 mb-1">Current Plan</p>
                  <p className="text-xl capitalize">
                    {subscription.plan === 'premium' ? (
                      <span className="text-[#1B7BFF] font-bold">Premium</span>
                    ) : (
                      'Free'
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 mb-1">Status</p>
                  <p className="text-xl capitalize">
                    {subscription.status === 'active' ? (
                      <span className="text-green-500">Active</span>
                    ) : (
                      <span className="text-yellow-500">{subscription.status}</span>
                    )}
                  </p>
                </div>
                
                {subscription.plan === 'premium' && subscription.status === 'active' && (
                  <div>
                    <p className="text-gray-400 mb-1">Next Billing Date</p>
                    <p className="text-xl">
                      {subscription.stripeCurrentPeriodEnd 
                        ? new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString() 
                        : 'Not available'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Subscription Management */}
              {subscription.plan === 'premium' ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  {subscription.status === 'active' && (
                    <button 
                      onClick={() => router.push('/api/cancel-subscription')}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      Cancel Subscription
                    </button>
                  )}
                  
                  {subscription.status !== 'active' && (
                    <Link href="/pricing">
                      <button className="px-6 py-3 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition">
                        Reactivate Subscription
                      </button>
                    </Link>
                  )}
                </div>
              ) : (
                <Link href="/pricing">
                  <button className="px-6 py-3 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition">
                    Upgrade to Premium
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-400 mb-4">You are currently on the Free plan.</p>
              <Link href="/pricing">
                <button className="px-6 py-3 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition">
                  Upgrade to Premium
                </button>
              </Link>
            </div>
          )}
        </div>
        
        {/* Usage Statistics */}
        <div className="bg-[#0D0225] border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Usage Statistics</h2>
          
          {user?.searchCounts ? (
            <div>
              <p className="text-gray-400 mb-2">Searches this month: {user.searchCounts?.count || 0} / {subscription?.plan === 'premium' ? 'Unlimited' : '5'}</p>
              
              {subscription?.plan !== 'premium' && user.searchCounts?.count >= 5 && (
                <div className="mt-4">
                  <p className="text-yellow-500 mb-3">You've reached your monthly search limit. Upgrade to Premium for unlimited searches.</p>
                  <Link href="/pricing">
                    <button className="px-6 py-3 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] rounded-lg hover:opacity-90 transition">
                      Upgrade Now
                    </button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400">No usage data available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
