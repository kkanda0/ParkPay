'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { apiService } from '@/lib/api'
import { useApp } from '@/app/providers'
import Navigation from '@/components/Navigation'
import SelectedSpotCard from '@/components/SelectedSpotCard'

// Dynamically import the TomTom Map Final component
const TomTomMapFinal = dynamic(() => import('@/components/TomTomMapFinal'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
    </div>
  )
})

interface ParkingSpot {
  id: string;
  lat: number;
  lon: number;
  name: string;
  status?: "FREE" | "OCCUPIED";
  type: "osm" | "managed";
  label?: string;
  rate?: number;
  fee?: string;
  capacity?: number;
}

export default function MapPage() {
  const { walletAddress } = useApp()
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)

  const handleSpotSelect = (spot: ParkingSpot) => {
    setSelectedSpot(spot)
  }

  const handleCloseCard = () => {
    setSelectedSpot(null)
  }

  const handleStartSession = (spotId: string) => {
    // Navigate to spot detail page
    window.location.href = `/spot/${spotId}`
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Full-screen TomTom Map */}
      <TomTomMapFinal 
        parkingLot={null}
        spots={[]}
        onSpotSelect={async (spot: any, parkingGarage?: any) => {
          console.log('🎯 Spot selected:', spot, 'Garage:', parkingGarage);
          
          // Get real AI-calculated pricing
          let realRate = 5.0 // Default fallback rate
          const coordinates = {
            lat: parkingGarage?.position?.lat || 40.7128,
            lon: parkingGarage?.position?.lon || -74.0060
          }
          
          try {
            const pricingResponse = await apiService.getEchoPricing(coordinates.lat, coordinates.lon, 5.0, parkingGarage?.name)
            if (pricingResponse && typeof pricingResponse === 'object' && 'success' in pricingResponse && pricingResponse.success && 'data' in pricingResponse && pricingResponse.data) {
              realRate = (pricingResponse.data as any).priceRLUSD
              console.log('💰 Real AI pricing for map:', {
                hourly: realRate,
                location: parkingGarage?.name
              })
            }
          } catch (error) {
            console.error('Failed to get AI pricing for map, using fallback:', error)
          }
          
          // Convert TomTom spot format to our ParkingSpot format
          const parkingSpot: ParkingSpot = {
            id: spot.id,
            lat: coordinates.lat,
            lon: coordinates.lon,
            name: parkingGarage?.name || "Parking Spot",
            status: spot.isAvailable ? "FREE" : "OCCUPIED",
            type: "managed",
            label: parkingGarage?.name,
            rate: realRate // Use real AI-calculated rate
          };
          
          console.log('📍 Created parking spot with real pricing:', parkingSpot);
          handleSpotSelect(parkingSpot);
        }}
        currentSession={null}
      />

      {/* SelectedSpotCard - only show when spot is selected */}
      {selectedSpot && (
        <SelectedSpotCard 
          spot={selectedSpot}
          onClose={handleCloseCard}
          onStartSession={handleStartSession}
        />
      )}


      {/* Navigation */}
      <Navigation />
    </div>
  )
}