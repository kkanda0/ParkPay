'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, Zap, Brain, Shield, Sparkles, LogIn } from 'lucide-react'
import { EchoProvider, EchoSignIn, EchoSignOut, useEcho } from '@merit-systems/echo-react-sdk'

// Authentication Component using Merit Echo SDK
function AuthComponent() {
  const { user, isLoading, isLoggedIn } = useEcho()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Auto-redirect when user is authenticated
  useEffect(() => {
    if (user && isLoggedIn && !isLoading) {
      // User is authenticated, redirect to map immediately
      window.location.href = '/map'
    }
  }, [user, isLoggedIn, isLoading])

  const handleFindParking = () => {
    // Check if already authenticated
    if (user && isLoggedIn) {
      // Already authenticated, go to map
      window.location.href = '/map'
    } else {
      // Not authenticated, show authentication modal
      setShowAuthModal(true)
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    // The useEffect will handle the redirect when authentication state updates
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleFindParking}
        disabled={isLoading}
        className="btn-primary px-12 py-6 rounded-2xl text-xl font-semibold disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
            />
            Loading...
          </>
        ) : user && isLoggedIn ? (
          'Go to Map'
        ) : (
          'Find Parking'
        )}
      </motion.button>

      {/* Authentication Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card rounded-3xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.3 }}
                  className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Sign In to ParkPay
                </h2>
                <p className="text-gray-400">
                  Sign in to access smart parking features.
                </p>
              </div>

              {/* Authentication Component */}
              <div className="space-y-6">
                <EchoSignIn 
                  onSuccess={handleAuthSuccess}
                  className="w-full"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In with Echo
                  </motion.button>
                </EchoSignIn>
                
                <p className="text-center text-sm text-gray-400">
                  Sign in to get started with ParkPay
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Main content component that uses Echo hooks
function HomePageContent() {
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
          Pay Smarter Park Faster
        </p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/map">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary px-12 py-6 rounded-2xl text-xl font-semibold"
            >
              Find Parking
            </motion.button>
          </Link>
          
        </motion.div>
      </motion.div>

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
            title: "Echo AI + Opik by Comet",
            description: "Smart insights and curated recommendations"
          },
          {
            icon: Shield,
            title: "Secure",
            description: "Blockchain-based escrow and settlement"
          },
          {
            icon: Car,
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

// Main export component that provides Echo context
export default function HomePage() {
  return (
    <EchoProvider config={{ 
      appId: '8aa15208-2fc9-4565-b397-57e5da728925',
      apiKey: '8aa15208-2fc9-4565-b397-57e5da728925'
    }}>
      <HomePageContent />
    </EchoProvider>
  )
}
