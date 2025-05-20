"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmergencySetupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const router = useRouter();

  const createUser = async (e) => {
    e.preventDefault();
    setStatus('Creating user...');

    try {
      const response = await fetch('/api/emergency-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          action: 'create'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus('User created successfully! Go to /test-auth to test login.');
      } else {
        setStatus(`Error: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const checkDatabase = async () => {
    setStatus('Checking database...');
    
    try {
      const response = await fetch('/api/emergency-access');
      const data = await response.json();
      
      setStatus(`Database status: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0219] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Emergency Setup</h1>
      
      <div className="max-w-md mx-auto">
        <button
          onClick={checkDatabase}
          className="w-full py-2 bg-green-600 rounded hover:bg-green-700 mb-6"
        >
          Check Database Connection
        </button>
        
        <form onSubmit={createUser} className="bg-[#1A1332] p-6 rounded-lg">
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
            Create Emergency User
          </button>
        </form>
      </div>
      
      {status && (
        <div className="mt-6 p-4 bg-[#1A1332] rounded-lg">
          <h2 className="text-xl mb-2">Status:</h2>
          <pre className="whitespace-pre-wrap">{status}</pre>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
        <h2 className="text-xl mb-2">⚠️ Security Warning</h2>
        <p>This is an emergency recovery tool. Once your application is working correctly, delete the emergency-access API and this page.</p>
      </div>
    </div>
  );
}
