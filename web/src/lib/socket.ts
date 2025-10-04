import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect() {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io('http://localhost:3001', {
      transports: ['websocket'],
      timeout: 20000,
    })

    this.socket.on('connect', () => {
      console.log('🔌 Connected to ParkPay API')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from ParkPay API')
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error)
      this.handleReconnect()
    })

    return this.socket
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      
      setTimeout(() => {
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.socket?.connect()
      }, delay)
    }
  }

  joinLot(parkingLotId: string) {
    this.socket?.emit('join-lot', parkingLotId)
  }

  onSpotUpdated(callback: (data: any) => void) {
    this.socket?.on('spot-updated', callback)
  }

  onSessionEnded(callback: (data: any) => void) {
    this.socket?.on('session-ended', callback)
  }

  offSpotUpdated(callback: (data: any) => void) {
    this.socket?.off('spot-updated', callback)
  }

  offSessionEnded(callback: (data: any) => void) {
    this.socket?.off('session-ended', callback)
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  getSocket() {
    return this.socket
  }
}

export const socketService = new SocketService()
