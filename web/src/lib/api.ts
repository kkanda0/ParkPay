const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export interface ParkingLot {
  id: string
  name: string
  address: string
  totalSpots: number
  availableSpots: number
  latitude: number
  longitude: number
  ratePerMin: number
}

export interface Spot {
  id: string
  number: number
  isAvailable: boolean
  parkingLotId: string
}

export interface Session {
  id: string
  walletAddress: string
  spotId: string
  parkingLotId: string
  startTime: string
  endTime?: string
  totalAmount?: number
  status: 'ACTIVE' | 'ENDED' | 'CANCELLED'
  xrplTxHash?: string
  currentAmount?: number
  parkingGarage?: {
    name: string
    address: string
  }
  parkingLot?: {
    id: string
    name: string
    address: string
    ratePerMin: number
    latitude: number
    longitude: number
  }
  spot?: {
    id: string
    number: number
    isAvailable: boolean
  }
}

export interface Wallet {
  address: string
  rlusdBalance: number
  recentTransactions: Transaction[]
}

export interface Transaction {
  id: string
  type: 'payment' | 'active'
  amount: number
  parkingLot: string
  spotNumber: number
  timestamp: string
  xrplTxHash?: string
}

export interface ChatMessage {
  message: string
  suggestions?: string[]
  timestamp: string
}

export interface ProviderDashboard {
  parkingLot: ParkingLot
  metrics: {
    totalRevenue: number
    occupancyRate: number
    activeSessions: number
    availableSpots: number
    totalSessions: number
  }
  hourlyRevenue: Array<{
    hour: number
    revenue: number
    sessions: number
  }>
  anomalies: Array<{
    id: string
    type: string
    description: string
    severity: string
    createdAt: string
  }>
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    console.log('🌐 API Request:', {
      url,
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body
    })
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error ${response.status}:`, errorText)
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ API Success:', data)
      return data
    } catch (error) {
      console.error('🚨 Network error:', error)
      console.error('🚨 Error type:', typeof error)
      console.error('🚨 Error constructor:', error?.constructor?.name)
      console.error('🚨 Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack')
      throw error
    }
  }

  // Pricing endpoints
  async calculatePricing(lat: number, lon: number, baseUSD: number = 5.0) {
    return this.request('/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify({ lat, lon, baseUSD }),
    })
  }

  async getEchoPricing(lat: number, lon: number, baseUSD: number = 5.0, locationName?: string) {
    return this.request('/ai/echo-pricing', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'calculate',
        lat, 
        lon, 
        baseUSD, 
        locationName 
      }),
    })
  }

  async endSession(sessionId: string) {
    return this.request('/session/end', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    })
  }

  async getSession(sessionId: string): Promise<Session> {
    return this.request(`/session/${sessionId}`)
  }

  async heartbeatSession(sessionId: string) {
    return this.request('/session/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    })
  }

  // Wallet endpoints
  async getWallet(address: string): Promise<Wallet> {
    return this.request(`/wallet/${address}`)
  }

  async addFunds(address: string, amount: number) {
    return this.request('/wallet/add-funds', {
      method: 'POST',
      body: JSON.stringify({ address, amount }),
    })
  }

  async getTransactions(address: string, limit = 50, offset = 0) {
    return this.request(`/wallet/${address}/transactions?limit=${limit}&offset=${offset}`)
  }

  // AI endpoints
  async chat(message: string, walletAddress?: string, context?: any): Promise<ChatMessage> {
    console.log('🤖 API Service Chat called with:', { message, walletAddress, context })
    console.log('🌐 Making request to:', `${API_BASE_URL}/ai/chat`)
    
    const result = await this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, walletAddress, context }),
    })
    console.log('🤖 API Service Chat result:', result)
    return result as ChatMessage
  }

  async analyzeAnomalies(parkingLotId: string) {
    return this.request('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ parkingLotId }),
    })
  }

  async getAIInsights(parkingLotId: string) {
    return this.request(`/ai/insights/${parkingLotId}`)
  }

  // Provider endpoints
  async getProviderDashboard(parkingLotId: string): Promise<ProviderDashboard> {
    return this.request(`/provider/dashboard/${parkingLotId}`)
  }

  async getOccupancyHeatmap(parkingLotId: string) {
    return this.request(`/provider/occupancy/${parkingLotId}`)
  }

  async updateParkingLotSettings(parkingLotId: string, settings: any) {
    return this.request(`/provider/settings/${parkingLotId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async resolveAnomaly(anomalyId: string) {
    return this.request(`/provider/anomaly/${anomalyId}/resolve`, {
      method: 'POST',
    })
  }

  // Parking endpoints
  async getParkingLots(bbox?: string): Promise<ParkingLot[]> {
    const params = bbox ? `?bbox=${bbox}` : ''
    const response = await this.request<{ data: ParkingLot[] }>(`/parking/lots${params}`)
    return response.data
  }

  async getParkingLot(id: string): Promise<ParkingLot> {
    const response = await this.request<{ data: ParkingLot }>(`/parking/lots/${id}`)
    return response.data
  }

  async refreshParkingLot(id: string) {
    return this.request(`/parking/lots/${id}/refresh`, {
      method: 'POST',
    })
  }

  async getParkingHealth() {
    return this.request('/parking/health')
  }

  // Health check
  async healthCheck() {
    console.log('🏥 API Service Health Check called')
    const result = await this.request('/health')
    console.log('🏥 API Service Health Check result:', result)
    return result
  }
}

export const apiService = new ApiService()
