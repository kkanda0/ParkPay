'use client';

import { useState } from 'react';
import { logIn, testAuthenticatedAccess, testUnauthenticatedAccess } from '../actions';

export default function LoginTestPage() {
  const [username, setUsername] = useState('john.doe');
  const [loginResult, setLoginResult] = useState<any>(null);
  const [authResult, setAuthResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLogIn = async () => {
    setLoading(true);
    setLoginResult(null);
    
    try {
      const result = await logIn(username);
      setLoginResult(result);
    } catch (error) {
      setLoginResult({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestAuth = async () => {
    setLoading(true);
    setAuthResult(null);
    
    try {
      const result = await testAuthenticatedAccess();
      setAuthResult(result);
    } catch (error) {
      setAuthResult({ 
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestUnauth = async () => {
    setLoading(true);
    setAuthResult(null);
    
    try {
      const result = await testUnauthenticatedAccess();
      setAuthResult(result);
    } catch (error) {
      setAuthResult({ 
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Echo Authentication Test - Login
          </h1>
          
          <div className="space-y-6">
            {/* Login Test Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Login Server Action Test
              </h2>
              
              <div className="flex items-center space-x-4 mb-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (e.g., john.doe)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleLogIn}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Logging In...' : 'Log In'}
                </button>
              </div>
              
              {loginResult && (
                <div className="mt-4">
                  {loginResult.error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-red-800 font-semibold">Authentication Error</h3>
                      <p className="text-red-600">{loginResult.error}</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="text-green-800 font-semibold">Login Success!</h3>
                      <p className="text-green-600">Login processed successfully</p>
                      {loginResult.ui && (
                        <div className="mt-4">
                          {/* The streamable UI will be rendered here */}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Authentication Test Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Authentication Test
              </h2>
              
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={handleTestAuth}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Authenticated Access
                </button>
                <button
                  onClick={handleTestUnauth}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Unauthenticated Access
                </button>
              </div>
              
              {authResult && (
                <div className="mt-4">
                  {authResult.success ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="text-green-800 font-semibold">Authentication Success</h3>
                      <p className="text-green-600">{authResult.message}</p>
                      {authResult.user && (
                        <pre className="mt-2 text-xs bg-green-100 p-2 rounded">
                          {JSON.stringify(authResult.user, null, 2)}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-red-800 font-semibold">Authentication Failed</h3>
                      <p className="text-red-600">{authResult.message}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-800 font-semibold mb-2">How to Test</h3>
              <div className="text-blue-700 text-sm space-y-1">
                <p>1. <strong>Without Echo token:</strong> Login should fail with authentication errors</p>
                <p>2. <strong>With valid Echo token:</strong> Login should succeed and show session data</p>
                <p>3. <strong>With invalid token:</strong> Login should fail with "Invalid token" errors</p>
                <p>4. Check browser cookies for the 'token' cookie to verify Echo authentication</p>
              </div>
            </div>

            {/* Mock Token Setup */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-800 font-semibold mb-2">Mock Token for Testing</h3>
              <div className="text-yellow-700 text-sm space-y-2">
                <p>To test with a mock token, run this in your browser console:</p>
                <pre className="bg-yellow-100 p-2 rounded text-xs overflow-x-auto">
{`document.cookie = "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpc3MiOiJodHRwczovL2FwaS5lY2hvLm1lcml0LnN5c3RlbXMiLCJhdWQiOiJwYXJrcGF5IiwiaWF0IjoxNzM2MTI5NjAwLCJleHAiOjE3MzYyMTYwMDB9.mock-signature";`}
                </pre>
                <p>Then refresh the page and try the login action.</p>
              </div>
            </div>

            {/* Environment Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-gray-800 font-semibold mb-2">Environment Configuration</h3>
              <div className="text-gray-600 text-sm space-y-1">
                <p><strong>ECHO_CONTROL_URL:</strong> {process.env.NEXT_PUBLIC_ECHO_CONTROL_URL || 'Not set'}</p>
                <p><strong>ECHO_JWKS_URL:</strong> {process.env.NEXT_PUBLIC_ECHO_JWKS_URL || 'Not set'}</p>
                <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Note: ECHO_SERVER_KEY is server-side only and not exposed to client
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
