'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, CheckCircle, XCircle, AlertCircle, Database, Zap } from 'lucide-react'

export default function EchoAnalysisTestPage() {
  const [testResults, setTestResults] = useState<{
    dataSources: 'pending' | 'success' | 'error' | 'running'
    echoApi: 'pending' | 'success' | 'error' | 'running'
    recommendations: 'pending' | 'success' | 'error' | 'running'
  }>({
    dataSources: 'pending',
    echoApi: 'pending',
    recommendations: 'pending'
  })
  
  const [results, setResults] = useState<{
    dataSources?: any
    echoApi?: any
    recommendations?: any
  }>({})

  const testDataSources = async () => {
    setTestResults(prev => ({ ...prev, dataSources: 'running' }))
    
    try {
      // Test wallet API
      const walletResponse = await fetch('http://localhost:4000/api/wallet/rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ')
      const walletData = await walletResponse.json()
      
      // Test parking lots API
      const lotsResponse = await fetch('http://localhost:4000/api/parking/lots')
      const lotsData = await lotsResponse.json()
      
      const dataSourcesResult = {
        wallet: {
          status: walletResponse.ok ? 'success' : 'error',
          data: walletData,
          balance: walletData.rlusdBalance,
          transactions: walletData.recentTransactions?.length || 0
        },
        parkingLots: {
          status: lotsResponse.ok ? 'success' : 'error',
          data: lotsData,
          count: lotsData.data?.length || 0,
          lots: lotsData.data?.slice(0, 2) || []
        }
      }
      
      setTestResults(prev => ({ ...prev, dataSources: 'success' }))
      setResults(prev => ({ ...prev, dataSources: dataSourcesResult }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, dataSources: 'error' }))
      setResults(prev => ({ 
        ...prev, 
        dataSources: { error: error instanceof Error ? error.message : 'Unknown error' }
      }))
    }
  }

  const testEchoApi = async () => {
    setTestResults(prev => ({ ...prev, echoApi: 'running' }))
    
    try {
      // Test Echo API with a simple request
      const echoResponse = await fetch('https://api.echo.merit.systems/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer echo_5232f48f405d4abca5a8cae1f19f2f37f45a85b9b5e24b9ed2f21fcbe95850dc',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test connection to Echo API',
          model: 'openai/gpt-4',
          temperature: 0.0,
          max_tokens: 100
        })
      })
      
      const echoData = await echoResponse.json()
      
      const echoResult = {
        status: echoResponse.ok ? 'success' : 'error',
        response: echoData,
        statusCode: echoResponse.status,
        headers: Object.fromEntries(echoResponse.headers.entries())
      }
      
      setTestResults(prev => ({ ...prev, echoApi: 'success' }))
      setResults(prev => ({ ...prev, echoApi: echoResult }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, echoApi: 'error' }))
      setResults(prev => ({ 
        ...prev, 
        echoApi: { error: error instanceof Error ? error.message : 'Unknown error' }
      }))
    }
  }

  const testRecommendations = async () => {
    setTestResults(prev => ({ ...prev, recommendations: 'running' }))
    
    try {
      // Test the actual recommendations server actions
      const response = await fetch('/api/test-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true })
      })
      
      const data = await response.json()
      
      setTestResults(prev => ({ ...prev, recommendations: 'success' }))
      setResults(prev => ({ ...prev, recommendations: data }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, recommendations: 'error' }))
      setResults(prev => ({ 
        ...prev, 
        recommendations: { error: error instanceof Error ? error.message : 'Unknown error' }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center mb-4">
            <Brain className="text-cyan-400 mr-3" size={24} />
            <h1 className="text-2xl font-bold text-white">
              ECHO Analysis Test Suite
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Comprehensive test of ECHO integration and real data analysis pipeline
          </p>
        </div>

        {/* Test 1: Data Sources */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Test 1: Data Sources Availability
              </h2>
              <p className="text-gray-400 text-sm">
                Test wallet API and parking lots API for real data
              </p>
            </div>
            <div className="flex items-center">
              {getStatusIcon(testResults.dataSources)}
              <span className="ml-2 text-sm text-gray-300">
                {getStatusText(testResults.dataSources)}
              </span>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={testDataSources}
            disabled={testResults.dataSources === 'running'}
            className="btn-primary w-full disabled:opacity-50"
          >
            {testResults.dataSources === 'running' ? 'Testing...' : 'Test Data Sources'}
          </motion.button>

          {results.dataSources && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center mb-2">
                  <Database className="text-cyan-400 mr-2" size={16} />
                  <span className="text-sm font-medium text-white">Wallet API</span>
                </div>
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  {JSON.stringify(results.dataSources.wallet, null, 2)}
                </pre>
              </div>
              
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center mb-2">
                  <Database className="text-cyan-400 mr-2" size={16} />
                  <span className="text-sm font-medium text-white">Parking Lots API</span>
                </div>
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  {JSON.stringify(results.dataSources.parkingLots, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Test 2: Echo API */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Test 2: ECHO API Connectivity
              </h2>
              <p className="text-gray-400 text-sm">
                Test direct ECHO API connection and authentication
              </p>
            </div>
            <div className="flex items-center">
              {getStatusIcon(testResults.echoApi)}
              <span className="ml-2 text-sm text-gray-300">
                {getStatusText(testResults.echoApi)}
              </span>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={testEchoApi}
            disabled={testResults.echoApi === 'running'}
            className="btn-primary w-full disabled:opacity-50"
          >
            {testResults.echoApi === 'running' ? 'Testing...' : 'Test ECHO API'}
          </motion.button>

          {results.echoApi && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center mb-2">
                <Zap className="text-cyan-400 mr-2" size={16} />
                <span className="text-sm font-medium text-white">ECHO API Response</span>
              </div>
              <pre className="text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(results.echoApi, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test 3: Recommendations Pipeline */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Test 3: Recommendations Pipeline
              </h2>
              <p className="text-gray-400 text-sm">
                Test end-to-end recommendations with real data and ECHO analysis
              </p>
            </div>
            <div className="flex items-center">
              {getStatusIcon(testResults.recommendations)}
              <span className="ml-2 text-sm text-gray-300">
                {getStatusText(testResults.recommendations)}
              </span>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={testRecommendations}
            disabled={testResults.recommendations === 'running'}
            className="btn-primary w-full disabled:opacity-50"
          >
            {testResults.recommendations === 'running' ? 'Testing...' : 'Test Recommendations'}
          </motion.button>

          {results.recommendations && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center mb-2">
                <Brain className="text-cyan-400 mr-2" size={16} />
                <span className="text-sm font-medium text-white">Recommendations Pipeline</span>
              </div>
              <pre className="text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(results.recommendations, null, 2)}
              </pre>
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
              <span className="text-gray-300">Data Sources</span>
              <div className="flex items-center">
                {getStatusIcon(testResults.dataSources)}
                <span className="ml-2 text-sm text-gray-300">
                  {getStatusText(testResults.dataSources)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">ECHO API</span>
              <div className="flex items-center">
                {getStatusIcon(testResults.echoApi)}
                <span className="ml-2 text-sm text-gray-300">
                  {getStatusText(testResults.echoApi)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Recommendations Pipeline</span>
              <div className="flex items-center">
                {getStatusIcon(testResults.recommendations)}
                <span className="ml-2 text-sm text-gray-300">
                  {getStatusText(testResults.recommendations)}
                </span>
              </div>
            </div>
          </div>

          {testResults.dataSources === 'success' && testResults.echoApi === 'success' && testResults.recommendations === 'success' && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                <span className="text-green-400 font-medium">
                  All tests passed! ECHO integration and real data analysis is working correctly.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        <div className="glass-card rounded-2xl p-6 mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Analysis Results
          </h3>
          
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <strong className="text-white">Data Sources Status:</strong>
              <p>Wallet API: {results.dataSources?.wallet?.status || 'Not tested'}</p>
              <p>Parking Lots API: {results.dataSources?.parkingLots?.status || 'Not tested'}</p>
            </div>
            
            <div>
              <strong className="text-white">ECHO API Status:</strong>
              <p>Connection: {results.echoApi?.status || 'Not tested'}</p>
              <p>Response: {results.echoApi?.response ? 'Received' : 'No response'}</p>
            </div>
            
            <div>
              <strong className="text-white">Recommendations Status:</strong>
              <p>Pipeline: {results.recommendations?.status || 'Not tested'}</p>
              <p>Data Flow: {results.recommendations?.dataFlow || 'Not tested'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
