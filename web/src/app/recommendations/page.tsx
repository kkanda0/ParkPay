'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, MapPin, Wallet, Clock, TrendingUp, DollarSign, ChevronRight, ExternalLink, Home, Car, CreditCard, Settings, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { 
  getParkingCostOptimization, 
  getDynamicDemandForecast, 
  getSessionEfficiencyInsight, 
  getWalletHealthInsight,
  RecommendationCard 
} from '@/app/actions/recommendations'
import { useApp } from '@/app/providers'

interface RecommendationState {
  data: RecommendationCard | null
  loading: boolean
  error: string | null
}

export default function RecommendationsPage() {
  const router = useRouter()
  const { walletAddress } = useApp()
  
  const [recommendations, setRecommendations] = useState<{
    costOptimization: RecommendationState
    demandForecast: RecommendationState
    efficiencyInsight: RecommendationState
    walletHealth: RecommendationState
  }>({
    costOptimization: { data: null, loading: false, error: null },
    demandForecast: { data: null, loading: false, error: null },
    efficiencyInsight: { data: null, loading: false, error: null },
    walletHealth: { data: null, loading: false, error: null }
  })
  
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAllRecommendations()
  }, [])

  const loadAllRecommendations = async () => {
    setIsLoading(true)
    
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000) // 5 second timeout
      })
      
      // Fetch all recommendations in parallel with timeout
      const recommendationsPromise = Promise.all([
        getParkingCostOptimization(),
        getDynamicDemandForecast(),
        getSessionEfficiencyInsight(),
        getWalletHealthInsight()
      ])
      
      const [
        costResult,
        demandResult,
        efficiencyResult,
        walletResult
      ] = await Promise.race([recommendationsPromise, timeoutPromise]) as any[]

      setRecommendations({
        costOptimization: {
          data: costResult.ok ? costResult.data || null : null,
          loading: false,
          error: costResult.error || null
        },
        demandForecast: {
          data: demandResult.ok ? demandResult.data || null : null,
          loading: false,
          error: demandResult.error || null
        },
        efficiencyInsight: {
          data: efficiencyResult.ok ? efficiencyResult.data || null : null,
          loading: false,
          error: efficiencyResult.error || null
        },
        walletHealth: {
          data: walletResult.ok ? walletResult.data || null : null,
          loading: false,
          error: walletResult.error || null
        }
      })
    } catch (error) {
      console.error('Error loading recommendations:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      })
      // Set error state for all recommendations
      setRecommendations({
        costOptimization: { data: null, loading: false, error: `Failed to load recommendations: ${error instanceof Error ? error.message : 'Unknown error'}` },
        demandForecast: { data: null, loading: false, error: `Failed to load recommendations: ${error instanceof Error ? error.message : 'Unknown error'}` },
        efficiencyInsight: { data: null, loading: false, error: `Failed to load recommendations: ${error instanceof Error ? error.message : 'Unknown error'}` },
        walletHealth: { data: null, loading: false, error: `Failed to load recommendations: ${error instanceof Error ? error.message : 'Unknown error'}` }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = async (recommendationId: string) => {
    try {
      // Add to dismissed set immediately for UI feedback
      setDismissedIds(prev => new Set([...prev, recommendationId]))
      
      // Call dismiss API
      await fetch('/api/recommendations/dismiss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recommendationId })
      })
      
      // Remove from recommendations
      setRecommendations(prev => {
        const newState = { ...prev }
        Object.keys(newState).forEach(key => {
          const rec = newState[key as keyof typeof newState]
          if (rec.data?.id === recommendationId) {
            newState[key as keyof typeof newState] = { ...rec, data: null }
          }
        })
        return newState
      })
    } catch (error) {
      console.error('Error dismissing recommendation:', error)
      // Revert the dismissed state on error
      setDismissedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(recommendationId)
        return newSet
      })
    }
  }

  const handleRecommendationClick = (recommendation: RecommendationCard) => {
    switch (recommendation.ctaType) {
      case 'navigate':
        if (recommendation.meta && 'url' in recommendation.meta) {
          router.push(recommendation.meta.url as string)
        }
        break
      case 'action':
        // Handle specific actions based on recommendation meta
        if (recommendation.meta && 'action' in recommendation.meta) {
          const action = recommendation.meta.action as string
          switch (action) {
            case 'findCheaperSpots':
              // Show cheaper spots modal or navigate to map with filters
              console.log('Finding cheaper spots:', recommendation.meta)
              router.push('/map?filter=cheaper')
              break
            case 'reserveEarly':
              // Show reservation modal or navigate to booking
              console.log('Reserving early:', recommendation.meta)
              router.push('/map?reserve=true')
              break
            default:
              console.log('Action triggered:', recommendation)
          }
        }
        break
      case 'toggle':
        // Handle toggle actions (like enabling smart end)
        if (recommendation.meta && 'action' in recommendation.meta) {
          const action = recommendation.meta.action as string
          switch (action) {
            case 'enableSmartEnd':
              // Toggle smart end feature
              console.log('Enabling smart end:', recommendation.meta)
              // TODO: Implement smart end toggle API call
              alert(`Smart End enabled! You'll save ${recommendation.meta.savings} weekly.`)
              break
            default:
              console.log('Toggle triggered:', recommendation)
          }
        }
        break
      case 'payment':
        // Handle payment actions (add funds, share balance)
        if (recommendation.meta && 'action' in recommendation.meta) {
          const action = recommendation.meta.action as string
          switch (action) {
            case 'addFunds':
              router.push('/wallet?action=addFunds')
              break
            case 'shareBalance':
              router.push('/wallet?action=shareBalance')
              break
            default:
              router.push('/wallet')
          }
        } else {
          router.push('/wallet')
        }
        break
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'costOptimization':
        return DollarSign
      case 'demandForecast':
        return TrendingUp
      case 'efficiencyInsight':
        return Clock
      case 'walletHealth':
        return Wallet
      default:
        return Sparkles
    }
  }


  const renderRecommendationCard = (
    type: string,
    title: string,
    state: RecommendationState,
    index: number
  ) => {
    const Icon = getRecommendationIcon(type)
    
    if (state.loading) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card rounded-2xl p-8 mb-6 min-h-[400px]"
        >
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg p-3 mr-4">
              <Icon className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-700 rounded w-full animate-pulse"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4 animate-pulse"></div>
          </div>
        </motion.div>
      )
    }

    if (state.error || !state.data || dismissedIds.has(state.data.id)) {
      return null
    }

    const recommendation = state.data
    
    return (
      <motion.div
        key={recommendation.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.1 }}
        className="glass-card rounded-2xl p-8 mb-6 min-h-[400px]"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg p-3 mr-4">
              <Icon className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-xl mb-1">
                {recommendation.title}
              </h3>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleDismiss(recommendation.id)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </motion.button>
        </div>
        
        <p className="text-gray-300 text-lg mb-4">
          {recommendation.summary}
        </p>
        
        <p className="text-gray-400 text-base mb-6 whitespace-pre-line leading-relaxed">
          {recommendation.reason}
        </p>
        
        {recommendation.cta && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRecommendationClick(recommendation)}
            className="w-full bg-gradient-to-r from-cyan-400/20 to-purple-500/20 border border-cyan-400/30 rounded-xl p-3 flex items-center justify-between text-white hover:from-cyan-400/30 hover:to-purple-500/30 transition-all"
          >
            <span className="text-sm font-medium">
              {recommendation.cta}
            </span>
            {recommendation.ctaType === 'navigate' ? (
              <ChevronRight size={16} />
            ) : recommendation.ctaType === 'payment' ? (
              <Wallet size={16} />
            ) : recommendation.ctaType === 'toggle' ? (
              <div className="w-4 h-4 rounded-full bg-green-400"></div>
            ) : (
              <ExternalLink size={16} />
            )}
          </motion.button>
        )}
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4 pb-20">
        <div className="max-w-md mx-auto pt-20">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent"></div>
            </div>
            <h1 className="text-xl font-bold text-white text-center mb-2">
              Loading Recommendations
            </h1>
            <p className="text-gray-400 text-center text-sm">
              Analyzing your parking patterns...
            </p>
          </div>
        </div>
        
        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl px-6 py-3 border border-gray-700/50">
            <div className="flex items-center justify-center gap-8">
              {/* Sessions */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/sessions')}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <Clock size={20} />
                <span className="text-xs font-medium">Sessions</span>
              </motion.button>

              {/* Map */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/map')}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <MapPin size={20} />
                <span className="text-xs font-medium">Map</span>
              </motion.button>

              {/* Wallet */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/wallet')}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <Wallet size={20} />
                <span className="text-xs font-medium">Wallet</span>
              </motion.button>

              {/* Recommendations - Active */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex flex-col items-center gap-1"
              >
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full"></div>
                <div className="bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl p-2">
                  <Sparkles size={20} className="text-white" />
                </div>
                <span className="text-xs font-medium text-white">Recommendations</span>
              </motion.button>

              {/* Logout */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut size={20} />
                <span className="text-xs font-medium">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if all recommendations have errors (authentication issue)
  const hasAuthError = Object.values(recommendations).some(rec => rec.error === 'Authentication required')
  
  if (hasAuthError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4 pb-20">
        <div className="max-w-md mx-auto pt-20">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-white mb-2">
                Authentication Required
              </h1>
              <p className="text-gray-400 text-sm mb-6">
                Please log in to view personalized recommendations
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
                className="btn-primary w-full"
              >
                Go to Home
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl px-6 py-3 border border-gray-700/50">
            <div className="flex items-center justify-center gap-8">
              {/* Sessions */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/sessions')}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <Clock size={20} />
                <span className="text-xs font-medium">Sessions</span>
              </motion.button>

              {/* Map */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/map')}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <MapPin size={20} />
                <span className="text-xs font-medium">Map</span>
              </motion.button>

              {/* Wallet */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/wallet')}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <Wallet size={20} />
                <span className="text-xs font-medium">Wallet</span>
              </motion.button>

              {/* Recommendations - Active */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex flex-col items-center gap-1"
              >
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full"></div>
                <div className="bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl p-2">
                  <Sparkles size={20} className="text-white" />
                </div>
                <span className="text-xs font-medium text-white">Recommendations</span>
              </motion.button>

              {/* Logout */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut size={20} />
                <span className="text-xs font-medium">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6 pb-20">
      <div className="max-w-7xl mx-auto pt-20">
        {/* Header */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Sparkles className="text-cyan-400 mr-4" size={32} />
              <h1 className="text-3xl font-bold text-white">
                AI Recommendations
              </h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadAllRecommendations}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Sparkles size={24} />
            </motion.button>
          </div>
          <p className="text-gray-400 text-lg">
            Personalized insights powered by Echo AI analysis of your real parking patterns
          </p>
        </div>

        {/* 2x2 Grid Layout - Larger */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Left - Cost Optimization */}
          <AnimatePresence>
            {renderRecommendationCard('costOptimization', 'Cost Optimization', recommendations.costOptimization, 0)}
          </AnimatePresence>
          
          {/* Top Right - Demand Forecast */}
          <AnimatePresence>
            {renderRecommendationCard('demandForecast', 'Demand Forecast', recommendations.demandForecast, 1)}
          </AnimatePresence>
          
          {/* Bottom Left - Session Efficiency */}
          <AnimatePresence>
            {renderRecommendationCard('efficiencyInsight', 'Session Efficiency', recommendations.efficiencyInsight, 2)}
          </AnimatePresence>
          
          {/* Bottom Right - Wallet Health */}
          <AnimatePresence>
            {renderRecommendationCard('walletHealth', 'Wallet Health', recommendations.walletHealth, 3)}
          </AnimatePresence>
        </div>

      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl px-6 py-3 border border-gray-700/50">
          <div className="flex items-center justify-center gap-8">
            {/* Sessions */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/sessions')}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <Clock size={20} />
              <span className="text-xs font-medium">Sessions</span>
            </motion.button>

            {/* Map */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/map')}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <MapPin size={20} />
              <span className="text-xs font-medium">Map</span>
            </motion.button>

            {/* Wallet */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/wallet')}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <Wallet size={20} />
              <span className="text-xs font-medium">Wallet</span>
            </motion.button>

            {/* Recommendations - Active */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex flex-col items-center gap-1"
            >
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full"></div>
              <div className="bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl p-2">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="text-xs font-medium text-white">Recommendations</span>
            </motion.button>

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span className="text-xs font-medium">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
