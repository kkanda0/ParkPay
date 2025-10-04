'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Car, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { apiService, ParkingLot, Spot, Session } from '@/lib/api'
import { socketService } from '@/lib/socket'
import { useApp } from '@/app/providers'
import { cn, formatRLUSD, formatDuration } from '@/lib/utils'
import Navigation from '@/components/Navigation'

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
    </div>
  )
})

export default function MapPage() {
  const { walletAddress, currentSession } = useApp()
  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null)
  const [spots, setSpots] = useState<Spot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [sessionAmount, setSessionAmount] = useState(0)

  useEffect(() => {
    loadParkingData()
    setupSocketListeners()
  }, [])

  // Update session timer when there's an active session
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'ACTIVE') {
      setSessionDuration(0)
      setSessionAmount(0)
      return
    }

    const interval = setInterval(() => {
      const startTime = new Date(currentSession.startTime)
      const now = new Date()
      const diffMs = now.getTime() - startTime.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      
      setSessionDuration(diffSeconds)
      setSessionAmount((diffSeconds / 60) * 0.12) // Demo rate: 0.12 RLUSD per minute
    }, 1000)

    return () => clearInterval(interval)
  }, [currentSession])

  const loadParkingData = async () => {
    try {
      // For demo purposes, we'll use hardcoded data
      // In a real app, you'd fetch this from the API
      const demoParkingLot: ParkingLot = {
        id: 'demo-lot-1',
        name: 'Main Street Parking',
        address: '123 Main Street, Downtown',
        totalSpots: 20,
        latitude: 40.7128,
        longitude: -74.0060,
        ratePerMin: 0.12
      }

      const demoSpots: Spot[] = Array.from({ length: 20 }, (_, i) => ({
        id: `spot-${i + 1}`,
        number: i + 1,
        isAvailable: Math.random() > 0.3, // 70% availability
        parkingLotId: 'demo-lot-1'
      }))

      setParkingLot(demoParkingLot)
      setSpots(demoSpots)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading parking data:', error)
      setIsLoading(false)
    }
  }

  const setupSocketListeners = () => {
    const socket = socketService.connect()
    
    socket.on('spot-updated', (data) => {
      setSpots(prev => prev.map(spot => 
        spot.id === data.spotId 
          ? { ...spot, isAvailable: data.isAvailable }
          : spot
      ))
    })
  }

  const availableSpots = spots.filter(spot => spot.isAvailable)
  const occupiedSpots = spots.filter(spot => !spot.isAvailable)

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading parking map...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapComponent 
          parkingLot={parkingLot}
          spots={spots}
          onSpotSelect={setSelectedSpot}
        />
      </div>

      {/* Top overlay card */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute top-4 left-4 right-4 z-10"
      >
        <div className="glass-card rounded-2xl p-4 max-w-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{parkingLot?.name}</h2>
              <p className="text-sm text-gray-400">{parkingLot?.address}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{parkingLot?.totalSpots}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{availableSpots.length}</div>
              <div className="text-xs text-gray-400">Free</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{occupiedSpots.length}</div>
              <div className="text-xs text-gray-400">Occupied</div>
            </div>
          </div>

          {/* Active Session Timer - RIGHT underneath the available/occupied box */}
          {currentSession && currentSession.status === 'ACTIVE' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <Link href={`/spot/${currentSession.spotId}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span className="text-gray-400">Session:</span>
                    </div>
                    <span className="text-white font-mono">{formatDuration(sessionDuration)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-gray-400">Spent:</span>
                    </div>
                    <span className="text-white font-mono">{formatRLUSD(sessionAmount)}</span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          )}
          
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Rate:</span>
              <span className="text-white font-medium">{formatRLUSD(parkingLot?.ratePerMin || 0)}/min</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Start Session button - Top Center */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
      >
        <Link href={selectedSpot && !currentSession ? `/spot/${selectedSpot.id}` : '#'}>
          <motion.button
            whileHover={{ scale: currentSession ? 1 : 1.05 }}
            whileTap={{ scale: currentSession ? 1 : 0.95 }}
            disabled={!selectedSpot || (currentSession && currentSession.status === 'ACTIVE')}
            className="btn-primary px-8 py-4 rounded-2xl shadow-2xl neon-glow flex items-center gap-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Car className="w-6 h-6" />
            {currentSession && currentSession.status === 'ACTIVE' ? 'Session Active' : 'Start Session'}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-2 h-2 bg-white rounded-full"
            />
          </motion.button>
        </Link>
      </motion.div>

      {/* Spot selection hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="glass rounded-xl px-4 py-2">
          <p className="text-sm text-gray-300 text-center">
            Tap a glowing marker to select a spot
          </p>
        </div>
      </motion.div>

      {/* Navigation */}
      <Navigation />
    </div>
  )
}
