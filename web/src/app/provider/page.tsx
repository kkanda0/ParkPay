'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Users, AlertTriangle, CheckCircle, Settings, DollarSign, Car, Clock } from 'lucide-react'
import { apiService, ProviderDashboard } from '@/lib/api'
import { cn, formatRLUSD } from '@/lib/utils'
import Navigation from '@/components/Navigation'

interface HeatmapSpot {
  id: string
  number: number
  isAvailable: boolean
  isOccupied: boolean
  activeSession: any
}

export default function ProviderPage() {
  const [dashboard, setDashboard] = useState<ProviderDashboard | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapSpot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'anomalies'>('overview')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Mock dashboard data
      const mockDashboard: ProviderDashboard = {
        parkingLot: {
          id: 'demo-lot-1',
          name: 'Main Street Parking',
          address: '123 Main Street, Downtown',
          totalSpots: 20,
          availableSpots: 3,
          latitude: 40.7128,
          longitude: -74.0060,
          ratePerMin: 0.12
        },
        metrics: {
          totalRevenue: 245.60,
          occupancyRate: 85,
          activeSessions: 17,
          availableSpots: 3,
          totalSessions: 156
        },
        hourlyRevenue: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          revenue: Math.random() * 20,
          sessions: Math.floor(Math.random() * 10)
        })),
        anomalies: [
          {
            id: 'anomaly-1',
            type: 'RAPID_SESSION_START_END',
            description: 'Suspicious rapid session start/end by Wallet 0xA3...',
            severity: 'HIGH',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'anomaly-2',
            type: 'HIGH_FREQUENCY_USAGE',
            description: 'Unusual high frequency usage pattern detected',
            severity: 'MEDIUM',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          }
        ]
      }

      // Mock heatmap data
      const mockHeatmap: HeatmapSpot[] = Array.from({ length: 20 }, (_, i) => ({
        id: `spot-${i + 1}`,
        number: i + 1,
        isAvailable: Math.random() > 0.3,
        isOccupied: Math.random() < 0.3,
        activeSession: Math.random() < 0.3 ? { id: `session-${i}`, duration: Math.floor(Math.random() * 60) } : null
      }))

      setDashboard(mockDashboard)
      setHeatmap(mockHeatmap)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-400 bg-red-400/20'
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/20'
      case 'LOW': return 'text-green-400 bg-green-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
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
          <p className="text-gray-400">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Provider Dashboard</h1>
          <p className="text-gray-400">{dashboard.parkingLot.name}</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 glass rounded-xl"
        >
          <Settings className="w-6 h-6 text-white" />
        </motion.button>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-2 mb-6"
      >
        <div className="flex">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'heatmap', label: 'Heatmap', icon: Users },
            { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all",
                  isActive 
                    ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Overview Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Total Revenue</h3>
                    <p className="text-sm text-gray-400">Last 24 hours</p>
                  </div>
                </div>
                <div className="text-3xl font-bold gradient-text">
                  {formatRLUSD(dashboard.metrics.totalRevenue)}
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Occupancy</h3>
                    <p className="text-sm text-gray-400">Current rate</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">
                  {dashboard.metrics.occupancyRate}%
                </div>
              </motion.div>
            </div>

            {/* Revenue Chart */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Hourly Revenue</h3>
              <div className="h-32 flex items-end gap-2">
                {dashboard.hourlyRevenue.slice(0, 12).map((data, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.revenue / 20) * 100}%` }}
                    transition={{ delay: index * 0.05 }}
                    className="flex-1 bg-gradient-to-t from-cyan-400 to-purple-500 rounded-t-lg"
                  />
                ))}
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Echo AI Insights</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-cyan-400/10 to-purple-500/10 rounded-xl border border-cyan-400/20">
                  <h4 className="font-semibold text-white mb-2">Suggested Rate Adjustment</h4>
                  <p className="text-sm text-gray-300 mb-2">
                    High demand detected (85% occupancy). Consider increasing rates during peak hours.
                  </p>
                  <div className="text-lg font-bold text-cyan-400">
                    Suggested: 0.15 RLUSD/min
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-green-400/10 to-emerald-500/10 rounded-xl border border-green-400/20">
                  <h4 className="font-semibold text-white mb-2">Performance Summary</h4>
                  <p className="text-sm text-gray-300">
                    Excellent performance with 156 sessions and $245.60 revenue in the last 24 hours.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Heatmap Tab */}
        {activeTab === 'heatmap' && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Occupancy Heatmap</h3>
              
              <div className="grid grid-cols-5 gap-3">
                {heatmap.map((spot, index) => (
                  <motion.div
                    key={spot.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all",
                      spot.isAvailable 
                        ? "bg-green-400/20 border border-green-400/30" 
                        : "bg-red-400/20 border border-red-400/30"
                    )}
                  >
                    <Car className={cn(
                      "w-6 h-6 mb-1",
                      spot.isAvailable ? "text-green-400" : "text-red-400"
                    )} />
                    <span className="text-xs font-bold text-white">{spot.number}</span>
                    {spot.activeSession && (
                      <div className="text-xs text-gray-400 mt-1">
                        {spot.activeSession.duration}m
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-400">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-sm text-gray-400">Occupied</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && (
          <motion.div
            key="anomalies"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Anomaly Detection</h3>
              
              <div className="space-y-4">
                {dashboard.anomalies.map((anomaly, index) => (
                  <motion.div
                    key={anomaly.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 glass rounded-xl border-l-4 border-red-400"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-xs font-semibold",
                            getSeverityColor(anomaly.severity)
                          )}>
                            {anomaly.severity}
                          </span>
                        </div>
                        <p className="text-white mb-2">{anomaly.description}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(anomaly.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-green-400/20 text-green-400 rounded-lg hover:bg-green-400/30 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <Navigation />
    </div>
  )
}
