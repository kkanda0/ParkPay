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
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
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
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, walletAddress, context }),
    })
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
    return this.request('/health')
  }
}

export const apiService = new ApiService()
