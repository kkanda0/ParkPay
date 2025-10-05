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

// Dynamically import the TomTom Map Final component
const TomTomMapFinal = dynamic(() => import('@/components/TomTomMapFinal'), {
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
      setIsLoading(true)
      console.log('🔍 Fetching parking data from TomTom API...')
      
      // Fetch parking lots from TomTom API
      const parkingLots = await apiService.getParkingLots()
      
      if (parkingLots.length === 0) {
        console.warn('⚠️ No parking lots found, using demo data')
        loadDemoData()
        return
      }

      // Use the first parking lot for the map
      const selectedLot = parkingLots[0]
      setParkingLot(selectedLot)
      
      // Generate spots based on available spots from TomTom
      const generatedSpots: Spot[] = Array.from({ length: selectedLot.totalSpots }, (_, i) => ({
        id: `spot-${i + 1}`,
        number: i + 1,
        isAvailable: i < selectedLot.availableSpots, // First N spots are available
        parkingLotId: selectedLot.id
      }))

      setSpots(generatedSpots)
      setIsLoading(false)
      console.log(`✅ Loaded ${parkingLots.length} parking lots from TomTom API`)
      
    } catch (error) {
      console.error('❌ Error loading parking data from TomTom API:', error)
      console.log('🔄 Falling back to demo data...')
      loadDemoData()
    }
  }

  const loadDemoData = () => {
    // Fallback demo data when TomTom API fails
    const demoParkingLot: ParkingLot = {
      id: 'demo-lot-1',
      name: 'Main Street Parking',
      address: '123 Main Street, Downtown',
      totalSpots: 20,
      availableSpots: Math.floor(Math.random() * 15) + 3, // 3-17 available
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
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      {/* Full-screen TomTom Map */}
      <TomTomMapFinal 
        parkingLot={parkingLot}
        spots={spots}
        onSpotSelect={setSelectedSpot}
      />

      {/* Navigation */}
      <Navigation />
    </div>
  )
}
