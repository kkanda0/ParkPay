'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MockEchoLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a mock JWT token
    const mockToken = btoa(JSON.stringify({
      sub: username || 'test-user',
      iss: 'https://api.echo.merit.systems',
      aud: 'parkpay',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      name: username || 'Test User',
      email: `${username}@example.com`
    }));

    // Redirect back to callback with token
    const redirectUri = new URLSearchParams(window.location.search).get('redirect_uri') || '/auth/callback';
    router.push(`${redirectUri}?token=${mockToken}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
          {/* Echo Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">E</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Echo by Merit Systems</h1>
            <p className="text-gray-400">Mock Authentication Page</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing In...
                </>
              ) : (
                'Sign In with Echo'
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <h3 className="text-blue-400 font-semibold mb-2">Demo Mode</h3>
            <p className="text-blue-300 text-sm">
              This is a mock Echo login page for testing. In production, this would be hosted by Echo by Merit Systems.
            </p>
            <div className="mt-2 text-xs text-blue-400">
              <p>• Any username/password will work</p>
              <p>• Generates a mock JWT token</p>
              <p>• Redirects back to your app</p>
            </div>
          </div>

          {/* Back to App */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.back()}
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
