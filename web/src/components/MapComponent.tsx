'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Car } from 'lucide-react'
import { ParkingLot, Spot } from '@/lib/api'
import { cn } from '@/lib/utils'

interface MapComponentProps {
  parkingLot: ParkingLot | null
  spots: Spot[]
  onSpotSelect: (spot: Spot) => void
}

export default function MapComponent({ parkingLot, spots, onSpotSelect }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (!parkingLot) return null

  return (
    <div ref={mapRef} className="relative w-full h-full bg-gray-900">
      {/* Simulated map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-gray-700"></div>
            ))}
          </div>
        </div>
        
        {/* Street lines */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-600 opacity-30"></div>
          <div className="absolute top-3/4 left-0 right-0 h-1 bg-gray-600 opacity-30"></div>
          <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-600 opacity-30"></div>
          <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-gray-600 opacity-30"></div>
        </div>
      </div>

      {/* Parking spots */}
      <div className="absolute inset-0 p-8">
        <div className="grid grid-cols-4 gap-4 h-full">
          {spots.map((spot, index) => {
            const row = Math.floor(index / 4)
            const col = index % 4
            
            return (
              <motion.div
                key={spot.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: mapLoaded ? 1 : 0, 
                  opacity: mapLoaded ? 1 : 0 
                }}
                transition={{ 
                  delay: index * 0.1,
                  duration: 0.5,
                  type: "spring",
                  bounce: 0.3
                }}
                className={cn(
                  "relative flex items-center justify-center cursor-pointer",
                  "transform transition-all duration-300 hover:scale-110"
                )}
                onClick={() => onSpotSelect(spot)}
                style={{
                  gridRow: row + 1,
                  gridColumn: col + 1,
                }}
              >
                {/* Spot marker */}
                <motion.div
                  className={cn(
                    "relative w-16 h-16 rounded-full flex items-center justify-center",
                    "border-2 transition-all duration-300",
                    spot.isAvailable 
                      ? "border-green-400 bg-green-400/20 neon-glow" 
                      : "border-red-400 bg-red-400/20"
                  )}
                  animate={spot.isAvailable ? {
                    boxShadow: [
                      "0 0 20px rgba(34, 197, 94, 0.5)",
                      "0 0 30px rgba(34, 197, 94, 0.8)",
                      "0 0 20px rgba(34, 197, 94, 0.5)"
                    ]
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Pulsing ring for available spots */}
                  {spot.isAvailable && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-green-400"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 0, 0.8]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  {/* Spot icon */}
                  <Car 
                    size={24} 
                    className={cn(
                      spot.isAvailable ? "text-green-400" : "text-red-400"
                    )}
                  />
                  
                  {/* Spot number */}
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {spot.number}
                    </span>
                  </div>
                </motion.div>

                {/* Status indicator */}
                <motion.div
                  className={cn(
                    "absolute -top-2 -right-2 w-4 h-4 rounded-full",
                    spot.isAvailable ? "bg-green-400" : "bg-red-400"
                  )}
                  animate={spot.isAvailable ? {
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1]
                  } : {}}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 z-10">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5 }}
          className="glass rounded-xl p-3"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Available</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-gray-300">Occupied</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Loading overlay */}
      {!mapLoaded && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-400">Loading parking map...</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
