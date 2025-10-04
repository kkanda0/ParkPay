'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, TrendingUp, TrendingDown, Clock, MapPin, ExternalLink } from 'lucide-react'
import { apiService, Wallet, Transaction } from '@/lib/api'
import { useApp } from '@/app/providers'
import { cn, formatRLUSD, formatTimeAgo } from '@/lib/utils'
import Navigation from '@/components/Navigation'

export default function WalletPage() {
  const { walletAddress } = useApp()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [isAddingFunds, setIsAddingFunds] = useState(false)

  useEffect(() => {
    loadWalletData()
  }, [walletAddress])

  const loadWalletData = async () => {
    try {
      setIsLoading(true)
      
      // For demo purposes, use mock data
      const mockWallet: Wallet = {
        address: walletAddress,
        rlusdBalance: 25.50,
        recentTransactions: [
          {
            id: 'tx-1',
            type: 'payment',
            amount: 2.40,
            parkingLot: 'Main Street Parking',
            spotNumber: 5,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            xrplTxHash: 'tx_1703123456_abc123def'
          },
          {
            id: 'tx-2',
            type: 'payment',
            amount: 1.80,
            parkingLot: 'Main Street Parking',
            spotNumber: 12,
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            xrplTxHash: 'tx_1703123457_def456ghi'
          },
          {
            id: 'tx-3',
            type: 'active',
            amount: 0.36,
            parkingLot: 'Main Street Parking',
            spotNumber: 8,
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
          }
        ]
      }
      
      setWallet(mockWallet)
      setTransactions(mockWallet.recentTransactions)
    } catch (error) {
      console.error('Error loading wallet data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFunds = async (amount: number) => {
    setIsAddingFunds(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (wallet) {
        setWallet({
          ...wallet,
          rlusdBalance: wallet.rlusdBalance + amount
        })
      }
      
      setShowAddFunds(false)
    } catch (error) {
      console.error('Error adding funds:', error)
    } finally {
      setIsAddingFunds(false)
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
          <div className="text-2xl font-bold text-white">12</div>
          <div className="text-sm text-gray-400">Sessions</div>
        </div>
        
        <div className="glass-card rounded-2xl p-4 text-center">
          <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">$8.40</div>
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
        <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
        
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
              
              <div className="grid grid-cols-2 gap-3 mb-6">
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
