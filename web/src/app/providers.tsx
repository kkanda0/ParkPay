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
  const [walletAddress, setWalletAddress] = useState<string>('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
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
    const savedAddress = localStorage.getItem('walletAddress')
    if (savedAddress) {
      setWalletAddress(savedAddress)
    }

    return () => {
      socketService.disconnect()
    }
  }, [])

  useEffect(() => {
    // Save wallet address to localStorage
    localStorage.setItem('walletAddress', walletAddress)
  }, [walletAddress])

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
