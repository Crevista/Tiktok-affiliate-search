"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function TestAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Attempting login...');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      setStatus(JSON.stringify(result, null, 2));
      
      if (result.ok) {
        setStatus('Login successful! Redirecting...');
        setTimeout(() => router.push('/search'), 2000);
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0219] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Emergency Authentication Test</h1>
      
      <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-[#1A1332] p-6 rounded-lg">
        <div className="mb-4">
          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 bg-[#0D0225] border border-gray-700 rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-[#0D0225] border border-gray-700 rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Test Login
        </button>
      </form>
      
      {status && (
        <div className="mt-6 p-4 bg-[#1A1332] rounded-lg">
          <h2 className="text-xl mb-2">Status:</h2>
          <pre className="whitespace-pre-wrap">{status}</pre>
        </div>
      )}
    </div>
  );
}
