'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForToken } from '@/app/actions';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Echo authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('🔄 Echo callback received:');
        console.log('📋 Authorization code:', code ? '***present***' : 'missing');
        console.log('❌ Error:', error);
        console.log('📄 Error description:', errorDescription);
        console.log('🔍 Full URL params:', Object.fromEntries(searchParams.entries()));

        if (error) {
          console.error('❌ Echo authentication error:', error, errorDescription);
          setStatus('error');
          setMessage(`Authentication failed: ${errorDescription || error}`);
          
          // Redirect to home with error after a delay
          setTimeout(() => {
            router.push(`/?auth_error=${encodeURIComponent(errorDescription || error)}`);
          }, 3000);
          return;
        }

        if (!code) {
          console.error('❌ No authorization code received from Echo');
          setStatus('error');
          setMessage('No authorization code received from Echo');
          
          setTimeout(() => {
            router.push('/?auth_error=no_authorization_code');
          }, 3000);
          return;
        }

        // Retrieve code_verifier from sessionStorage
        const code_verifier = sessionStorage.getItem('pkce_code_verifier');
        
        if (!code_verifier) {
          console.error('❌ PKCE code_verifier not found in sessionStorage');
          setStatus('error');
          setMessage('Authentication session expired. Please try again.');
          
          setTimeout(() => {
            router.push('/?auth_error=pkce_session_expired');
          }, 3000);
          return;
        }

        // Clear the code_verifier from sessionStorage immediately
        sessionStorage.removeItem('pkce_code_verifier');

        console.log('🔄 Exchanging authorization code for access token...');
        setMessage('Exchanging authorization code for access token...');

        // Call server action to exchange code for token
        const result = await exchangeCodeForToken(code, code_verifier);

        if (result.success) {
          console.log('✅ Echo authentication completed successfully');
          setStatus('success');
          setMessage('Authentication successful! Redirecting to home page...');
          
          // Redirect to home page with success
          setTimeout(() => {
            router.push('/?auth_success=true');
          }, 2000);
        } else {
          console.error('❌ Token exchange failed:', result.error);
          setStatus('error');
          setMessage(`Token exchange failed: ${result.message || result.error}`);
          
          setTimeout(() => {
            router.push(`/?auth_error=${encodeURIComponent(result.error || 'token_exchange_failed')}`);
          }, 3000);
        }
      } catch (error) {
        console.error('❌ Unexpected error during callback processing:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during authentication');
        
        setTimeout(() => {
          router.push(`/?auth_error=${encodeURIComponent('unexpected_error')}`);
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'processing' && (
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>

          {/* Status Message */}
          <h1 className="text-2xl font-bold text-white mb-4">
            {status === 'processing' && 'Processing Echo Authentication'}
            {status === 'success' && 'Authentication Successful!'}
            {status === 'error' && 'Authentication Failed'}
          </h1>
          
          <p className="text-gray-300 mb-6">{message}</p>

          {/* Additional Info */}
          <div className="text-sm text-gray-400">
            {status === 'processing' && (
              <p>Please wait while we complete your authentication...</p>
            )}
            {status === 'success' && (
              <p>You will be redirected to the home page shortly.</p>
            )}
            {status === 'error' && (
              <p>You will be redirected to the home page to try again.</p>
            )}
          </div>

          {/* Manual Back Button */}
          <div className="mt-8">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white text-sm underline"
            >
              Return to Home Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
