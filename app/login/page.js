"use client";
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result.error) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Successful login, redirect to search page
      router.push('/search');
    } catch (error) {
      setError('An error occurred. Please try again.');
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
      </nav>

      <div className="max-w-md mx-auto mt-10 p-6 bg-[#0D0225] rounded-lg shadow-lg border border-[#1B7BFF]/30">
        <h1 className="text-2xl font-bold text-center mb-6">Log In</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 text-red-400 rounded-lg border border-red-700">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-700 bg-[#0B0219] text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-700 bg-[#0B0219] text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center mb-6">
            <input 
              type="checkbox" 
              id="newsletter" 
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-[#0B0219]" 
            />
            <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-300">
              Join our mailing list for tips and updates
            </label>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] text-white rounded-lg hover:opacity-90 transition disabled:opacity-75"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
          
          <div className="mt-4 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#1B7BFF] hover:text-[#4461FF]">
              Sign Up
            </Link>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">Demo credentials:</p>
          <p className="text-sm text-gray-300">Email: demo@example.com</p>
          <p className="text-sm text-gray-300">Password: password123</p>
        </div>
      </div>

      <div className="max-w-md mx-auto mt-6 p-4 text-center text-xs text-gray-500">
        <p>Your data is protected in accordance with our Privacy Policy.</p>
        <p>We never share your information without consent.</p>
      </div>
    </div>
  );
}
