"use client";

import { useState } from 'react';

export default function DirectDbTestPage() {
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const testConnection = async () => {
    setStatus('Testing connection...');
    
    try {
      const response = await fetch('/api/direct-db');
      const data = await response.json();
      
      setStatus(JSON.stringify(data, null, 2));
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setStatus('Creating user...');
    
    try {
      const response = await fetch('/api/direct-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      setStatus(JSON.stringify(data, null, 2));
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0219] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Direct Database Test</h1>
      
      <button
        onClick={testConnection}
        className="w-full max-w-md mx-auto block py-3 px-4 bg-green-600 rounded-lg hover:bg-green-700 mb-8"
      >
        Test Direct Database Connection
      </button>
      
      <form onSubmit={createUser} className="max-w-md mx-auto bg-[#1A1332] p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Create User Directly</h2>
        
        <div className="mb-4">
          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-[#0D0225] border border-gray-700 rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-[#0D0225] border border-gray-700 rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 rounded hover:bg-blue-700"
        >
          Create User
        </button>
      </form>
      
      {status && (
        <div className="max-w-md mx-auto p-4 bg-[#1A1332] rounded-lg">
          <h2 className="text-xl mb-2">Status:</h2>
          <pre className="whitespace-pre-wrap overflow-auto text-sm">{status}</pre>
        </div>
      )}
    </div>
  );
}
