'use server'

import { cookies } from 'next/headers'
import { validateToken, getUserFromToken } from '@/lib/utils/auth'

// Common recommendation schema
export interface RecommendationCard {
  id: string
  title: string
  summary: string
  reason: string
  score: number        // 0-100
  cta: string
  ctaType: "navigate" | "action" | "toggle" | "payment"
  meta: object
}

// Server action for parking cost optimization recommendations
export async function getParkingCostOptimization(): Promise<{ 
  ok: boolean
  data?: RecommendationCard
  error?: string
}> {
  try {
    // Validate authentication
    const authResult = await validateAuth()
    if (!authResult.valid) {
      return { ok: false, error: authResult.error }
    }

    // Gather server-side signals
    const signals = await gatherSignals(authResult.userId)
    
    // Call AI through Echo
    const aiResponse = await callEchoAI('parking-cost-optimization', signals)
    
    // Parse and sanitize response
    const recommendation = parseRecommendation(aiResponse, 'parking-cost-optimization', signals)
    
    return { ok: true, data: recommendation }
  } catch (error) {
    console.error('Error in getParkingCostOptimization:', error)
    return { 
      ok: true, 
      data: getFallbackRecommendation('parking-cost-optimization', 'No cost optimization recommendations available right now.', signals)
    }
  }
}

// Server action for dynamic demand forecast recommendations
export async function getDynamicDemandForecast(): Promise<{ 
  ok: boolean
  data?: RecommendationCard
  error?: string
}> {
  try {
    // Validate authentication
    const authResult = await validateAuth()
    if (!authResult.valid) {
      return { ok: false, error: authResult.error }
    }

    // Gather server-side signals
    const signals = await gatherSignals(authResult.userId)
    
    // Call AI through Echo
    const aiResponse = await callEchoAI('dynamic-demand-forecast', signals)
    
    // Parse and sanitize response
    const recommendation = parseRecommendation(aiResponse, 'dynamic-demand-forecast', signals)
    
    return { ok: true, data: recommendation }
  } catch (error) {
    console.error('Error in getDynamicDemandForecast:', error)
    return { 
      ok: true, 
      data: getFallbackRecommendation('dynamic-demand-forecast', 'No demand forecast available right now.', signals)
    }
  }
}

// Server action for session efficiency insights
export async function getSessionEfficiencyInsight(): Promise<{ 
  ok: boolean
  data?: RecommendationCard
  error?: string
}> {
  try {
    // Validate authentication
    const authResult = await validateAuth()
    if (!authResult.valid) {
      return { ok: false, error: authResult.error }
    }

    // Gather server-side signals
    const signals = await gatherSignals(authResult.userId)
    
    // Call AI through Echo
    const aiResponse = await callEchoAI('session-efficiency-insight', signals)
    
    // Parse and sanitize response
    const recommendation = parseRecommendation(aiResponse, 'session-efficiency-insight', signals)
    
    return { ok: true, data: recommendation }
  } catch (error) {
    console.error('Error in getSessionEfficiencyInsight:', error)
    return { 
      ok: true, 
      data: getFallbackRecommendation('session-efficiency-insight', 'No efficiency insights available right now.', signals)
    }
  }
}

// Server action for wallet health insights
export async function getWalletHealthInsight(): Promise<{ 
  ok: boolean
  data?: RecommendationCard
  error?: string
}> {
  try {
    // Validate authentication
    const authResult = await validateAuth()
    if (!authResult.valid) {
      return { ok: false, error: authResult.error }
    }

    // Gather server-side signals
    const signals = await gatherSignals(authResult.userId)
    
    // Call AI through Echo
    const aiResponse = await callEchoAI('wallet-health-insight', signals)
    
    // Parse and sanitize response
    const recommendation = parseRecommendation(aiResponse, 'wallet-health-insight', signals)
    
    return { ok: true, data: recommendation }
  } catch (error) {
    console.error('Error in getWalletHealthInsight:', error)
    return { 
      ok: true, 
      data: getFallbackRecommendation('wallet-health-insight', 'No wallet health insights available right now.', signals)
    }
  }
}

// Common authentication validation
async function validateAuth(): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    return { valid: false, error: 'Authentication required' }
  }

  const isValid = await validateToken(token)
  if (!isValid) {
    return { valid: false, error: 'Authentication required' }
  }

  const user = await getUserFromToken()
  if (!user) {
    return { valid: false, error: 'User not found' }
  }

  return { valid: true, userId: user.id }
}

// Gather server-side signals from internal services
async function gatherSignals(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  
  try {
    // Use the hardcoded wallet address from the app
    // In a real system, you'd map userId to walletAddress
    const walletAddress = 'rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ'
    
    // Get real wallet data (this includes recent sessions)
    const walletResponse = await fetch(`${baseUrl}/api/wallet/${walletAddress}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ECHO_SERVER_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    let wallet = { balance: 0, recentTransactions: [] }
    let sessions = []
    
    if (walletResponse.ok) {
      const walletData = await walletResponse.json()
      wallet = {
        balance: walletData.rlusdBalance || 0,
        recentTransactions: walletData.recentTransactions || []
      }
      
      // Convert recent transactions to sessions format
      sessions = walletData.recentTransactions.map((tx: any) => ({
        id: tx.id,
        zone: tx.parkingLot || 'unknown',
        start: tx.timestamp,
        end: tx.timestamp, // We don't have end time in transactions
        duration: tx.amount > 0 ? Math.ceil(tx.amount / 0.1) : 60, // Estimate duration from amount
        cost: tx.amount || 0,
        spotId: tx.spotNumber?.toString() || 'unknown',
        parkingLotName: tx.parkingLot || 'Unknown',
        ratePerMin: 0.1 // Default rate
      }))
    } else {
      console.log('Wallet API not available, using empty data')
      wallet = { balance: 0, recentTransactions: [] }
      sessions = []
    }

    // Get real parking lot data for pricing analysis
    const lotsResponse = await fetch(`${baseUrl}/api/parking/lots`, {
      headers: {
        'Authorization': `Bearer ${process.env.ECHO_SERVER_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    let parkingLots = []
    if (lotsResponse.ok) {
      const lotsData = await lotsResponse.json()
      if (lotsData.success && lotsData.data) {
        parkingLots = lotsData.data.map((lot: any) => ({
          id: lot.id || lot.poi?.id,
          name: lot.poi?.name || lot.name || 'Unknown Lot',
          ratePerMin: lot.poi?.chargingInfo?.pricePerHour ? lot.poi.chargingInfo.pricePerHour / 60 : 0.1,
          location: lot.poi?.address?.freeformAddress || 'Unknown Location',
          totalSpots: lot.poi?.chargingInfo?.totalSpots || 10,
          availableSpots: lot.poi?.chargingInfo?.availableSpots || 5
        }))
      }
    } else {
      console.log('Parking lots API not available, using empty data')
      parkingLots = []
    }

    // For spots, we'll use the parking lots data to simulate spots
    let spots = []
    parkingLots.forEach((lot: any) => {
      for (let i = 1; i <= lot.totalSpots; i++) {
        spots.push({
          id: `${lot.id}-spot-${i}`,
          number: i,
          isAvailable: i <= lot.availableSpots,
          parkingLotId: lot.id,
          currentRate: lot.ratePerMin
        })
      }
    })

    // Calculate user's parking patterns from real data
    const userPatterns = analyzeUserPatterns(sessions, parkingLots)
    
    return {
      userId,
      sessions,
      wallet,
      parkingLots,
      spots,
      userPatterns,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error gathering signals:', error)
    // Return mock data as fallback
    const mockSessions = [
      {
        id: 'mock-1',
        zone: 'Downtown Garage',
        start: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration: 25,
        cost: 2.50,
        spotId: '15',
        parkingLotName: 'Downtown Garage',
        ratePerMin: 0.1
      }
    ]
    
    const mockParkingLots = [
      {
        id: 'lot-1',
        name: 'Downtown Garage',
        ratePerMin: 0.15,
        location: '123 Main St',
        totalSpots: 50,
        availableSpots: 12
      }
    ]
    
    return {
      userId,
      sessions: mockSessions,
      wallet: { balance: 85.50, recentTransactions: [] },
      parkingLots: mockParkingLots,
      spots: [],
      userPatterns: analyzeUserPatterns(mockSessions, mockParkingLots),
      timestamp: new Date().toISOString()
    }
  }
}

// Analyze user patterns from real session data
function analyzeUserPatterns(sessions: any[], parkingLots: any[]) {
  if (sessions.length === 0) return {}
  
  // Calculate average session duration
  const avgDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
  
  // Find most frequent parking zones
  const zoneFrequency = sessions.reduce((acc, s) => {
    acc[s.zone] = (acc[s.zone] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const mostFrequentZone = Object.keys(zoneFrequency).reduce((a, b) => 
    zoneFrequency[a] > zoneFrequency[b] ? a : b, '')
  
  // Calculate average cost per session
  const avgCost = sessions.reduce((sum, s) => sum + (s.cost || 0), 0) / sessions.length
  
  // Find time patterns (hour of day)
  const hourPatterns = sessions.reduce((acc, s) => {
    const hour = new Date(s.start).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  const peakHour = Object.keys(hourPatterns).reduce((a, b) => 
    hourPatterns[parseInt(a)] > hourPatterns[parseInt(b)] ? a : b, '0')
  
  // Calculate efficiency (actual usage vs paid time)
  const efficiencyData = sessions.map(s => {
    const paidDuration = s.duration || 0
    const actualUsage = s.end && s.start ? 
      (new Date(s.end).getTime() - new Date(s.start).getTime()) / (1000 * 60) : paidDuration
    return {
      sessionId: s.id,
      paidDuration,
      actualUsage,
      efficiency: actualUsage / paidDuration,
      overpaid: Math.max(0, paidDuration - actualUsage)
    }
  })
  
  const avgEfficiency = efficiencyData.reduce((sum, e) => sum + e.efficiency, 0) / efficiencyData.length
  const totalOverpaid = efficiencyData.reduce((sum, e) => sum + e.overpaid, 0)
  
  return {
    avgDuration,
    mostFrequentZone,
    avgCost,
    peakHour: parseInt(peakHour),
    avgEfficiency,
    totalOverpaid,
    totalSessions: sessions.length,
    zoneFrequency,
    hourPatterns,
    efficiencyData
  }
}

// Call Echo AI with structured prompts
async function callEchoAI(type: string, signals: any): Promise<string> {
  const ECHO_API_KEY = process.env.ECHO_AI_API_KEY || process.env.ECHO_MERIT_API_KEY
  
  if (!ECHO_API_KEY) {
    console.log('🔧 Echo API key not configured, using fallback')
    return JSON.stringify(getFallbackRecommendation(type, 'AI service unavailable'))
  }

  try {
    const prompt = createStructuredPrompt(type, signals)
    
    const response = await fetch('https://api.echo.merit.systems/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ECHO_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ParkPay/1.0'
      },
      body: JSON.stringify({
        message: prompt,
        context: {
          type,
          signals,
          timestamp: new Date().toISOString()
        },
        model: 'openai/gpt-4',
        temperature: 0.0, // Deterministic suggestions
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`Echo API error: ${response.status}`)
    }

    const data = await response.json()
    return data.response || data.message || ''
  } catch (error) {
    console.error('Error calling Echo AI:', error)
    return JSON.stringify(getFallbackRecommendation(type, 'AI service error', signals))
  }
}

// Create structured prompts for each recommendation type
function createStructuredPrompt(type: string, signals: any): string {
  const basePrompt = `You are an AI assistant for ParkPay, a smart parking payment app using XRPL blockchain and RLUSD tokens.

REAL USER DATA:
- User ID: ${signals.userId}
- Total Sessions: ${signals.sessions.length}
- Wallet Balance: ${signals.wallet.balance} RLUSD
- Recent Transactions: ${JSON.stringify(signals.wallet.recentTransactions)}
- Available Parking Lots: ${JSON.stringify(signals.parkingLots)}
- Real-time Spot Availability: ${JSON.stringify(signals.spots)}
- User Patterns: ${JSON.stringify(signals.userPatterns)}
- Current Time: ${new Date().toLocaleString()}

Generate ONE recommendation card as valid JSON with this exact schema:
{
  "id": string,
  "title": string,
  "summary": string,
  "reason": string,
  "score": number,
  "cta": string,
  "ctaType": "navigate" | "action" | "toggle" | "payment",
  "meta": object
}

Return ONLY the JSON object, no other text.`

  switch (type) {
    case 'parking-cost-optimization':
      return `${basePrompt}

ANALYZE REAL DATA: User's actual parking history + real pricing data + location patterns.

Focus on:
- Compare user's most frequent zone (${signals.userPatterns.mostFrequentZone}) with other available zones
- Analyze real pricing differences between parking lots: ${signals.parkingLots.map(lot => `${lot.name}: $${lot.ratePerMin}/min`).join(', ')}
- Calculate actual savings based on user's average session duration (${signals.userPatterns.avgDuration} min)
- Consider user's peak parking hour (${signals.userPatterns.peakHour}:00) for time-based pricing

Provide specific insights using REAL data:
- "You park ${signals.userPatterns.totalSessions} times in ${signals.userPatterns.mostFrequentZone} at $${signals.userPatterns.avgCost} average. [Other Zone] offers $X savings."
- "Your ${signals.userPatterns.avgDuration}-min sessions cost $X in Zone A vs $Y in Zone B."

Action should be: "Show Cheaper Spots" with meta: { action: "findCheaperSpots", zones: ["actual cheaper zones"], savings: "calculated percentage" }`

    case 'dynamic-demand-forecast':
      return `${basePrompt}

ANALYZE REAL DATA: Real-time spot availability + historical patterns + user behavior.

Focus on:
- Current spot availability: ${signals.spots.filter(s => s.isAvailable).length}/${signals.spots.length} spots available
- User's peak hour (${signals.userPatterns.peakHour}:00) vs current hour (${new Date().getHours()}:00)
- Real parking lot capacity: ${signals.parkingLots.map(lot => `${lot.name}: ${lot.availableSpots}/${lot.totalSpots}`).join(', ')}
- Predict demand based on user's historical patterns

Provide specific insights using REAL data:
- "Your usual parking time (${signals.userPatterns.peakHour}:00) shows ${signals.spots.filter(s => s.isAvailable).length} available spots. Demand typically peaks at X PM."
- "Zone ${signals.userPatterns.mostFrequentZone} has ${signals.spots.filter(s => s.parkingLotId === signals.userPatterns.mostFrequentZone && s.isAvailable).length} spots now vs usual ${signals.userPatterns.zoneFrequency[signals.userPatterns.mostFrequentZone]} sessions."

Action should be: "Reserve Early" with meta: { action: "reserveEarly", zone: "actual zone", urgency: "calculated urgency", savings: "calculated savings" }`

    case 'session-efficiency-insight':
      return `${basePrompt}

ANALYZE REAL DATA: User's actual session efficiency patterns + overpayment analysis.

Focus on:
- User's average efficiency: ${signals.userPatterns.avgEfficiency ? (signals.userPatterns.avgEfficiency * 100).toFixed(1) : 0}%
- Total overpaid amount: ${signals.userPatterns.totalOverpaid ? signals.userPatterns.totalOverpaid.toFixed(2) : 0} RLUSD
- Average session duration: ${signals.userPatterns.avgDuration} minutes
- Efficiency breakdown: ${JSON.stringify(signals.userPatterns.efficiencyData?.slice(0, 5))}

Provide specific insights using REAL data:
- "You've overpaid ${signals.userPatterns.totalOverpaid ? signals.userPatterns.totalOverpaid.toFixed(2) : 0} RLUSD across ${signals.userPatterns.totalSessions} sessions."
- "Your efficiency is ${signals.userPatterns.avgEfficiency ? (signals.userPatterns.avgEfficiency * 100).toFixed(1) : 0}% - enable smart auto-end to save ~${signals.userPatterns.totalOverpaid ? (signals.userPatterns.totalOverpaid * 0.1).toFixed(2) : 0} RLUSD weekly."

Action should be: "Enable Smart End" with meta: { action: "enableSmartEnd", savings: "calculated percentage", weeklySavings: "calculated RLUSD amount" }`

    case 'wallet-health-insight':
      return `${basePrompt}

ANALYZE REAL DATA: User's actual spending patterns + wallet balance + transaction history.

Focus on:
- Current balance: ${signals.wallet.balance} RLUSD
- Average cost per session: ${signals.userPatterns.avgCost ? signals.userPatterns.avgCost.toFixed(2) : 0} RLUSD
- Total sessions: ${signals.userPatterns.totalSessions}
- Recent transactions: ${JSON.stringify(signals.wallet.recentTransactions.slice(0, 5))}
- Calculate spending velocity and predict when funds will run out

Provide specific insights using REAL data:
- "You spend ${signals.userPatterns.avgCost ? signals.userPatterns.avgCost.toFixed(2) : 0} RLUSD per session. At current balance (${signals.wallet.balance} RLUSD), you have ~${signals.wallet.balance > 0 && signals.userPatterns.avgCost > 0 ? Math.floor(signals.wallet.balance / signals.userPatterns.avgCost) : 0} sessions remaining."
- "Your ${signals.userPatterns.totalSessions} sessions cost ${signals.userPatterns.totalSessions * (signals.userPatterns.avgCost || 0)} RLUSD total. Consider adding funds for uninterrupted parking."

Action should be: "Add Funds" or "Share Balance" with meta: { action: "addFunds" | "shareBalance", amount: "calculated amount", reason: "specific reason based on data" }`

    default:
      return basePrompt
  }
}

// Parse and sanitize AI response
function parseRecommendation(aiResponse: string, type: string, signals?: any): RecommendationCard {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate required fields
      if (parsed.id && parsed.title && parsed.summary && parsed.reason && 
          typeof parsed.score === 'number' && parsed.cta && parsed.ctaType && parsed.meta) {
        return {
          id: parsed.id,
          title: parsed.title,
          summary: parsed.summary,
          reason: parsed.reason,
          score: Math.max(0, Math.min(100, parsed.score)), // Clamp to 0-100
          cta: parsed.cta,
          ctaType: parsed.ctaType,
          meta: parsed.meta
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse AI response:', error)
  }
  
  return getFallbackRecommendation(type, 'Unable to parse AI response', signals)
}

// Generate fallback recommendations using real data when available
function getFallbackRecommendation(type: string, message: string, signals?: any): RecommendationCard {
  // Use real data if available, otherwise use generic fallbacks
  const hasRealData = signals && signals.userPatterns && Object.keys(signals.userPatterns).length > 0
  
  if (hasRealData) {
    const patterns = signals.userPatterns
    const wallet = signals.wallet
    const sessions = signals.sessions
    
    switch (type) {
      case 'parking-cost-optimization':
        return {
          id: 'cost-opt-real-fallback',
          title: 'Cost Optimization',
          summary: `Analyze your ${patterns.totalSessions} sessions in ${patterns.mostFrequentZone}`,
          reason: `You've spent ${patterns.avgCost ? patterns.avgCost.toFixed(2) : 0} RLUSD per session on average. Compare with other zones for savings.`,
          score: 75,
          cta: 'Show Cheaper Spots',
          ctaType: 'action' as const,
          meta: { action: 'findCheaperSpots', zones: [patterns.mostFrequentZone], savings: 'calculated' }
        }
      
      case 'dynamic-demand-forecast':
        return {
          id: 'demand-forecast-real-fallback',
          title: 'Demand Forecast',
          summary: `Your peak parking time: ${patterns.peakHour}:00`,
          reason: `Based on ${patterns.totalSessions} sessions, you typically park at ${patterns.peakHour}:00. Check current availability.`,
          score: 80,
          cta: 'Reserve Early',
          ctaType: 'action' as const,
          meta: { action: 'reserveEarly', zone: patterns.mostFrequentZone, urgency: 'medium', savings: 'calculated' }
        }
      
      case 'session-efficiency-insight':
        return {
          id: 'efficiency-real-fallback',
          title: 'Session Efficiency',
          summary: `Efficiency: ${patterns.avgEfficiency ? (patterns.avgEfficiency * 100).toFixed(1) : 0}%`,
          reason: `You've overpaid ${patterns.totalOverpaid ? patterns.totalOverpaid.toFixed(2) : 0} RLUSD across ${patterns.totalSessions} sessions.`,
          score: 85,
          cta: 'Enable Smart End',
          ctaType: 'toggle' as const,
          meta: { action: 'enableSmartEnd', savings: 'calculated', weeklySavings: patterns.totalOverpaid ? patterns.totalOverpaid.toFixed(2) : '0' }
        }
      
      case 'wallet-health-insight':
        const sessionsRemaining = wallet.balance > 0 && patterns.avgCost > 0 ? Math.floor(wallet.balance / patterns.avgCost) : 0
        return {
          id: 'wallet-health-real-fallback',
          title: 'Wallet Health',
          summary: `Balance: ${wallet.balance} RLUSD (~${sessionsRemaining} sessions)`,
          reason: `You spend ${patterns.avgCost ? patterns.avgCost.toFixed(2) : 0} RLUSD per session. Consider adding funds for uninterrupted parking.`,
          score: 70,
          cta: 'Add Funds',
          ctaType: 'payment' as const,
          meta: { action: 'addFunds', amount: 'calculated', reason: 'balance management' }
        }
    }
  }
  
  // Generic fallbacks when no real data available
  const fallbacks = {
    'parking-cost-optimization': {
      id: 'cost-opt-fallback',
      title: 'Cost Optimization',
      summary: 'Analyze your parking patterns to find savings',
      reason: 'No session data available yet. Start parking to get personalized cost optimization insights.',
      score: 50,
      cta: 'View Map',
      ctaType: 'navigate' as const,
      meta: { url: '/map' }
    },
    'dynamic-demand-forecast': {
      id: 'demand-forecast-fallback',
      title: 'Demand Forecast',
      summary: 'Get insights into parking availability trends',
      reason: 'No session data available yet. Start parking to get demand predictions.',
      score: 50,
      cta: 'Check Availability',
      ctaType: 'navigate' as const,
      meta: { url: '/map' }
    },
    'session-efficiency-insight': {
      id: 'efficiency-fallback',
      title: 'Session Efficiency',
      summary: 'Optimize your parking session patterns',
      reason: 'No session data available yet. Start parking to get efficiency insights.',
      score: 50,
      cta: 'View Sessions',
      ctaType: 'navigate' as const,
      meta: { url: '/sessions' }
    },
    'wallet-health-insight': {
      id: 'wallet-health-fallback',
      title: 'Wallet Health',
      summary: 'Manage your RLUSD balance effectively',
      reason: 'No transaction data available yet. Start parking to get spending insights.',
      score: 50,
      cta: 'Manage Wallet',
      ctaType: 'navigate' as const,
      meta: { url: '/wallet' }
    }
  }
  
  return fallbacks[type as keyof typeof fallbacks] || fallbacks['parking-cost-optimization']
}
