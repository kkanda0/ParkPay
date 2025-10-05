import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const router = Router();

// Validation schemas
const chatSchema = z.object({
  message: z.string().min(1),
  walletAddress: z.string().optional(),
  context: z.object({
    sessionId: z.string().optional(),
    parkingLotId: z.string().optional()
  }).optional()
});

const pricingSchema = z.object({
  action: z.enum(['calculate', 'checkWhy']),
  lat: z.number(),
  lon: z.number(),
  baseUSD: z.number().optional().default(5.0),
  locationName: z.string().optional(),
  currentPrice: z.number().optional(),
  timestamp: z.string().optional()
});

// Echo Pricing endpoint
router.post('/echo-pricing', async (req, res) => {
  try {
    const { action, lat, lon, baseUSD, locationName, currentPrice } = pricingSchema.parse(req.body);
    
    if (action === 'calculate') {
      // Calculate dynamic pricing using AI
      const pricing = await calculateDynamicPricing(lat, lon, baseUSD, locationName);
      
      res.json({
        success: true,
        data: pricing
      });
    } else if (action === 'checkWhy') {
      // Get explanation for pricing
      const explanation = await getPricingExplanation(lat, lon, currentPrice, locationName);
      
      res.json({
        success: true,
        data: explanation
      });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
    
  } catch (error) {
    console.error('Error in echo pricing:', error);
    res.status(500).json({ error: 'Failed to calculate pricing' });
  }
});

// Echo by Merit Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { message, walletAddress, context } = chatSchema.parse(req.body);
    
    // Get relevant context for the AI
    let sessionContext = null;
    let parkingLotContext = null;
    
    if (context?.sessionId) {
      sessionContext = await prisma.session.findUnique({
        where: { id: context.sessionId },
        include: { spot: true, parkingLot: true }
      });
    }
    
    if (context?.parkingLotId) {
      parkingLotContext = await prisma.parkingLot.findUnique({
        where: { id: context.parkingLotId },
        include: { spots: true }
      });
    }
    
    // Call Echo by Merit API
    const response = await callEchoMeritAPI(message, {
      sessionContext,
      parkingLotContext,
      walletAddress
    });
    
    res.json({
      response: response.message,
      suggestions: response.suggestions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in Echo by Merit chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// AI Analysis endpoint for anomaly detection
router.post('/analyze', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { parkingLotId } = req.body;
    
    // Get recent sessions for analysis
    const recentSessions = await prisma.session.findMany({
      where: {
        parkingLotId,
        startTime: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: { spot: true }
    });
    
    // Simulate AI analysis
    const analysis = await simulateAnomalyAnalysis(recentSessions);
    
    // Create anomaly records if any are detected
    if (analysis.anomalies.length > 0) {
      await prisma.anomaly.createMany({
        data: analysis.anomalies.map(anomaly => ({
          type: anomaly.type,
          description: anomaly.description,
          walletAddress: anomaly.walletAddress,
          sessionId: anomaly.sessionId,
          severity: anomaly.severity
        }))
      });
    }
    
    res.json({
      analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in AI analysis:', error);
    res.status(500).json({ error: 'Failed to perform AI analysis' });
  }
});

// Get AI insights for provider dashboard
router.get('/insights/:parkingLotId', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { parkingLotId } = req.params;
    
    // Get parking lot data
    const parkingLot = await prisma.parkingLot.findUnique({
      where: { id: parkingLotId },
      include: {
        spots: true,
        sessions: {
          where: {
            startTime: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        }
      }
    });
    
    if (!parkingLot) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }
    
    // Calculate insights
    const totalRevenue = parkingLot.sessions.reduce((sum, session) => 
      sum + (session.totalAmount || 0), 0
    );
    
    const avgSessionDuration = parkingLot.sessions.length > 0 
      ? parkingLot.sessions.reduce((sum, session) => {
          const duration = session.endTime 
            ? session.endTime.getTime() - session.startTime.getTime()
            : Date.now() - session.startTime.getTime();
          return sum + duration;
        }, 0) / parkingLot.sessions.length / (1000 * 60) // Convert to minutes
      : 0;
    
    const occupancyRate = parkingLot.spots.filter(spot => !spot.isAvailable).length / parkingLot.totalSpots;
    
    // Generate AI recommendations
    const recommendations = generateRecommendations({
      totalRevenue,
      avgSessionDuration,
      occupancyRate,
      totalSpots: parkingLot.totalSpots,
      ratePerMin: parkingLot.ratePerMin
    });
    
    res.json({
      insights: {
        totalRevenue,
        avgSessionDuration: Math.round(avgSessionDuration),
        occupancyRate: Math.round(occupancyRate * 100),
        totalSessions: parkingLot.sessions.length,
        availableSpots: parkingLot.spots.filter(spot => spot.isAvailable).length
      },
      recommendations,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

// Echo by Merit API Integration using Merit's SDK
async function callEchoMeritAPI(message: string, context: any) {
  const ECHO_MERIT_API_KEY = process.env.ECHO_MERIT_API_KEY;
  
  if (!ECHO_MERIT_API_KEY) {
    console.warn('Echo by Merit API key not configured, using fallback response');
    return simulateEchoAIResponse(message, context);
  }
  
  try {
    // Prepare context for Echo by Merit
    const contextData = {
      parking: {
        session: context.sessionContext,
        parkingLot: context.parkingLotContext,
        walletAddress: context.walletAddress
      },
      timestamp: new Date().toISOString()
    };
    
    // Call Echo by Merit API using their standard endpoint
    const response = await fetch('https://api.echo.merit.systems/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ECHO_MERIT_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ParkPay/1.0'
      },
      body: JSON.stringify({
        message,
        context: contextData,
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`Echo by Merit API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      message: data.response || data.message || 'I received your message and I\'m processing it.',
      suggestions: data.suggestions || [
        "How does ParkPay work?",
        "Check my balance", 
        "Find parking spots",
        "View my sessions"
      ]
    };
    
  } catch (error) {
    console.error('Echo by Merit API call failed:', error);
    // Fallback to simulated response
    return simulateEchoAIResponse(message, context);
  }
}

// Fallback helper function
async function simulateEchoAIResponse(message: string, context: any) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('charge') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
    return {
      message: "I can help you understand your parking charges. Each session is billed per minute at the current rate. You can view your session details and transaction history in your wallet.",
      suggestions: ["View my session history", "How are charges calculated?", "Check my RLUSD balance"]
    };
  }
  
  if (lowerMessage.includes('refund') || lowerMessage.includes('money back')) {
    return {
      message: "Refunds are processed automatically when sessions end early. The unused time is credited back to your RLUSD wallet instantly via XRPL settlement.",
      suggestions: ["Check my refund status", "View transaction history", "Contact support"]
    };
  }
  
  if (lowerMessage.includes('spot') || lowerMessage.includes('available')) {
    return {
      message: "I can help you find available parking spots. The map shows real-time availability with glowing markers for open spots.",
      suggestions: ["Show me available spots", "Navigate to parking lot", "Set up notifications"]
    };
  }
  
  return {
    message: "I'm here to help with your parking needs! I can assist with session management, billing questions, spot availability, and XRPL transactions. What would you like to know?",
    suggestions: ["How does ParkPay work?", "Check my balance", "Find parking spots", "View my sessions"]
  };
}

async function simulateAnomalyAnalysis(sessions: any[]) {
  const anomalies = [];
  
  // Check for rapid session start/end patterns
  const walletSessions = sessions.reduce((acc, session) => {
    if (!acc[session.walletAddress]) {
      acc[session.walletAddress] = [];
    }
    acc[session.walletAddress].push(session);
    return acc;
  }, {});
  
  Object.entries(walletSessions).forEach(([wallet, walletSessions]: [string, any]) => {
    if (walletSessions.length > 10) {
      anomalies.push({
        type: 'HIGH_FREQUENCY_USAGE',
        description: `Suspicious high frequency usage by wallet ${wallet.slice(0, 8)}...`,
        walletAddress: wallet,
        severity: 'MEDIUM'
      });
    }
    
    // Check for very short sessions
    const shortSessions = walletSessions.filter(session => {
      const duration = session.endTime 
        ? session.endTime.getTime() - session.startTime.getTime()
        : Date.now() - session.startTime.getTime();
      return duration < 60000; // Less than 1 minute
    });
    
    if (shortSessions.length > 5) {
      anomalies.push({
        type: 'RAPID_SESSION_START_END',
        description: `Multiple rapid session start/end by wallet ${wallet.slice(0, 8)}...`,
        walletAddress: wallet,
        severity: 'HIGH'
      });
    }
  });
  
  return {
    anomalies,
    summary: `Analyzed ${sessions.length} sessions, found ${anomalies.length} anomalies`
  };
}

function generateRecommendations(data: any) {
  const recommendations = [];
  
  if (data.occupancyRate > 0.9) {
    recommendations.push({
      type: 'PRICING',
      title: 'High Demand Detected',
      description: `Occupancy rate is ${Math.round(data.occupancyRate * 100)}%. Consider increasing rates during peak hours.`,
      suggestedRate: data.ratePerMin * 1.2
    });
  }
  
  if (data.avgSessionDuration < 30) {
    recommendations.push({
      type: 'OPERATIONS',
      title: 'Short Session Pattern',
      description: 'Average session duration is low. Consider minimum session requirements.',
      suggestedRate: data.ratePerMin
    });
  }
  
  if (data.totalRevenue < data.totalSpots * 10) {
    recommendations.push({
      type: 'MARKETING',
      title: 'Low Revenue Alert',
      description: 'Revenue is below expected levels. Consider promotional rates or marketing campaigns.',
      suggestedRate: data.ratePerMin * 0.8
    });
  }
  
  return recommendations;
}

// Echo by Merit user sync function
async function syncUserWithEchoMerit(user: any) {
  const ECHO_MERIT_API_KEY = process.env.ECHO_MERIT_API_KEY;
  const ECHO_MERIT_BASE_URL = process.env.ECHO_MERIT_BASE_URL || 'https://api.echo.merit.com';
  
  if (!ECHO_MERIT_API_KEY) {
    console.warn('Echo by Merit API key not configured, skipping user sync');
    return;
  }
  
  try {
    const response = await fetch(`${ECHO_MERIT_BASE_URL}/v1/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ECHO_MERIT_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ParkPay/1.0'
      },
      body: JSON.stringify({
        userId: user.id,
        auth0Id: user.auth0Id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        preferences: JSON.parse(user.preferences),
        parkingHistory: JSON.parse(user.parkingHistory),
        createdAt: user.createdAt
      })
    });
    
    if (response.ok) {
      console.log(`✅ User ${user.email} synced with Echo by Merit`);
    } else {
      console.error(`❌ Failed to sync user with Echo by Merit: ${response.status}`);
    }
  } catch (error) {
    console.error('Error syncing user with Echo by Merit:', error);
  }
}

// Echo by Merit Authentication Endpoints
const JWT_SECRET = process.env.JWT_SECRET || 'echo-ai-secret-key-change-in-production';

// Register new user endpoint
router.post('/auth/register', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { email, name, password } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        auth0Id: `merit_${Date.now()}`, // Generate unique ID
        email,
        name,
        picture: null,
        preferences: JSON.stringify({
          notifications: true,
          darkMode: true,
          language: 'en'
        }),
        parkingHistory: JSON.stringify({
          totalSessions: 0,
          totalSpent: 0,
          favoriteSpots: []
        })
      }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log(`✅ New user registered: ${user.email}`);
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: JSON.parse(user.preferences),
        parkingHistory: JSON.parse(user.parkingHistory)
      },
      message: 'User registered successfully'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Sign in user endpoint
router.post('/auth/login', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log(`✅ User signed in: ${user.email}`);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: JSON.parse(user.preferences),
        parkingHistory: JSON.parse(user.parkingHistory)
      },
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /api/ai/auth/validate
router.get('/auth/validate', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Find user by meritUserId
    const user = await prisma.user.findUnique({
      where: { auth0Id: decoded.meritUserId }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        meritUserId: user.auth0Id,
        email: user.email,
        name: user.name,
        avatar: user.picture,
        preferences: JSON.parse(user.preferences),
        parkingHistory: JSON.parse(user.parkingHistory)
      },
      message: 'Token valid'
    });
    
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Dynamic pricing calculation using AI
async function calculateDynamicPricing(lat: number, lon: number, baseUSD: number, locationName?: string) {
  // Simulate AI-powered dynamic pricing based on location, time, and demand
  const timeOfDay = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  
  // Base pricing factors
  let locationMultiplier = 1.0;
  let timeMultiplier = 1.0;
  let demandMultiplier = 1.0;
  
  // Location-based pricing (Manhattan premium)
  if (lat >= 40.7 && lat <= 40.8 && lon >= -74.05 && lon <= -73.9) {
    locationMultiplier = 1.5; // Manhattan premium
  } else if (lat >= 40.6 && lat <= 40.7) {
    locationMultiplier = 1.2; // Brooklyn/Queens
  }
  
  // Time-based pricing
  if (timeOfDay >= 7 && timeOfDay <= 9) {
    timeMultiplier = 1.3; // Morning rush
  } else if (timeOfDay >= 17 && timeOfDay <= 19) {
    timeMultiplier = 1.4; // Evening rush
  } else if (timeOfDay >= 22 || timeOfDay <= 6) {
    timeMultiplier = 0.7; // Night discount
  }
  
  // Day-based pricing
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    timeMultiplier *= 1.1; // Weekday premium
  }
  
  // Random demand factor (simulating real-time demand)
  demandMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  
  // Calculate final price
  const priceUSD = baseUSD * locationMultiplier * timeMultiplier * demandMultiplier;
  const priceRLUSD = priceUSD * 1.0004; // RLUSD conversion rate
  
  // Generate explanation
  const factors = [];
  if (locationMultiplier > 1.0) factors.push(`Location premium (${Math.round((locationMultiplier - 1) * 100)}%)`);
  if (timeMultiplier > 1.0) factors.push(`Peak time pricing (${Math.round((timeMultiplier - 1) * 100)}%)`);
  if (demandMultiplier > 1.0) factors.push(`High demand (${Math.round((demandMultiplier - 1) * 100)}%)`);
  if (demandMultiplier < 1.0) factors.push(`Low demand (${Math.round((1 - demandMultiplier) * 100)}% discount)`);
  
  return {
    priceUSD: Math.round(priceUSD * 100) / 100,
    priceRLUSD: Math.round(priceRLUSD * 10000) / 10000,
    rlusdRate: 1.0004,
    explanation: `Dynamic pricing based on location, time, and demand. ${factors.join(', ')}.`,
    confidence: 85,
    components: {
      basePrice: baseUSD,
      locationMultiplier,
      timeMultiplier,
      demandMultiplier,
      finalPrice: priceUSD
    },
    marketFactors: factors,
    streetAddress: locationName || 'Parking Location',
    nearbySpots: [
      {
        name: 'Nearby Garage 1',
        address: '123 Main St',
        price: priceUSD * 0.9,
        distance: '0.2 miles',
        availability: 'Available'
      },
      {
        name: 'Nearby Garage 2', 
        address: '456 Oak Ave',
        price: priceUSD * 1.1,
        distance: '0.4 miles',
        availability: 'Limited'
      }
    ]
  };
}

// Get pricing explanation
async function getPricingExplanation(lat: number, lon: number, currentPrice: number, locationName?: string) {
  const timeOfDay = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  
  const explanations = [];
  const factors = [];
  const recommendations = [];
  
  // Location analysis
  if (lat >= 40.7 && lat <= 40.8 && lon >= -74.05 && lon <= -73.9) {
    explanations.push('This is a premium Manhattan location with high demand and limited parking availability.');
    factors.push('Prime Manhattan location');
    factors.push('High foot traffic area');
    recommendations.push('Consider booking in advance during peak hours');
  }
  
  // Time analysis
  if (timeOfDay >= 7 && timeOfDay <= 9 || timeOfDay >= 17 && timeOfDay <= 19) {
    explanations.push('Current pricing reflects peak commuting hours with increased demand.');
    factors.push('Rush hour pricing');
    recommendations.push('Consider parking during off-peak hours for lower rates');
  }
  
  // Day analysis
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    explanations.push('Weekday pricing includes business district premium.');
    factors.push('Business day premium');
  } else {
    explanations.push('Weekend pricing with reduced business activity.');
    factors.push('Weekend rates');
    recommendations.push('Weekend parking typically offers better value');
  }
  
  return {
    explanation: explanations.join(' ') || 'Standard market pricing based on location and time.',
    factors,
    recommendations
  };
}

export default router;
