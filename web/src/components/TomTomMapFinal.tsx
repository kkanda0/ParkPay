'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Loader2, Car } from 'lucide-react'
import { ParkingLot, Spot } from '@/lib/api'
import Script from 'next/script'

interface TomTomMapFinalProps {
  parkingLot: ParkingLot | null
  spots: Spot[]
  onSpotSelect: (spot: Spot, parkingGarage?: { name: string, address: string }) => void
  currentSession?: any | null
}

export default function TomTomMapFinal({ parkingLot, spots, onSpotSelect, currentSession }: TomTomMapFinalProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const [sdkLoaded, setSDKLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [searching, setSearching] = useState(false)
  const markersRef = useRef<any[]>([])
  const [selectedParking, setSelectedParking] = useState<any>(null)

  const API_KEY = 'MWH3UEN2Q9NTG4Amr7bjlUF1Luhjti6l'

  // Initialize map when SDK loads
  useEffect(() => {
    if (!sdkLoaded || !mapContainer.current || mapInstance.current) {
      return
    }

    console.log('🗺️ Initializing TomTom Map...')

    try {
      if (typeof window === 'undefined' || !(window as any).tt) {
        console.error('❌ TomTom SDK not available')
        return
      }

      const tt = (window as any).tt

      // Create map centered on NYC (don't need parkingLot data)
      const map = tt.map({
        key: API_KEY,
        container: mapContainer.current,
        center: [-74.0060, 40.7128], // NYC coordinates
        zoom: 13,
        dragPan: true,
        scrollZoom: true
      })

      console.log('✅ Map instance created')
      mapInstance.current = map

      // Set ready after short delay
      setTimeout(() => {
        console.log('✅ Map ready')
        setMapReady(true)
      }, 1500)

      // Also listen for load event
      map.on('load', () => {
        console.log('✅ Map load event fired')
        if (!mapReady) {
          setMapReady(true)
        }
      })

      // Add click handler for search
      map.on('click', (e: any) => {
        const { lng, lat } = e.lngLat
        console.log('🗺️ Map clicked:', { lat, lng })
        clearMarkers() // Clear previous markers before new search
        searchNearbyParking(lat, lng)
      })

      return () => {
        if (mapInstance.current) {
          mapInstance.current.remove()
          mapInstance.current = null
          markersRef.current = []
        }
      }
    } catch (error) {
      console.error('❌ Error initializing map:', error)
      setTimeout(() => setMapReady(true), 2000)
    }
  }, [sdkLoaded])

  // Clear all markers from map
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      try {
        marker.remove()
      } catch (e) {
        // Ignore errors
      }
    })
    markersRef.current = []
  }

  // Search for REAL parking locations using TomTom Search API
  const searchNearbyParking = async (lat: number, lng: number) => {
    setSearching(true)
    console.log('🔍 Searching REAL parking near:', { lat, lng })

    try {
      const tt = (window as any).tt
      const map = mapInstance.current

      // Use TomTom Search API to find real parking locations
      const searchUrl = `https://api.tomtom.com/search/2/search/parking.json?key=${API_KEY}&lat=${lat}&lon=${lng}&radius=1000&limit=10`
      
      console.log('📡 Calling TomTom Search API...')
      const response = await fetch(searchUrl)

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Found REAL parking:', data.results?.length || 0, 'locations')

      if (data.results && data.results.length > 0) {
        // Add markers for each real parking location
        data.results.forEach((result: any) => {
          const parkingName = result.poi?.name || 'Parking'
          const address = result.address?.freeformAddress || 'Address unavailable'
          const distance = result.dist ? `${Math.round(result.dist)}m away` : ''
          
          // Create marker element with NO hover effects that affect positioning
          const markerEl = document.createElement('div')
          markerEl.style.cssText = `
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: 3px solid #1d4ed8;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.6);
            transition: box-shadow 0.2s, filter 0.2s;
          `
          markerEl.innerHTML = '🅿️'

          // Hover effect that doesn't change size or position
          markerEl.addEventListener('mouseenter', () => {
            markerEl.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.9)'
            markerEl.style.filter = 'brightness(1.2)'
          })

          markerEl.addEventListener('mouseleave', () => {
            markerEl.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.6)'
            markerEl.style.filter = 'brightness(1)'
          })

          // Click to select parking - show clean UI
          markerEl.addEventListener('click', (e) => {
            e.stopPropagation()
            console.log('📍 Parking selected:', {
              name: parkingName,
              address: address,
              position: result.position,
              distance: distance
            })
            
            // Set selected parking for clean UI display
            setSelectedParking({
              name: parkingName,
              address: address,
              distance: distance,
              position: result.position
            })
          })

          // Create marker with center anchor to prevent flying
          const marker = new tt.Marker({ 
            element: markerEl,
            anchor: 'center'
          })
            .setLngLat([result.position.lon, result.position.lat])
            .addTo(map)

          markersRef.current.push(marker)
        })

        console.log(`✅ Added ${data.results.length} REAL parking markers from TomTom!`)
      } else {
        console.warn('⚠️ No parking found in this area')
      }

    } catch (error) {
      console.error('❌ Error searching parking:', error)
    } finally {
      setSearching(false)
    }
  }

  return (
    <>
      {/* Load TomTom SDK */}
      <Script
        src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('✅ TomTom SDK loaded')
          setSDKLoaded(true)
        }}
        onError={() => {
          console.error('❌ Failed to load TomTom SDK')
          setTimeout(() => setSDKLoaded(true), 1000)
        }}
      />

      <link
        rel="stylesheet"
        href="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css"
      />

      <div className="absolute inset-0 w-full h-full">
        {/* Map Container */}
        <div
          ref={mapContainer}
          className="absolute inset-0 w-full h-full bg-gray-900"
        />

        {/* Loading Overlay */}
        {!mapReady && (
          <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center z-20">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-xl text-white font-semibold mb-2">Loading TomTom Map...</p>
              <p className="text-sm text-gray-400">Powered by TomTom</p>
            </div>
          </div>
        )}

        {/* Search Indicator */}
        {searching && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-white text-sm">Searching parking...</span>
            </motion.div>
          </div>
        )}

        {/* Controls */}
        {mapReady && (
          <>
            {/* Legend */}
            <div className="absolute top-4 right-4 z-10">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-lg border-2 border-blue-400">
                    🅿️
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Parking Locations</div>
                    <div className="text-gray-400 text-xs">From TomTom</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Instructions */}
            {!selectedParking && (
              <div className="absolute bottom-20 left-4 z-10">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span>Click map to search parking nearby</span>
                  </div>
                </motion.div>
              </div>
            )}

            {/* TomTom Attribution */}
            <div className="absolute bottom-4 right-4 z-10">
              <div className="glass rounded px-3 py-1">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>© TomTom</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Clean UI for Selected Parking - TOP LEFT */}
        <AnimatePresence>
          {selectedParking && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute top-4 left-4 z-30"
            >
              <div className="glass-strong rounded-2xl p-6 min-w-[350px] max-w-[400px]">
                {/* Close button */}
                <button
                  onClick={() => setSelectedParking(null)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Parking Info */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-2xl border-2 border-blue-400">
                      🅿️
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{selectedParking.name}</h3>
                      {selectedParking.distance && (
                        <p className="text-green-400 text-sm">{selectedParking.distance}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 text-gray-300 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                    <span>{selectedParking.address}</span>
                  </div>
                </div>

                {/* Start Parking Button */}
                {currentSession && currentSession.status === 'ACTIVE' ? (
                  <button
                    disabled
                    className="w-full bg-gray-600 text-gray-400 font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-not-allowed"
                  >
                    <Car className="w-5 h-5" />
                    <span>Session Active</span>
                  </button>
                ) : (
                  <a href="/spot/spot-1">
                    <button
                      onClick={() => {
                        console.log('🚗 Starting parking session:', selectedParking)
                        // Trigger spot selection callback with parking garage info
                        if (onSpotSelect) {
                          onSpotSelect(
                            { id: 'spot-1', number: 1, isAvailable: true, parkingLotId: 'demo-lot-1' },
                            { 
                              name: selectedParking.name, 
                              address: selectedParking.address 
                            }
                          )
                        }
                      }}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/50"
                    >
                      <Car className="w-5 h-5" />
                      <span>Start Parking Session</span>
                    </button>
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

