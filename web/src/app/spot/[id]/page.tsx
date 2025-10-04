'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, ArrowLeft, ExternalLink, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { apiService, Session } from '@/lib/api'
import { useApp } from '@/app/providers'
import { cn, formatRLUSD, formatDuration } from '@/lib/utils'
import Navigation from '@/components/Navigation'

export default function SpotPage() {
  const params = useParams()
  const router = useRouter()
  const { walletAddress, currentSession, setCurrentSession } = useApp()
  const spotId = params.id as string
  
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentAmount, setCurrentAmount] = useState(0)
  const [duration, setDuration] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const confettiRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // For demo purposes, create a mock session
    const mockSession: Session = {
      id: `session-${Date.now()}`,
      walletAddress,
      spotId,
      parkingLotId: 'demo-lot-1',
      startTime: new Date().toISOString(),
      status: 'ACTIVE',
      currentAmount: 0
    }
    
    setSession(mockSession)
    setCurrentSession(mockSession)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [spotId, walletAddress, setCurrentSession])

  useEffect(() => {
    if (session?.status === 'ACTIVE') {
      intervalRef.current = setInterval(() => {
        const startTime = new Date(session.startTime)
        const now = new Date()
        const diffMs = now.getTime() - startTime.getTime()
        const diffSeconds = Math.floor(diffMs / 1000)
        
        setDuration(diffSeconds)
        setCurrentAmount((diffSeconds / 60) * 0.12) // Demo rate: 0.12 RLUSD per minute
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session])

  const handleStartSession = async () => {
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newSession: Session = {
        id: `session-${Date.now()}`,
        walletAddress,
        spotId,
        parkingLotId: 'demo-lot-1',
        startTime: new Date().toISOString(),
        status: 'ACTIVE',
        currentAmount: 0
      }
      
      setSession(newSession)
      setCurrentSession(newSession)
    } catch (error) {
      console.error('Error starting session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (!session) return
    
    setIsEnding(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const endedSession: Session = {
        ...session,
        endTime: new Date().toISOString(),
        totalAmount: currentAmount,
        status: 'ENDED',
        xrplTxHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      setSession(endedSession)
      setCurrentSession(null)
      
      // Trigger confetti
      setShowConfetti(true)
      triggerConfetti()
      
      // Redirect after animation
      setTimeout(() => {
        router.push('/wallet')
      }, 3000)
      
    } catch (error) {
      console.error('Error ending session:', error)
    } finally {
      setIsEnding(false)
    }
  }

  const triggerConfetti = () => {
    if (confettiRef.current) {
      const rect = confettiRef.current.getBoundingClientRect()
      confetti({
        particleCount: 100,
        spread: 70,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#ffffff']
      })
    }
  }

  const circumference = 2 * Math.PI * 90 // radius = 90
  const strokeDashoffset = circumference - (duration / 60) * circumference

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 pb-20">
      <canvas ref={confettiRef} className="fixed inset-0 pointer-events-none z-50" />
      
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-8"
      >
        <Link href="/map">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 glass rounded-xl"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </motion.button>
        </Link>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Spot #{spotId.split('-')[1]}</h1>
          <p className="text-gray-400">Main Street Parking</p>
        </div>
        
        <div className="w-12" /> {/* Spacer */}
      </motion.div>

      {/* Start/End Session Button - Top Middle */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center mb-8"
      >
        {session?.status === 'ACTIVE' ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEndSession}
            disabled={isEnding}
            className="btn-primary px-8 py-4 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isEnding ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Ending...
              </>
            ) : (
              <>
                <Square className="w-5 h-5" />
                End Session
              </>
            )}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartSession}
            disabled={isLoading}
            className="btn-primary px-8 py-4 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Session
              </>
            )}
          </motion.button>
        )}
      </motion.div>

      {/* Main timer card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="glass-card rounded-3xl p-8 mb-6"
      >
        {/* Timer circle */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
              fill="none"
            />
            
            {/* Progress circle */}
            <motion.circle
              cx="100"
              cy="100"
              r="90"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={duration}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-white mb-2">
                {formatDuration(duration)}
              </div>
              <div className="text-lg text-gray-400">Duration</div>
            </motion.div>
          </div>
        </div>

        {/* Amount display */}
        <motion.div
          key={currentAmount}
          initial={{ scale: 1.1, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-5xl font-bold gradient-text mb-2">
            {formatRLUSD(currentAmount)}
          </div>
          <div className="text-gray-400">Current Amount</div>
        </motion.div>
      </motion.div>

      {/* Session details */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Session Details</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={cn(
              "font-medium",
              session?.status === 'ACTIVE' ? "text-green-400" : "text-gray-400"
            )}>
              {session?.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Rate:</span>
            <span className="text-white font-medium">0.12 RLUSD/min</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Wallet:</span>
            <span className="text-white font-mono text-sm">
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-4)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* XRPL Transaction Info */}
      {session?.xrplTxHash && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Transaction Complete</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">XRPL Tx:</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm">
                  {session.xrplTxHash.slice(0, 12)}...
                </span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Final Amount:</span>
              <span className="text-white font-semibold">{formatRLUSD(session.totalAmount || 0)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="glass-card rounded-3xl p-8 text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
              <p className="text-gray-400">Payment processed via XRPL</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <Navigation />
    </div>
  )
}
