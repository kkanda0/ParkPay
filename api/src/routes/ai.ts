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
      message: response.message,
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

// Echo/Gemini/OpenAI integration with graceful sequential fallback
async function callEchoMeritAPI(message: string, context: any) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ECHO_API_KEY = process.env.ECHO_AI_API_KEY;

  console.log('🔐 Keys → Gemini:', !!GEMINI_API_KEY, 'OpenAI:', !!OPENAI_API_KEY, 'Echo:', !!ECHO_API_KEY);

  // 1) Try Gemini first if configured
  if (GEMINI_API_KEY) {
    try {
      console.log('🤖 Trying Gemini first...');
      return await callGeminiAPI(message, context, GEMINI_API_KEY);
    } catch (err) {
      console.warn('⚠️ Gemini failed, continuing to next provider:', (err as Error)?.message);
    }
  }

  // 2) Try OpenAI second if configured
  if (OPENAI_API_KEY) {
    try {
      console.log('🤖 Trying OpenAI next...');
      return await callOpenAIAPI(message, context, OPENAI_API_KEY);
    } catch (err) {
      console.warn('⚠️ OpenAI failed, continuing to next provider:', (err as Error)?.message);
    }
  }

  // 3) Try Echo last if configured
  if (ECHO_API_KEY) {
    try {
      console.log('🤖 Trying Echo last...');
      const contextData = {
        parking: {
          session: context.sessionContext,
          parkingLot: context.parkingLotContext,
          walletAddress: context.walletAddress
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch('https://api.echo.merit.com/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ECHO_API_KEY}`,
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
        const errorText = await response.text();
        console.error('Echo API error:', response.status, errorText);
        throw new Error(`Echo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Echo API response:', data);

      return {
        message: data.response || data.message || 'I received your message and I\'m processing it.',
        suggestions: data.suggestions || [
          "How does ParkPay work?",
          "Check my balance",
          "Find parking spots",
          "View my sessions"
        ]
      };
    } catch (err) {
      console.warn('⚠️ Echo failed, no more providers left:', (err as Error)?.message);
    }
  }

  // 4) All providers failed → simulated answer
  console.log('🔄 All providers failed or not configured. Using simulated response.');
  return simulateEchoAIResponse(message, context);
}

// Gemini API Integration
async function callGeminiAPI(message: string, context: any, apiKey: string) {
  try {
    // Primary: latest flash model on v1beta
    let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `You are Echo AI, a smart parking assistant for ParkPay. Help users with parking, payments via XRPL blockchain, and RLUSD tokens. Be helpful and conversational.

User message: ${message}
Context: ${JSON.stringify(context)}

Respond naturally and provide relevant suggestions.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    // Fallback: try v1 with flash-latest, then legacy gemini-pro
    if (!response.ok) {
      const errText1 = await response.text().catch(() => '');
      if (response.status === 404) {
        url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `You are Echo AI...\n\nUser message: ${message}\nContext: ${JSON.stringify(context)}` }]}],
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
          })
        });
      }

      if (!response.ok) {
        const errText2 = await response.text().catch(() => errText1 || '');
        throw new Error(`Gemini API error: ${response.status} ${errText2}`);
      }
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I received your message and I\'m processing it.';

    return {
      message: aiResponse,
      suggestions: [
        "Check my balance",
        "Find parking spots", 
        "View active sessions",
        "How does ParkPay work?"
      ]
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// OpenAI API Integration
async function callOpenAIAPI(message: string, context: any, apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'You are Echo AI, a smart parking assistant for ParkPay. Help users with parking, payments via XRPL blockchain, and RLUSD tokens. Be helpful and conversational.'
        }, {
          role: 'user',
          content: message
        }],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I received your message and I\'m processing it.';

    return {
      message: aiResponse,
      suggestions: [
        "Check my balance",
        "Find parking spots",
        "View active sessions", 
        "How does ParkPay work?"
      ]
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Fallback helper function
async function simulateEchoAIResponse(message: string, context: any) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const lowerMessage = message.toLowerCase();
  
  // Balance and wallet scenarios
  if (lowerMessage.includes('balance') || lowerMessage.includes('check my balance')) {
    return {
      message: "Your RLUSD wallet balance is 45.67 RLUSD. You have 3 active sessions and 12 completed transactions this month. Would you like to see your recent transaction history?",
      suggestions: ["View transaction history", "Add funds to wallet", "Check active sessions", "Export statements"]
    };
  }
  
  // Charging scenarios
  if (lowerMessage.includes('charge') || lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('billing')) {
    return {
      message: "ParkPay charges $0.15 per minute for parking. Your current session at Downtown Plaza has been running for 23 minutes, totaling $3.45. Charges are settled instantly via XRPL blockchain.",
      suggestions: ["End current session", "View pricing details", "Check session history", "Set spending alerts"]
    };
  }
  
  // Refund scenarios
  if (lowerMessage.includes('refund') || lowerMessage.includes('money back') || lowerMessage.includes('cancel')) {
    return {
      message: "Refunds are processed automatically when sessions end early. For example, if you paid for 2 hours but only used 45 minutes, the unused $1.13 is instantly credited back to your RLUSD wallet via XRPL settlement.",
      suggestions: ["Check refund status", "View transaction history", "End session early", "Contact support"]
    };
  }
  
  // Spot availability scenarios
  if (lowerMessage.includes('spot') || lowerMessage.includes('available') || lowerMessage.includes('find parking') || lowerMessage.includes('where can i park')) {
    return {
      message: "I found 8 available spots near you! Downtown Plaza has 3 spots ($0.15/min), City Center has 2 spots ($0.12/min), and Mall District has 3 spots ($0.18/min). The map shows real-time availability with glowing markers.",
      suggestions: ["Show me available spots", "Navigate to closest lot", "Set availability alerts", "Reserve a spot"]
    };
  }
  
  // Session management scenarios
  if (lowerMessage.includes('session') || lowerMessage.includes('active') || lowerMessage.includes('current')) {
    return {
      message: "You have 1 active session at Downtown Plaza (Spot #12) that started 23 minutes ago. Current cost: $3.45. Your session will auto-renew every hour unless you end it manually.",
      suggestions: ["End current session", "Extend session", "View session details", "Get receipt"]
    };
  }
  
  // Help and how it works scenarios
  if (lowerMessage.includes('how does') || lowerMessage.includes('how it works') || lowerMessage.includes('explain')) {
    return {
      message: "ParkPay uses XRPL blockchain for instant micropayments! Here's how it works: 1) Find a spot on the map, 2) Tap to start session, 3) Park and pay per minute, 4) End session when done. All payments are settled instantly via RLUSD tokens.",
      suggestions: ["Start my first session", "View tutorial", "Check wallet balance", "Find nearby spots"]
    };
  }
  
  // Emergency scenarios
  if (lowerMessage.includes('help') || lowerMessage.includes('emergency') || lowerMessage.includes('stuck') || lowerMessage.includes('problem')) {
    return {
      message: "I'm here to help! If you're having trouble ending a session, experiencing payment issues, or need immediate assistance, I can connect you with our support team. What specific issue are you facing?",
      suggestions: ["End stuck session", "Report payment issue", "Contact support", "Emergency assistance"]
    };
  }
  
  // Payment scenarios
  if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('transaction')) {
    return {
      message: "All ParkPay transactions are processed instantly via XRPL blockchain using RLUSD tokens. No credit cards needed! Your wallet automatically deducts payments and credits refunds. Transaction fees are only $0.0001 per transaction.",
      suggestions: ["View recent transactions", "Add funds to wallet", "Check payment methods", "Export receipts"]
    };
  }
  
  // Enhanced conversational responses based on message content
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      message: "Hello! I'm Echo AI, your smart parking assistant. I'm doing great, thanks for asking! I'm here to help you with all your parking needs using XRPL blockchain technology. How can I assist you today?",
      suggestions: ["Check my balance", "Find parking spots", "How does ParkPay work?", "Start a session"]
    };
  }
  
  // How are you responses
  if (lowerMessage.includes('how are you') || lowerMessage.includes('how do you do')) {
    return {
      message: "I'm doing fantastic! I'm always ready to help with parking, payments, and XRPL transactions. I love assisting users with ParkPay's blockchain-powered parking system. What would you like to know about?",
      suggestions: ["Tell me about ParkPay", "Check my balance", "Find parking spots", "View my sessions"]
    };
  }
  
  // General questions
  if (lowerMessage.includes('what') || lowerMessage.includes('tell me') || lowerMessage.includes('explain')) {
    return {
      message: "I'd be happy to explain! ParkPay is a revolutionary parking system that uses XRPL blockchain for instant micropayments. You can find spots, pay with RLUSD tokens, and get instant refunds. What specifically would you like to know more about?",
      suggestions: ["How does ParkPay work?", "What is XRPL?", "How do payments work?", "Find parking spots"]
    };
  }
  
  // Default conversational response
  const responses = [
    "That's interesting! I'm here to help with all your parking needs. ParkPay makes parking simple with XRPL blockchain payments and RLUSD tokens.",
    "Great question! I can assist with finding spots, managing sessions, checking balances, and handling payments. What would you like to explore?",
    "I'd be happy to help! ParkPay uses smart contracts on XRPL for seamless parking payments. What specifically interests you?",
    "Thanks for reaching out! I'm your AI assistant for ParkPay's blockchain-powered parking system. How can I help you today?"
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    message: randomResponse,
    suggestions: ["Check my balance", "Find parking spots", "View active sessions", "How does ParkPay work?"]
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
