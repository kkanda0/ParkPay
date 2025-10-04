'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, DollarSign } from 'lucide-react'
import { useApp } from '@/app/providers'
import { formatRLUSD, formatDuration } from '@/lib/utils'

export default function SessionTimer() {
  const { currentSession } = useApp()
  const [duration, setDuration] = useState(0)
  const [currentAmount, setCurrentAmount] = useState(0)

  useEffect(() => {
    if (!currentSession || currentSession.status !== 'ACTIVE') {
      return
    }

    const updateTimer = () => {
      const startTime = new Date(currentSession.startTime)
      const now = new Date()
      const diffMs = now.getTime() - startTime.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      
      setDuration(diffSeconds)
      setCurrentAmount((diffSeconds / 60) * 0.12) // Demo rate: 0.12 RLUSD per minute
    }

    // Update immediately on mount
    updateTimer()

    // Then update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [currentSession])

  // Don't render if no active session
  if (!currentSession || currentSession.status !== 'ACTIVE') {
    return null
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className="fixed top-4 right-4 z-40"
    >
      <div className="glass-card rounded-xl p-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div className="text-sm font-mono text-white">
              {formatDuration(duration)}
            </div>
          </div>
          
          {/* Amount */}
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <div className="text-sm font-mono text-white">
              {formatRLUSD(currentAmount)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
