'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { ParkingLot, Spot } from '@/lib/api'
import Script from 'next/script'

interface TomTomRealMapProps {
  parkingLot: ParkingLot | null
  spots: Spot[]
  onSpotSelect: (spot: Spot) => void
}

export default function TomTomRealMap({ parkingLot, spots, onSpotSelect }: TomTomRealMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const [sdkLoaded, setSDKLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map once SDK is loaded and we have parking data
  useEffect(() => {
    console.log('🔄 TomTom Map Effect Running:', {
      sdkLoaded,
      hasParkingLot: !!parkingLot,
      hasContainer: !!mapContainer.current,
      hasInstance: !!mapInstance.current
    })

    if (!sdkLoaded) {
      console.log('⏳ Waiting for SDK to load...')
      return
    }
    
    if (!parkingLot) {
      console.log('⏳ Waiting for parking lot data...')
      return
    }
    
    if (!mapContainer.current) {
      console.log('⏳ Waiting for map container...')
      return
    }
    
    if (mapInstance.current) {
      console.log('✅ Map already initialized')
      return
    }

    // Set timeout to mark as ready even if map doesn't fully load
    const timeout = setTimeout(() => {
      if (!mapReady) {
        console.warn('⚠️ Map loading timeout (5s), marking as ready anyway')
        setMapReady(true)
      }
    }, 5000)

    try {
      // @ts-ignore - TomTom SDK loaded via Script tag
      console.log('🔍 Checking window.tt:', typeof window !== 'undefined' ? typeof (window as any).tt : 'window undefined')
      
      if (typeof window !== 'undefined' && (window as any).tt && (window as any).tt.map) {
        console.log('✅ TomTom SDK confirmed available')
        console.log('🗺️ Initializing TomTom map with:', {
          lat: parkingLot.latitude,
          lon: parkingLot.longitude,
          zoom: 14
        })
        
        // @ts-ignore
        const map = (window as any).tt.map({
          key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY || 'MWH3UEN2Q9NTG4Amr7bjlUF1Luhjti6lis',
          container: mapContainer.current,
          center: [parkingLot.longitude, parkingLot.latitude],
          zoom: 14
          // Using default style - works with all API keys
        })

        console.log('📍 Map object created:', !!map)
        mapInstance.current = map

        // Wait for map to load
        map.on('load', () => {
          console.log('✅ TomTom map LOAD event fired!')
          clearTimeout(timeout)
          setMapReady(true)
          addMarkers(map)
        })

        // Handle map errors
        map.on('error', (error: any) => {
          console.error('❌ TomTom map ERROR event:', error)
          clearTimeout(timeout)
          setMapReady(true) // Show map anyway
        })

        // Clean up on unmount
        return () => {
          console.log('🧹 Cleaning up map...')
          clearTimeout(timeout)
          if (mapInstance.current) {
            mapInstance.current.remove()
            mapInstance.current = null
          }
        }
      } else {
        console.error('❌ TomTom SDK NOT available on window object!')
        console.log('🔄 Setting timeout and marking as loaded anyway...')
        clearTimeout(timeout)
        setTimeout(() => setMapReady(true), 1000) // Show something
      }
    } catch (error) {
      console.error('❌ Exception during TomTom map initialization:', error)
      clearTimeout(timeout)
      setMapReady(true) // Show something even on error
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [sdkLoaded, parkingLot, mapReady])

  // Add markers for parking spots
  const addMarkers = (map: any) => {
    if (!map || !parkingLot) return

    console.log(`📍 Adding ${spots.length} parking spot markers...`)

    spots.forEach((spot, index) => {
      try {
        // Calculate position with slight offset for better visibility
        const offsetLat = parkingLot.latitude + (Math.random() - 0.5) * 0.002
        const offsetLon = parkingLot.longitude + (Math.random() - 0.5) * 0.002

        // Create marker element
        const el = document.createElement('div')
        el.className = 'tomtom-custom-marker'
        el.style.cssText = `
          width: 40px;
          height: 40px;
          background: ${spot.isAvailable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
          border: 2px solid ${spot.isAvailable ? '#22c55e' : '#ef4444'};
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          box-shadow: 0 0 ${spot.isAvailable ? '20px rgba(34, 197, 94, 0.5)' : '10px rgba(239, 68, 68, 0.3)'};
        `
        
        el.innerHTML = `
          <div style="
            width: 24px;
            height: 24px;
            background: ${spot.isAvailable ? '#22c55e' : '#ef4444'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: bold;
          ">${spot.number}</div>
        `

        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onSpotSelect(spot)
        })

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)'
        })

        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)'
        })

        // @ts-ignore
        new window.tt.Marker({ element: el })
          .setLngLat([offsetLon, offsetLat])
          .addTo(map)

      } catch (error) {
        console.error(`Error adding marker for spot ${spot.id}:`, error)
      }
    })

    console.log(`✅ Added ${spots.length} markers to map`)
  }

  return (
    <>
      {/* Load TomTom SDK */}
      <Script
        src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('✅ TomTom SDK Script loaded successfully')
          console.log('🔍 window.tt available:', typeof window !== 'undefined' && typeof (window as any).tt !== 'undefined')
          setSDKLoaded(true)
        }}
        onError={(e) => {
          console.error('❌ Failed to load TomTom SDK:', e)
          // Still set as loaded to show timeout message
          setTimeout(() => setSDKLoaded(true), 1000)
        }}
        onReady={() => {
          console.log('✅ TomTom SDK Ready')
        }}
      />
      
      <link
        rel="stylesheet"
        href="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css"
      />

      <div className="relative w-full h-full">
        {/* Map container */}
        <div 
          ref={mapContainer} 
          className="absolute inset-0"
          style={{ minHeight: '400px' }}
        />

        {/* Loading indicator */}
        {!mapReady && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-gray-400">Loading TomTom Map...</p>
              <p className="text-sm text-gray-500 mt-2">Powered by TomTom</p>
            </div>
          </div>
        )}

        {/* Map controls legend */}
        {mapReady && (
          <div className="absolute top-4 right-4 z-10">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
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
        )}

        {/* TomTom attribution */}
        {mapReady && (
          <div className="absolute bottom-4 left-4 z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="glass rounded-xl px-3 py-2"
            >
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <MapPin className="w-3 h-3" />
                <span>Powered by TomTom Maps</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  )
}
