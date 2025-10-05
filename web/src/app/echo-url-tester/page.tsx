'use client';

import { useState } from 'react';

export default function EchoUrlTester() {
  const [selectedUrl, setSelectedUrl] = useState(0);
  const [customUrl, setCustomUrl] = useState('');

  const echoAppId = process.env.NEXT_PUBLIC_ECHO_APP_ID || '8aa15208-2fc9-4565-b397-57e5da728925';
  const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:3002/auth/callback';

  const echoUrls = [
    // Standard OAuth format
    `https://echo.merit.systems/oauth/authorize?client_id=${echoAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid`,
    
    // Alternative OAuth format
    `https://api.echo.merit.systems/oauth/authorize?client_id=${echoAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`,
    
    // Original format
    `https://echo.merit.systems/auth?app_id=${echoAppId}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    
    // Alternative endpoint
    `https://echo.merit.systems/login?app_id=${echoAppId}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    
    // Echo Loyalty format
    `https://b2c-${echoAppId}.echoloyalty.com/b2c/v3/auth?redirect_uri=${encodeURIComponent(redirectUri)}`,
    
    // Custom URL
    customUrl || 'Enter custom URL below'
  ];

  const handleTestUrl = (urlIndex: number) => {
    const url = echoUrls[urlIndex];
    if (url && url !== 'Enter custom URL below') {
      console.log('Testing Echo URL:', url);
      window.open(url, '_blank');
    }
  };

  const handleCustomUrl = () => {
    if (customUrl) {
      console.log('Testing custom Echo URL:', customUrl);
      window.open(customUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Echo URL Tester</h1>
            <p className="text-gray-400">Test different Echo authentication endpoints</p>
          </div>

          <div className="space-y-4">
            {echoUrls.slice(0, -1).map((url, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-700 rounded-xl">
                <div className="flex-shrink-0">
                  <span className="text-blue-400 font-mono text-sm">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <code className="text-gray-300 text-sm break-all">{url}</code>
                </div>
                <button
                  onClick={() => handleTestUrl(index)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Test
                </button>
              </div>
            ))}

            {/* Custom URL */}
            <div className="p-4 bg-gray-700 rounded-xl">
              <h3 className="text-white font-semibold mb-3">Custom Echo URL</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://your-echo-domain.com/auth?client_id=..."
                  className="flex-1 px-4 py-3 bg-gray-600 border border-gray-500 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCustomUrl}
                  disabled={!customUrl}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold"
                >
                  Test Custom
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <h3 className="text-blue-400 font-semibold mb-2">Instructions</h3>
            <div className="text-blue-300 text-sm space-y-1">
              <p>1. <strong>Click "Test"</strong> on any URL to open it in a new tab</p>
              <p>2. <strong>Check if it loads</strong> - Look for login page or error</p>
              <p>3. <strong>Try different URLs</strong> until you find one that works</p>
              <p>4. <strong>Use custom URL</strong> if you have a specific Echo endpoint</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-white text-sm"
            >
              ← Back to ParkPay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
