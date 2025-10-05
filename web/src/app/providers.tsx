'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { socketService } from '@/lib/socket'

interface AppContextType {
  walletAddress: string
  setWalletAddress: (address: string) => void
  isConnected: boolean
  currentSession: any | null
  setCurrentSession: (session: any | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within a Providers')
  }
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string>('rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ')
  const [isConnected, setIsConnected] = useState(false)
  const [currentSession, setCurrentSession] = useState<any | null>(null)

  useEffect(() => {
    // Connect to socket
    const socket = socketService.connect()
    
    socket.on('connect', () => {
      setIsConnected(true)
    })
    
    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    // Load wallet address from localStorage
    if (typeof window !== 'undefined') {
      const savedAddress = localStorage.getItem('walletAddress')
      if (savedAddress) {
        setWalletAddress(savedAddress)
      }
    }

    // Load current session from localStorage if it exists
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('currentSession')
      if (savedSession) {
        setCurrentSession(JSON.parse(savedSession))
      }
    }

    return () => {
      socketService.disconnect()
    }
  }, [])

  useEffect(() => {
    // Save wallet address to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('walletAddress', walletAddress)
    }
  }, [walletAddress])

  useEffect(() => {
    // Save current session to localStorage
    if (typeof window !== 'undefined') {
      if (currentSession) {
        localStorage.setItem('currentSession', JSON.stringify(currentSession))
      } else {
        localStorage.removeItem('currentSession')
      }
    }
  }, [currentSession])

  const value = {
    walletAddress,
    setWalletAddress,
    isConnected,
    currentSession,
    setCurrentSession,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
