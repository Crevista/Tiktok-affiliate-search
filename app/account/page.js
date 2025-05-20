'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  
  const success = searchParams.get('success');
  
  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account');
    }
  }, [status, router]);
  
  // Fetch subscription data
  useEffect(() => {
    if (session) {
      fetchSubscription();
    }
  }, [session]);
  
  async function fetchSubscription() {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      return;
    }
    
    try {
      setIsCanceling(true);
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      // Refresh subscription data
      await fetchSubscription();
      alert('Subscription canceled successfully. You will have access until the end of your billing period.');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCanceling(false);
    }
  }
  
  // Format date to be more readable
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  
  if (status === 'loading' || loading) {
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
        
        <div className="flex items-center space-x-4">
          <Link href="/search" className="text-gray-300 hover:text-white transition">
            Search
          </Link>
          <Link href="/pricing" className="text-gray-300 hover:text-white transition">
            Pricing
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-gray-300 hover:text-white transition"
          >
            Log Out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-8">Your Account</h1>
        
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-600 text-green-400 rounded-lg">
            <p>Thank you for subscribing! Your premium plan is now active.</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600 text-red-400 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* User Info */}
          <div className="bg-[#0D0225] p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-bold mb-4">Profile Information</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Name</p>
                <p className="font-medium">{session?.user?.name || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="font-medium">{session?.user?.email}</p>
              </div>
            </div>
          </div>
          
          {/* Subscription Info */}
          <div className="bg-[#0D0225] p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-bold mb-4">Subscription</h2>
            
            {subscription ? (
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Current Plan</p>
                  <p className="font-medium capitalize">{subscription.plan || 'Free'}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      subscription.status === 'active' ? 'bg-green-500' : 
                      subscription.status === 'canceled' ? 'bg-red-500' : 'bg-
