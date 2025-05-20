"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function TestLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleTestLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const response = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      setResult(response);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0B0219] text-white flex items-center justify-center p-4">
      <div className="bg-[#0D0225] border border-gray-700 rounded-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Test Login</h1>
        
        <form onSubmit={handleTestLogin} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#1A1332] border border-gray-700 rounded-lg focus:outline-none focus:border-[#1B7BFF]"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#1A1332] border border-gray-700 rounded-lg focus:outline-none focus:border-[#1B7BFF]"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[#1B7BFF] to-[#7742F6] hover:opacity-90 transition"
          >
            {loading ? 'Testing...' : 'Test Login'}
          </button>
        </form>
        
        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">Result:</h2>
            <pre className="bg-[#1A1332] p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
