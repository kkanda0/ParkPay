'use client'

import { motion } from 'framer-motion'
import { Car, Zap, Brain, Shield, LogIn, User, Gauge } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { logIn, testAuthenticatedAccess, logout } from './actions'
import { generatePkcePair } from '@/lib/utils/pkce'

// Main content component that uses Echo hooks
function HomePageContent() {
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('john.doe')
  const [loginResult, setLoginResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check for authentication success on page load
  useEffect(() => {
    const authSuccess = searchParams.get('auth_success')
    const authError = searchParams.get('auth_error')
    
    if (authSuccess === 'true') {
      // Authentication was successful, set state immediately
      setIsCheckingAuth(false)
      setIsAuthenticated(true)
      setAuthMessage('🎉 Successfully authenticated with Echo! Redirecting to dashboard...')
      // Clear the URL parameters
      window.history.replaceState({}, '', '/')
      
      // Redirect to dashboard/map after a short delay
      setTimeout(() => {
        window.location.href = '/map'
      }, 2000)
    } else if (authError) {
      setIsCheckingAuth(false)
      setIsAuthenticated(false)
      setAuthMessage(`❌ Authentication failed: ${decodeURIComponent(authError)}`)
      // Clear the URL parameters
      window.history.replaceState({}, '', '/')
    } else {
      // Check if user is already authenticated by testing access
      // Add a small delay to prevent flash of error state
      setTimeout(() => {
        checkAuthStatus()
      }, 100)
    }
  }, [searchParams])

  const checkAuthStatus = async () => {
    setIsCheckingAuth(true)
    try {
      const result = await testAuthenticatedAccess()
      if (result.success) {
        setIsAuthenticated(true)
        // Only update message if we don't already have a success message
        if (!authMessage.includes('Successfully authenticated')) {
          setAuthMessage('✅ Already authenticated with Echo')
        }
      } else {
        setIsAuthenticated(false)
        // Only clear message if we don't have a success message
        if (!authMessage.includes('Successfully authenticated')) {
          setAuthMessage('')
        }
      }
    } catch (error) {
      setIsAuthenticated(false)
      // Only clear message if we don't have a success message
      if (!authMessage.includes('Successfully authenticated')) {
        setAuthMessage('')
      }
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const result = await logout()
      if (result.success) {
        setIsAuthenticated(false)
        setAuthMessage('🚪 Successfully logged out')
        
        // Clear any PKCE session data from localStorage/sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pkce_code_verifier')
          localStorage.removeItem('pkce_code_verifier')
        }
        
        // Clear the message after a few seconds
        setTimeout(() => {
          setAuthMessage('')
        }, 3000)
      } else {
        setAuthMessage(`❌ Logout failed: ${result.message}`)
      }
    } catch (error) {
      setAuthMessage('❌ Logout failed')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleLogIn = async () => {
    setLoading(true)
    setLoginResult(null)
    
    try {
      const result = await logIn(username)
      setLoginResult(result)
    } catch (error) {
      setLoginResult({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestAuth = async () => {
    setLoading(true)
    setLoginResult(null)
    
    try {
      const result = await testAuthenticatedAccess()
      setLoginResult(result)
    } catch (error) {
      setLoginResult({ 
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRealEchoLogin = async () => {
    // Check if we have real Echo credentials
    const echoAppId = process.env.NEXT_PUBLIC_ECHO_APP_ID;
    
    if (echoAppId && echoAppId !== 'your-echo-app-id-here') {
      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        
        // Generate PKCE code_verifier and code_challenge
        const { code_verifier, code_challenge } = await generatePkcePair();
        
        // Store code_verifier in sessionStorage for later use in callback
        sessionStorage.setItem('pkce_code_verifier', code_verifier);
        
        // Construct the Echo authorization URL with PKCE parameters
        const echoAuthUrl = `https://echo.merit.systems/oauth/authorize?` +
          `client_id=${echoAppId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=openid&` +
          `code_challenge=${code_challenge}&` +
          `code_challenge_method=S256`;
        
        console.log('🔐 Initiating Echo PKCE authentication flow:');
        console.log('📋 App ID:', echoAppId);
        console.log('🔄 Redirect URI:', redirectUri);
        console.log('🔑 Code Challenge:', code_challenge);
        console.log('🔑 Code Verifier (first 10 chars):', code_verifier.substring(0, 10) + '...');
        console.log('🌐 Authorization URL:', echoAuthUrl);
        console.log('💾 Stored code_verifier in sessionStorage');
        
        // Redirect to Echo authorization endpoint
        window.location.href = echoAuthUrl;
        
      } catch (error) {
        console.error('❌ Error initiating Echo authentication:', error);
        // Fall back to mock login on error
        const redirectUri = `${window.location.origin}/auth/callback`;
        const mockEchoUrl = `/auth/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
        window.location.href = mockEchoUrl;
      }
    } else {
      // Fall back to mock Echo login page for testing
      const redirectUri = `${window.location.origin}/auth/callback`;
      const mockEchoUrl = `/auth/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
      window.location.href = mockEchoUrl;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-8 pb-32">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", bounce: 0.3 }}
          className="w-32 h-32 bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-600 rounded-3xl flex items-center justify-center mx-auto mb-12 neon-glow"
        >
          <Car className="w-16 h-16 text-white" />
        </motion.div>
        
        <h1 className="text-8xl font-bold gradient-text mb-8 leading-tight">
          ParkPay
        </h1>
        
        <p className="text-2xl text-gray-300 mb-12 max-w-3xl">
          Pay Smarter, Park Faster
        </p>
        
        {/* Authentication Status */}
        {authMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 p-4 bg-green-900/20 border border-green-500/30 rounded-xl text-green-300 text-center"
          >
            {authMessage}
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {/* Find Parking button hidden as requested */}
          {/* <Link href="/map">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary px-12 py-6 rounded-2xl text-xl font-semibold"
            >
              Find Parking
            </motion.button>
          </Link> */}
          
      {isCheckingAuth ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 bg-blue-600/20 border border-blue-500/30 px-12 py-6 rounded-2xl text-xl font-semibold text-blue-300"
        >
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-300"></div>
          Checking authentication...
        </motion.div>
      ) : isAuthenticated ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-3 bg-green-600/20 border border-green-500/30 px-12 py-6 rounded-2xl text-xl font-semibold text-green-300">
            <User className="w-6 h-6" />
            ✅ Authenticated with Echo
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-3 justify-center"
          >
            <LogIn className="w-5 h-5" />
            {isLoggingOut ? 'Logging out...' : '🚪 Logout'}
          </motion.button>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRealEchoLogin}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-6 rounded-2xl text-xl font-semibold flex items-center gap-3"
        >
          <LogIn className="w-6 h-6" />
          Login
        </motion.button>
      )}
        </motion.div>
      </motion.div>

      {/* Login Section */}
      {showLogin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-2xl mb-12"
        >
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Echo Authentication</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (e.g., john.doe)"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogIn}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Logging In...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Log In
                    </>
                  )}
                </motion.button>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRealEchoLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-semibold mb-3"
              >
                Login
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTestAuth}
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-semibold"
              >
                Test Authentication Status
              </motion.button>
            </div>
            
            {loginResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                {loginResult.error ? (
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                    <h3 className="text-red-400 font-semibold mb-2">Authentication Required</h3>
                    <p className="text-red-300 text-sm">{loginResult.error}</p>
                  </div>
                ) : loginResult.success === false ? (
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                    <h3 className="text-red-400 font-semibold mb-2">Authentication Failed</h3>
                    <p className="text-red-300 text-sm">{loginResult.message}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
                    <h3 className="text-green-400 font-semibold mb-2">Login Success!</h3>
                    <p className="text-green-300 text-sm">{loginResult.message}</p>
                    {loginResult.data && (
                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-green-300 text-sm">Session ID:</span>
                          <span className="text-green-200 text-sm font-mono bg-green-800/30 px-2 py-1 rounded">
                            {loginResult.data.sessionId}
                          </span>
                        </div>
                        <div>
                          <span className="text-green-300 text-sm">Permissions:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {loginResult.data.permissions.map((permission: string, index: number) => (
                              <span 
                                key={index}
                                className="text-xs bg-green-800/30 text-green-200 px-2 py-1 rounded"
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs text-green-400 text-center pt-2 border-t border-green-500/30">
                          Login processed securely with Echo authentication
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
            
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                <h3 className="text-blue-400 font-semibold mb-2">Testing Instructions</h3>
                <div className="text-blue-300 text-sm space-y-1">
                  <p>1. <strong>Without Echo token:</strong> Login will fail with authentication error</p>
                  <p>2. <strong>With valid Echo token:</strong> Login will succeed and show session data</p>
                  <p>3. <strong>Set mock token:</strong> Run in browser console:</p>
                  <pre className="mt-2 bg-gray-800 p-2 rounded text-xs overflow-x-auto">
        {`document.cookie = "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpc3MiOiJodHRwczovL2FwaS5lY2hvLm1lcml0LnN5c3RlbXMiLCJhdWQiOiJwYXJrcGF5IiwiaWF0IjoxNzM2MTI5NjAwLCJleHAiOjE3MzYyMTYwMDB9.mock-signature";`}
                  </pre>
                  <p className="mt-3">
                    <strong>🔗 Need to test Echo URLs?</strong>{' '}
                    <a href="/echo-url-tester" className="text-blue-300 hover:text-blue-200 underline">
                      Open Echo URL Tester
                    </a>
                  </p>
                </div>
              </div>
          </div>
        </motion.div>
      )}

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl"
      >
        {[
          {
            icon: Zap,
            title: "Instant Payments",
            description: "XRPL-powered micropayments with RLUSD"
          },
          {
            icon: Brain,
            title: "Echo AI by Merit",
            description: "Smart insights and curated recommendations"
          },
          {
            icon: Shield,
            title: "Secure",
            description: "Blockchain-based escrow and settlement"
          },
          {
            icon: Gauge,
            title: "Real-time",
            description: "Live billing"
          }
        ].map((feature, index) => {
          const Icon = feature.icon
          
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-base">{feature.description}</p>
            </motion.div>
          )
        })}
      </motion.div>

    </div>
  )
}

// Main export component
export default function HomePage() {
  return <HomePageContent />
}
