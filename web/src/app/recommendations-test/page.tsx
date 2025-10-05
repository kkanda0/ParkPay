'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, CheckCircle, XCircle, AlertCircle, DollarSign, TrendingUp, Clock, Wallet } from 'lucide-react'
import { 
  getParkingCostOptimization, 
  getDynamicDemandForecast, 
  getSessionEfficiencyInsight, 
  getWalletHealthInsight 
} from '@/app/actions/recommendations'

export default function RecommendationsTestPage() {
  const [testResults, setTestResults] = useState<{
    unauthenticated: 'pending' | 'success' | 'error' | 'running'
    authenticated: 'pending' | 'success' | 'error' | 'running'
  }>({
    unauthenticated: 'pending',
    authenticated: 'pending'
  })
  const [results, setResults] = useState<{
    unauthenticated?: any
    authenticated?: any
  }>({})

  const testUnauthenticatedAccess = async () => {
    setTestResults(prev => ({ ...prev, unauthenticated: 'running' }))
    
    try {
      // Clear any existing token
      if (typeof window !== 'undefined') {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      }
      
      const result = await getParkingCostOptimization()
      
      if (result.error === 'Authentication required') {
        setTestResults(prev => ({ ...prev, unauthenticated: 'success' }))
        setResults(prev => ({ ...prev, unauthenticated: result }))
      } else {
        setTestResults(prev => ({ ...prev, unauthenticated: 'error' }))
        setResults(prev => ({ ...prev, unauthenticated: result }))
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, unauthenticated: 'error' }))
      setResults(prev => ({ 
        ...prev, 
        unauthenticated: { error: error instanceof Error ? error.message : 'Unknown error' }
      }))
    }
  }

  const testAuthenticatedAccess = async () => {
    setTestResults(prev => ({ ...prev, authenticated: 'running' }))
    
    try {
      // Set a mock token for testing
      if (typeof window !== 'undefined') {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpc3MiOiJodHRwczovL2FwaS5lY2hvLm1lcml0LnN5c3RlbXMiLCJhdWQiOiJwYXJrcGF5IiwiaWF0IjoxNzM2MDQ4MDAwLCJleHAiOjE3MzYwNTE2MDB9.mock-signature'
        document.cookie = `token=${mockToken}; path=/`
      }
      
      // Test all four server actions
      const [
        costResult,
        demandResult,
        efficiencyResult,
        walletResult
      ] = await Promise.all([
        getParkingCostOptimization(),
        getDynamicDemandForecast(),
        getSessionEfficiencyInsight(),
        getWalletHealthInsight()
      ])

      const allSuccessful = [costResult, demandResult, efficiencyResult, walletResult]
        .every(result => result.ok && result.data && typeof result.data === 'object')
      
      if (allSuccessful) {
        setTestResults(prev => ({ ...prev, authenticated: 'success' }))
        setResults(prev => ({ 
          ...prev, 
          authenticated: {
            costOptimization: costResult,
            demandForecast: demandResult,
            efficiencyInsight: efficiencyResult,
            walletHealth: walletResult
          }
        }))
      } else {
        setTestResults(prev => ({ ...prev, authenticated: 'error' }))
        setResults(prev => ({ 
          ...prev, 
          authenticated: {
            costOptimization: costResult,
            demandForecast: demandResult,
            efficiencyInsight: efficiencyResult,
            walletHealth: walletResult
          }
        }))
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, authenticated: 'error' }))
      setResults(prev => ({ 
        ...prev, 
        authenticated: { error: error instanceof Error ? error.message : 'Unknown error' }
      }))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-400" size={20} />
      case 'error':
        return <XCircle className="text-red-400" size={20} />
      case 'running':
        return <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-400 border-t-transparent" />
      default:
        return <AlertCircle className="text-gray-400" size={20} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Passed'
      case 'error':
        return 'Failed'
      case 'running':
        return 'Running...'
      default:
        return 'Pending'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center mb-4">
            <Sparkles className="text-cyan-400 mr-3" size={24} />
            <h1 className="text-2xl font-bold text-white">
              Recommendations Test Suite
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Test the four AI-powered recommendation sections with different authentication states
          </p>
        </div>

        {/* Test 1: Unauthenticated Access */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Test 1: Unauthenticated Access
              </h2>
              <p className="text-gray-400 text-sm">
                Should return authentication error when no token is present
              </p>
            </div>
            <div className="flex items-center">
              {getStatusIcon(testResults.unauthenticated)}
              <span className="ml-2 text-sm text-gray-300">
                {getStatusText(testResults.unauthenticated)}
              </span>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={testUnauthenticatedAccess}
            disabled={testResults.unauthenticated === 'running'}
            className="btn-primary w-full disabled:opacity-50"
          >
            {testResults.unauthenticated === 'running' ? 'Testing...' : 'Run Test'}
          </motion.button>

          {results.unauthenticated && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
              <pre className="text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(results.unauthenticated, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test 2: Authenticated Access */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Test 2: Authenticated Access
              </h2>
              <p className="text-gray-400 text-sm">
                Should return structured JSON for all four recommendation types
              </p>
            </div>
            <div className="flex items-center">
              {getStatusIcon(testResults.authenticated)}
              <span className="ml-2 text-sm text-gray-300">
                {getStatusText(testResults.authenticated)}
              </span>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={testAuthenticatedAccess}
            disabled={testResults.authenticated === 'running'}
            className="btn-primary w-full disabled:opacity-50"
          >
            {testResults.authenticated === 'running' ? 'Testing...' : 'Run Test'}
          </motion.button>

          {results.authenticated && (
            <div className="mt-4 space-y-4">
              {Object.entries(results.authenticated).map(([key, value]: [string, any]) => {
                const Icon = getRecommendationIcon(key)
                return (
                  <div key={key} className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Icon className="text-cyan-400 mr-2" size={16} />
                      <span className="text-sm font-medium text-white capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Test Summary */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Test Summary
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Unauthenticated Access</span>
              <div className="flex items-center">
                {getStatusIcon(testResults.unauthenticated)}
                <span className="ml-2 text-sm text-gray-300">
                  {getStatusText(testResults.unauthenticated)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Authenticated Access</span>
              <div className="flex items-center">
                {getStatusIcon(testResults.authenticated)}
                <span className="ml-2 text-sm text-gray-300">
                  {getStatusText(testResults.authenticated)}
                </span>
              </div>
            </div>
          </div>

          {testResults.unauthenticated === 'success' && testResults.authenticated === 'success' && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                <span className="text-green-400 font-medium">
                  All tests passed! Four-section recommendations feature is working correctly.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="glass-card rounded-2xl p-6 mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Manual Testing Instructions
          </h3>
          
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <strong className="text-white">1. Navigation Test:</strong>
              <p>Check that "Recommendations" appears in the bottom navigation between Wallet and Logout</p>
            </div>
            
            <div>
              <strong className="text-white">2. Authentication Test:</strong>
              <p>Visit /recommendations without being logged in - should show authentication error</p>
            </div>
            
            <div>
              <strong className="text-white">3. 2x2 Grid Layout:</strong>
              <p>Login and visit /recommendations - should show four cards in 2x2 grid:
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Top Left: Cost Optimization (DollarSign icon) - "Show Cheaper Spots"</li>
                  <li>• Top Right: Demand Forecast (TrendingUp icon) - "Reserve Early"</li>
                  <li>• Bottom Left: Session Efficiency (Clock icon) - "Enable Smart End"</li>
                  <li>• Bottom Right: Wallet Health (Wallet icon) - "Add Funds" or "Share Balance"</li>
                </ul>
              </p>
            </div>
            
            <div>
              <strong className="text-white">4. Dismissal Test:</strong>
              <p>Click the X button on any recommendation - should remove it from the list</p>
            </div>
            
            <div>
              <strong className="text-white">5. Specific CTA Actions:</strong>
              <p>Click recommendation buttons - should perform specific actions:
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• "Show Cheaper Spots" → Navigate to map with cheaper spots filter</li>
                  <li>• "Reserve Early" → Navigate to map with reservation mode</li>
                  <li>• "Enable Smart End" → Toggle smart end feature with confirmation</li>
                  <li>• "Add Funds" → Navigate to wallet with add funds mode</li>
                  <li>• "Share Balance" → Navigate to wallet with share balance mode</li>
                </ul>
              </p>
            </div>
            
            <div>
              <strong className="text-white">6. Real Data Analysis:</strong>
              <p>Each card should show specific insights based on user's actual parking data:
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Cost Optimization: Zone comparisons and savings percentages</li>
                  <li>• Demand Forecast: Time-based availability predictions</li>
                  <li>• Session Efficiency: Overstay/underuse patterns and savings</li>
                  <li>• Wallet Health: Spending trends and balance management</li>
                </ul>
              </p>
            </div>
            
            <div>
              <strong className="text-white">7. Score Display:</strong>
              <p>Each card should show a score (0-100) with color-coded background based on score value</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
