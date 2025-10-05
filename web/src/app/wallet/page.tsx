'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, TrendingUp, TrendingDown, Clock, MapPin, ExternalLink, DollarSign } from 'lucide-react'
import { apiService, Wallet, Transaction, Session } from '@/lib/api'
import { useApp } from '@/app/providers'
import { cn, formatRLUSD, formatTimeAgo } from '@/lib/utils'
import Navigation from '@/components/Navigation'
import { xrplService } from '@/lib/xrpl'

export default function WalletPage() {
  const { walletAddress } = useApp()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [isAddingFunds, setIsAddingFunds] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [sessionCount, setSessionCount] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [xrplAddress, setXRPLAddress] = useState('')
  const [xrplSecret, setXRPLSecret] = useState('')
  const [xrplConnected, setXRPLConnected] = useState(false)
  const [xrplBalance, setXRPLBalance] = useState(0)
  const [hasTrustline, setHasTrustline] = useState(false)

  useEffect(() => {
    loadWalletData()
    loadSessionCount()
    loadTotalSpent()
    autoConnectXRPL()
  }, [walletAddress])

  const autoConnectXRPL = async () => {
    // Auto-connect with hardcoded credentials
    const XRPL_ADDRESS = 'rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ'
    const XRPL_SECRET = 'sEdTCZaZYHZEQz3Ju5oUzG69Ujf5XTz'
    
    setXRPLAddress(XRPL_ADDRESS)
    setXRPLSecret(XRPL_SECRET)
    await connectToXRPL(XRPL_ADDRESS, XRPL_SECRET)
  }

  const connectToXRPL = async (address: string, secret: string) => {
    try {
      xrplService.importWallet(address, secret)
      setXRPLConnected(true)
      
      // Check if trustline exists
      let trustlineExists = await xrplService.checkRLUSDTrustline(address)
      
      // If no trustline, automatically set it up
      if (!trustlineExists) {
        console.log('🔧 No RLUSD trustline found. Setting up automatically...')
        const success = await xrplService.setupRLUSDTrustline()
        if (success) {
          console.log('✅ RLUSD trustline established!')
          trustlineExists = true
          setHasTrustline(true)
        } else {
          console.error('❌ Failed to setup trustline')
          return
        }
      } else {
        console.log('✅ RLUSD trustline already exists')
        setHasTrustline(true)
      }
      
      // Get RLUSD balance from ledger
      const balance = await xrplService.getRLUSDBalance(address)
      setXRPLBalance(balance)
      console.log(`💰 XRPL RLUSD Balance: ${balance}`)
      
      // Sync ledger balance to wallet display
      if (typeof window !== 'undefined') {
        localStorage.setItem('walletBalance', balance.toString())
        // Store XRPL credentials for later use (e.g., when ending parking sessions)
        localStorage.setItem('xrpl-address', address)
        localStorage.setItem('xrpl-secret', secret)
        console.log('💾 Saved XRPL credentials to localStorage')
        // Will update wallet state in loadWalletData
      }
      
      // Reload wallet data to reflect the synced balance
      await loadWalletData()
      
    } catch (error) {
      console.error('Error connecting to XRPL:', error)
    }
  }


  // Refresh session count and transactions when component becomes visible or page is focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadSessionCount()
        loadTotalSpent()
        loadWalletData() // Also refresh transactions
      }
    }

    const handleFocus = () => {
      loadSessionCount()
      loadTotalSpent()
      loadWalletData() // Also refresh transactions
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadSessionCount = () => {
    if (typeof window !== 'undefined') {
      const savedSessions = localStorage.getItem('parkpay-sessions')
      if (savedSessions) {
        try {
          const sessions: Session[] = JSON.parse(savedSessions)
          setSessionCount(sessions.length)
        } catch (e) {
          console.error('Error parsing sessions:', e)
          setSessionCount(0)
        }
      } else {
        setSessionCount(0)
      }
    }
  }

  const loadTotalSpent = () => {
    if (typeof window !== 'undefined') {
      const savedSessions = localStorage.getItem('parkpay-sessions')
      if (savedSessions) {
        try {
          const sessions: Session[] = JSON.parse(savedSessions)
          // Sum up all ended sessions
          const total = sessions
            .filter(session => session.status === 'ENDED')
            .reduce((sum, session) => sum + (session.totalAmount || 0), 0)
          setTotalSpent(total)
        } catch (e) {
          console.error('Error parsing sessions for total spent:', e)
          setTotalSpent(0)
        }
      } else {
        setTotalSpent(0)
      }
    }
  }

  const loadWalletData = async () => {
    try {
      setIsLoading(true)
      
      // Get balance from XRPL if connected, otherwise use localStorage
      let balance = 100.00 // Start with 100 RLUSD
      
      if (xrplConnected && hasTrustline) {
        // Get balance from XRPL
        try {
          balance = await xrplService.getRLUSDBalance(xrplAddress)
          setXRPLBalance(balance)
          // Update localStorage to match
          if (typeof window !== 'undefined') {
            localStorage.setItem('walletBalance', balance.toString())
          }
        } catch (error) {
          console.error('Error getting XRPL balance:', error)
        }
      } else if (typeof window !== 'undefined') {
        // Fallback to localStorage
        const savedBalance = localStorage.getItem('walletBalance')
        if (savedBalance) {
          balance = parseFloat(savedBalance)
        } else {
          localStorage.setItem('walletBalance', '100.00')
        }
      }
      
      // Get real sessions from localStorage and convert to transactions
      let recentTransactions: Transaction[] = []
      if (typeof window !== 'undefined') {
        const savedSessions = localStorage.getItem('parkpay-sessions')
        if (savedSessions) {
          try {
            const sessions: Session[] = JSON.parse(savedSessions)
            // Convert sessions to transactions (only ended sessions)
            recentTransactions = sessions
              .filter(session => session.status === 'ENDED')
              .slice(0, 5) // Get first 5 sessions
              .map(session => ({
                id: session.id,
                type: 'payment' as const,
                amount: session.totalAmount || 0,
                parkingLot: session.parkingGarage?.name || 'iPark-44 Elizabeth Street Parking Garage',
                spotNumber: parseInt(session.spotId.split('-')[1]) || 1,
                timestamp: session.endTime || session.startTime,
                xrplTxHash: session.xrplTxHash
              }))
          } catch (e) {
            console.error('Error parsing sessions for transactions:', e)
          }
        }
      }
      
      // If no real sessions, use some default transactions
      if (recentTransactions.length === 0) {
        recentTransactions = [
          {
            id: 'tx-default-1',
            type: 'payment',
            amount: 2.40,
            parkingLot: 'iPark-44 Elizabeth Street Parking Garage',
            spotNumber: 5,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            xrplTxHash: 'tx_1703123456_abc123def'
          },
          {
            id: 'tx-default-2',
            type: 'payment',
            amount: 1.80,
            parkingLot: 'iPark-44 Elizabeth Street Parking Garage',
            spotNumber: 12,
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            xrplTxHash: 'tx_1703123457_def456ghi'
          }
        ]
      }
      
      const wallet: Wallet = {
        address: walletAddress,
        rlusdBalance: balance,
        recentTransactions: recentTransactions
      }
      
      setWallet(wallet)
      setTransactions(recentTransactions)
    } catch (error) {
      console.error('Error loading wallet data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFunds = async (amount: number) => {
    setIsAddingFunds(true)
    
    try {
      console.log(`💰 Requesting ${amount} RLUSD from Genesis Bank...`)
      
      // Call issuer API to issue RLUSD
      const response = await fetch('http://localhost:4000/api/issuer/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAddress: walletAddress,
          amount: amount
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to issue RLUSD')
      }
      
      const result = await response.json()
      console.log('✅ RLUSD issued successfully:', result)
      console.log('📝 Transaction hash:', result.txHash)
      
      // Wait a moment for the blockchain to process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reload wallet data to sync with XRPL ledger
      await loadWalletData()
      
      setShowAddFunds(false)
      setCustomAmount('')
      
      alert(`✅ Successfully added ${amount} RLUSD to your wallet!\nTransaction: ${result.txHash}`)
    } catch (error) {
      console.error('❌ Error adding funds:', error)
      alert(`Failed to add funds: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsAddingFunds(false)
    }
  }

  const handleCustomAmount = () => {
    const amount = parseFloat(customAmount)
    if (amount > 0) {
      handleAddFunds(amount)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading wallet...</p>
        </motion.div>
      </div>
    )
  }

  if (!wallet) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
        <p className="text-gray-400">Manage your RLUSD balance</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-3xl p-8 mb-6 relative overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-purple-500/10 to-fuchsia-600/10" />
        
        <div className="relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-lg text-gray-400 mb-2">RLUSD Balance</h2>
            <motion.div
              key={wallet.rlusdBalance}
              initial={{ scale: 1.1, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold gradient-text mb-2"
            >
              {formatRLUSD(wallet.rlusdBalance)}
            </motion.div>
            <p className="text-gray-400">Available for parking</p>
          </div>

          {/* Animated balance bar */}
          <div className="relative h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((wallet.rlusdBalance / 50) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <div className="absolute inset-0 rlusd-flow" />
          </div>

          {/* Add funds button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddFunds(true)}
            className="w-full btn-primary py-4 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5" />
            Add Funds
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        <div className="glass-card rounded-2xl p-4 text-center">
          <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{sessionCount}</div>
          <div className="text-sm text-gray-400">Sessions</div>
        </div>
        
        <div className="glass-card rounded-2xl p-4 text-center">
          <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{formatRLUSD(totalSpent)}</div>
          <div className="text-sm text-gray-400">Total Spent</div>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Last 5 Transactions</h3>
        
        <div className="space-y-4">
          <AnimatePresence>
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 glass rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl",
                    tx.type === 'payment' 
                      ? "bg-red-400/20 text-red-400" 
                      : "bg-green-400/20 text-green-400"
                  )}>
                    {tx.type === 'payment' ? (
                      <TrendingDown className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div>
                    <div className="font-medium text-white">
                      {tx.parkingLot} - Spot #{tx.spotNumber}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(new Date(tx.timestamp))}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={cn(
                    "font-semibold",
                    tx.type === 'payment' ? "text-red-400" : "text-green-400"
                  )}>
                    {tx.type === 'payment' ? '-' : '+'}{formatRLUSD(tx.amount)}
                  </div>
                  
                  {tx.xrplTxHash && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <span className="font-mono">
                        {tx.xrplTxHash.slice(0, 8)}...
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Add Funds Modal */}
      <AnimatePresence>
        {showAddFunds && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddFunds(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card rounded-3xl p-8 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Add Funds</h3>
              
              {/* Custom Amount Input */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Custom Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCustomAmount}
                  disabled={isAddingFunds || !customAmount || parseFloat(customAmount) <= 0}
                  className="w-full mt-3 btn-primary py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {customAmount ? `$${customAmount}` : '$0.00'}
                </motion.button>
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3">Quick Add</div>
                <div className="grid grid-cols-2 gap-3">
                  {[10, 25, 50, 100].map((amount) => (
                    <motion.button
                      key={amount}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddFunds(amount)}
                      disabled={isAddingFunds}
                      className="btn-secondary py-3 rounded-xl font-semibold disabled:opacity-50"
                    >
                      ${amount}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-400">
                Funds will be added instantly via XRPL
              </div>
              
              {isAddingFunds && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-center"
                >
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-cyan-400 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-sm text-gray-400">Processing...</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Navigation */}
      <Navigation />
    </div>
  )
}
