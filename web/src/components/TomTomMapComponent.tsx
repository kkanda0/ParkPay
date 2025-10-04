'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Car } from 'lucide-react'
import { ParkingLot, Spot } from '@/lib/api'
import { cn } from '@/lib/utils'

// Declare TomTom types for TypeScript
declare global {
  interface Window {
    tt: any;
  }
}

interface TomTomMapComponentProps {
  parkingLot: ParkingLot | null
  spots: Spot[]
  onSpotSelect: (spot: Spot) => void
}

export default function TomTomMapComponent({ parkingLot, spots, onSpotSelect }: TomTomMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markers = useRef<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [tomtomLoaded, setTomtomLoaded] = useState(false)

  // Load TomTom Maps SDK
  useEffect(() => {
    const loadTomTomSDK = () => {
      // Check if TomTom is already loaded
      if (window.tt) {
        setTomtomLoaded(true)
        return
      }

      // Load TomTom Maps SDK
      const script = document.createElement('script')
      script.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.15.0/maps/maps-web.min.js'
      script.onload = () => {
        // Load CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.15.0/maps/maps.css'
        document.head.appendChild(link)
        
        setTomtomLoaded(true)
      }
      script.onerror = () => {
        console.error('Failed to load TomTom Maps SDK')
        setTomtomLoaded(true) // Still try to initialize with fallback
      }
      document.head.appendChild(script)
    }

    loadTomTomSDK()
  }, [])

  // Initialize TomTom Map
  useEffect(() => {
    if (!tomtomLoaded || !mapRef.current || !parkingLot) return

    // Add a timeout to handle cases where TomTom SDK doesn't load
    const timeout = setTimeout(() => {
      if (!mapInstance.current) {
        console.warn('⚠️ TomTom SDK not loaded, using fallback map')
        setMapLoaded(true)
      }
    }, 5000)

    try {
      // Check if TomTom is available
      if (!window.tt || !window.tt.map) {
        throw new Error('TomTom SDK not available')
      }

      // Initialize TomTom map
      const map = window.tt.map({
        key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY || 'MWH3UEN2Q9NTG4Amr7bjlUF1Luhjti6lis',
        container: mapRef.current,
        center: [parkingLot.longitude, parkingLot.latitude],
        zoom: 16,
        style: 'dark' // Use dark theme to match the app
      })

      mapInstance.current = map
      clearTimeout(timeout)

      // Add map load event
      map.on('load', () => {
        console.log('🗺️ TomTom map loaded successfully')
        setMapLoaded(true)
        addParkingMarkers()
      })

      // Add click event for map
      map.on('click', (e: any) => {
        console.log('Map clicked at:', e.lngLat)
      })

    } catch (error) {
      console.error('❌ Error initializing TomTom map:', error)
      clearTimeout(timeout)
      setMapLoaded(true) // Show fallback UI
    }

    return () => clearTimeout(timeout)
  }, [tomtomLoaded, parkingLot])

  // Add parking spot markers to the map
  const addParkingMarkers = () => {
    if (!mapInstance.current || !parkingLot) return

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Add markers for each parking spot
    spots.forEach((spot, index) => {
      try {
        // Calculate position with some offset to spread spots around
        const offsetLat = parkingLot.latitude + (Math.random() - 0.5) * 0.001
        const offsetLon = parkingLot.longitude + (Math.random() - 0.5) * 0.001

        // Create custom marker element
        const markerElement = document.createElement('div')
        markerElement.className = 'tomtom-marker'
        markerElement.innerHTML = `
          <div class="relative w-12 h-12 cursor-pointer transform transition-all duration-300 hover:scale-110">
            <div class="w-12 h-12 rounded-full flex items-center justify-center border-2 ${
              spot.isAvailable 
                ? 'border-green-400 bg-green-400/20 shadow-lg shadow-green-400/30' 
                : 'border-red-400 bg-red-400/20'
            }">
              <svg class="w-6 h-6 ${spot.isAvailable ? 'text-green-400' : 'text-red-400'}" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 7h-1V6a1 1 0 0 0-2 0v1H8V6a1 1 0 0 0-2 0v1H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zM5 9h1v1a1 1 0 0 0 2 0V9h8v1a1 1 0 0 0 2 0V9h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z"/>
              </svg>
            </div>
            <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <span class="text-xs font-bold text-white">${spot.number}</span>
            </div>
            ${spot.isAvailable ? `
              <div class="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"></div>
            ` : ''}
          </div>
        `

        // Add click event to marker
        markerElement.addEventListener('click', (e) => {
          e.stopPropagation()
          onSpotSelect(spot)
        })

        // Create TomTom marker
        const marker = new window.tt.Marker({
          element: markerElement
        })
          .setLngLat([offsetLon, offsetLat])
          .addTo(mapInstance.current)

        markers.current.push(marker)

      } catch (error) {
        console.error('Error adding marker for spot:', spot.id, error)
      }
    })

    console.log(`📍 Added ${markers.current.length} parking markers to TomTom map`)
  }

  // Update markers when spots change
  useEffect(() => {
    if (mapLoaded && mapInstance.current) {
      addParkingMarkers()
    }
  }, [spots, mapLoaded])

  if (!parkingLot) return null

  return (
    <div className="relative w-full h-full">
      {/* TomTom Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Fallback UI if TomTom fails to load */}
      {!tomtomLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-400">Loading TomTom Maps...</p>
          </div>
        </div>
      )}

      {/* Fallback map display when TomTom doesn't load */}
      {mapLoaded && !mapInstance.current && (
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

          {/* Parking spots overlay */}
          <div className="absolute inset-0 p-8">
            <div className="grid grid-cols-4 gap-4 h-full">
              {spots.map((spot, index) => {
                const row = Math.floor(index / 4)
                const col = index % 4
                
                return (
                  <motion.div
                    key={spot.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
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
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      )}

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

      {/* Map info overlay */}
      <div className="absolute bottom-4 left-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="glass rounded-xl p-3"
        >
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <MapPin className="w-4 h-4" />
            <span>Powered by TomTom Maps</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
