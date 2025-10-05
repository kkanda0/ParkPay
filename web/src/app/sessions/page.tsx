'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, MapPin, DollarSign, ExternalLink, ArrowLeft, Square, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { apiService, Session } from '@/lib/api'
import { useApp } from '@/app/providers'
import { formatRLUSD, formatDuration } from '@/lib/utils'
import { xrplService } from '@/lib/xrpl'

export default function SessionsPage() {
  const { walletAddress, currentSession, setCurrentSession } = useApp()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEnding, setIsEnding] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [sessionAmount, setSessionAmount] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [finalSessionData, setFinalSessionData] = useState<{duration: number, amount: number} | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadSessions = async () => {
      try {
        // Check if we have saved sessions in localStorage
        if (typeof window !== 'undefined') {
          const savedSessions = localStorage.getItem('parkpay-sessions')
          if (savedSessions) {
            const parsedSessions = JSON.parse(savedSessions)
            // Remove duplicates by ID (keep the first occurrence)
            const uniqueSessions = parsedSessions.reduce((acc: Session[], current: Session) => {
              const exists = acc.find((s: Session) => s.id === current.id)
              if (!exists) {
                acc.push(current)
              }
              return acc
            }, [])
            // Sort sessions by end time (most recent first)
            const sortedSessions = uniqueSessions.sort((a: Session, b: Session) => {
              const timeA = new Date(a.endTime || a.startTime).getTime()
              const timeB = new Date(b.endTime || b.startTime).getTime()
              return timeB - timeA // Most recent first
            })
            console.log('Loading sessions from localStorage:', sortedSessions.length, 'sessions')
            console.log('Sessions order:', sortedSessions.map((s: Session) => ({ 
              id: s.id, 
              endTime: s.endTime, 
              spotId: s.spotId 
            })))
            setSessions(sortedSessions)
          } else {
            // Only load the hardcoded sessions if we don't have any saved sessions
            const mockSessions: Session[] = [
              {
                id: 'session-1',
                walletAddress: 'demo-wallet-address',
                spotId: 'spot-1',
                parkingLotId: 'demo-lot-1',
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                status: 'ENDED',
                totalAmount: 7.20,
                xrplTxHash: 'tx_abc123def456'
              },
              {
                id: 'session-2',
                walletAddress: 'demo-wallet-address',
                spotId: 'spot-3',
                parkingLotId: 'demo-lot-1',
                startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                status: 'ENDED',
                totalAmount: 2.40,
                xrplTxHash: 'tx_xyz789uvw012'
              }
            ]

            setSessions(mockSessions)
            // Save the initial sessions to localStorage
            localStorage.setItem('parkpay-sessions', JSON.stringify(mockSessions))
          }
        }
      } catch (error) {
        console.error('Error loading sessions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Only load once on mount - NO DEPENDENCIES
    loadSessions()
  }, []) // Empty dependency array - runs only once on mount

  // Update session timer when there's an active session
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'ACTIVE') {
      setSessionDuration(0)
      setSessionAmount(0)
      return
    }

    // Calculate initial values immediately
    const updateTimer = () => {
      const startTime = new Date(currentSession.startTime)
      const now = new Date()
      const diffMs = now.getTime() - startTime.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      
      setSessionDuration(diffSeconds)
      setSessionAmount((diffSeconds / 60) * 0.12) // Demo rate: 0.12 RLUSD per minute
    }

    // Update immediately on mount
    updateTimer()

    // Then update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [currentSession])

  const getSessionDuration = (session: Session) => {
    const start = new Date(session.startTime)
    const end = session.endTime ? new Date(session.endTime) : new Date()
    const diffMs = end.getTime() - start.getTime()
    return Math.ceil(diffMs / 1000)
  }

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400'
      case 'ENDED':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  const getSessionStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active'
      case 'ENDED':
        return 'Completed'
      default:
        return 'Unknown'
    }
  }

  const handleEndSession = async () => {
    if (!currentSession) return
    
    setIsEnding(true)
    
    try {
      // Calculate the final values
      const startTime = new Date(currentSession.startTime)
      const endTime = new Date()
      const diffMs = endTime.getTime() - startTime.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      const calculatedAmount = (diffSeconds / 60) * 0.12
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const endedSession: Session = {
        ...currentSession,
        endTime: endTime.toISOString(),
        totalAmount: calculatedAmount,
        status: 'ENDED',
        xrplTxHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      // Add to sessions list and sort by end time (most recent first)
      setSessions(prevSessions => {
        const updatedSessions = [endedSession, ...prevSessions]
        // Remove duplicates by ID (keep the first occurrence)
        const uniqueSessions = updatedSessions.reduce((acc: Session[], current: Session) => {
          const exists = acc.find((s: Session) => s.id === current.id)
          if (!exists) {
            acc.push(current)
          }
          return acc
        }, [])
        // Sort sessions by end time (most recent first)
        const sortedSessions = uniqueSessions.sort((a: Session, b: Session) => {
          const timeA = new Date(a.endTime || a.startTime).getTime()
          const timeB = new Date(b.endTime || b.startTime).getTime()
          return timeB - timeA // Most recent first
        })
        console.log('Adding new session:', endedSession.id, 'endTime:', endedSession.endTime)
        console.log('Total sessions:', sortedSessions.length)
        console.log('Sessions order after adding:', sortedSessions.map((s: Session) => ({ 
          id: s.id, 
          endTime: s.endTime, 
          spotId: s.spotId 
        })))
        // Save to localStorage so it persists
        if (typeof window !== 'undefined') {
          localStorage.setItem('parkpay-sessions', JSON.stringify(sortedSessions))
        }
        return sortedSessions
      })
      
      // Store the final values for the popup
      setFinalSessionData({
        duration: diffSeconds,
        amount: calculatedAmount
      })
      
      // Show confetti
      setShowConfetti(true)
      
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      
      // Deduct amount from wallet balance and XRPL if connected
      if (typeof window !== 'undefined') {
        const currentBalance = localStorage.getItem('walletBalance')
        if (currentBalance) {
          const newBalance = parseFloat(currentBalance) - calculatedAmount
          localStorage.setItem('walletBalance', Math.max(0, newBalance).toString())
        }

        // Also deduct from XRPL if wallet is connected
        const xrplAddress = localStorage.getItem('xrpl-address')
        const xrplSecret = localStorage.getItem('xrpl-secret')
        
        console.log('🔍 Checking XRPL credentials:', {
          hasAddress: !!xrplAddress,
          hasSecret: !!xrplSecret,
          address: xrplAddress
        })
        
        if (xrplAddress && xrplSecret) {
          try {
            console.log('💳 Attempting to send RLUSD payment to Genesis Bank...')
            // Import wallet and check trustline
            xrplService.importWallet(xrplAddress, xrplSecret)
            const hasTrustline = await xrplService.checkRLUSDTrustline(xrplAddress)
            
            console.log('🔗 Trustline status:', hasTrustline)
            
            if (hasTrustline) {
              // Send RLUSD back to Genesis Bank (ParkPay's parking service fee)
              const GENESIS_BANK = 'rsYrh38VnK3GkKD2EscXtFhiZmbC9Y62ZL' // ParkPay Genesis Bank
              console.log(`💸 Sending ${calculatedAmount} RLUSD to Genesis Bank...`)
              const success = await xrplService.sendRLUSD(GENESIS_BANK, calculatedAmount)
              if (success) {
                console.log(`✅ Paid ${calculatedAmount} RLUSD parking fee to Genesis Bank`)
              } else {
                console.error('❌ Payment failed')
              }
            } else {
              console.warn('⚠️ No trustline found - cannot send payment')
            }
          } catch (error) {
            console.error('❌ Error deducting from XRPL:', error)
            // Continue anyway - localStorage balance is already deducted
          }
        } else {
          console.warn('⚠️ XRPL credentials not found in localStorage - skipping blockchain payment')
        }
      }
      
      // Clear current session
      setCurrentSession(null)
      
      // Hide confetti popup after 3 seconds
      setTimeout(() => {
        setShowConfetti(false)
        setFinalSessionData(null)
      }, 3000)
      
    } catch (error) {
      console.error('Error ending session:', error)
    } finally {
      setIsEnding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 pb-20">
      {/* Confetti Success Popup */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative glass-card rounded-2xl p-8 text-center max-w-sm mx-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-2">Session Ended!</h3>
              <p className="text-gray-300 mb-4">
                RLUSD payment sent to Genesis Bank successfully
              </p>
              
              <div className="text-sm text-gray-400">
                <div className="flex justify-between mb-1">
                  <span>Duration:</span>
                  <span className="text-white">{formatDuration(finalSessionData?.duration || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid:</span>
                  <span className="text-white font-semibold">{formatRLUSD(finalSessionData?.amount || 0)}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
          <h1 className="text-2xl font-bold text-white">Sessions</h1>
          <p className="text-gray-400">Your parking history</p>
        </div>
        
        {currentSession && currentSession.status === 'ACTIVE' ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEndSession}
            disabled={isEnding}
            className="p-3 glass rounded-xl bg-red-500/20 border border-red-500/30 disabled:opacity-50"
          >
            {isEnding ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Square className="w-6 h-6 text-red-400" />
            )}
          </motion.button>
        ) : (
          <div className="w-12" />
        )}
      </motion.div>

      {currentSession && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 mb-6 border border-green-400/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <h3 className="text-lg font-semibold text-white">Current Session</h3>
            </div>
            
            {/* Stop Session Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEndSession}
              disabled={isEnding}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
            >
              {isEnding ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"
                />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Stop Session</span>
            </motion.button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatDuration(sessionDuration)}
              </div>
              <div className="text-sm text-gray-400">Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold gradient-text mb-1">
                {formatRLUSD(sessionAmount)}
              </div>
              <div className="text-sm text-gray-400">Amount</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-sm">
              <div className="text-gray-400 mb-1">Parking Garage:</div>
              <div className="text-white font-medium">
                {currentSession.parkingGarage?.name || 'iPark-44 Elizabeth Street Parking Garage'}
              </div>
              <div className="text-gray-300 text-xs mt-1">
                {currentSession.parkingGarage?.address || '44 Elizabeth Street, New York, NY 10013'}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Session History</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Sessions Yet</h3>
            <p className="text-gray-400">Start your first parking session to see it here</p>
          </div>
        ) : (
          sessions
            .filter(session => session.status === 'ENDED')
            .map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-white font-medium">
                        {session.parkingGarage?.name || 'iPark-44 Elizabeth Street Parking Garage'}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {session.parkingGarage?.address || '44 Elizabeth Street, New York, NY 10013'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${getSessionStatusColor(session.status)}`}>
                    {getSessionStatusText(session.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-lg font-bold text-white">
                      {formatDuration(getSessionDuration(session))}
                    </div>
                    <div className="text-sm text-gray-400">Duration</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold gradient-text">
                      {formatRLUSD(session.totalAmount || 0)}
                    </div>
                    <div className="text-sm text-gray-400">Total</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      {new Date(session.startTime).toLocaleDateString()} at{' '}
                      {new Date(session.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    {session.xrplTxHash && (
                      <button className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">View Tx</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
        )}
      </motion.div>
    </div>
  )
}
