import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

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

// Echo AI Chat endpoint
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
    
    // Simulate Echo AI response (in real implementation, call Echo AI API)
    const response = await simulateEchoAIResponse(message, {
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
    console.error('Error in AI chat:', error);
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

// Helper functions
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

export default router;
