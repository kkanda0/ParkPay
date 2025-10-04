import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Get provider dashboard data
router.get('/dashboard/:parkingLotId', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { parkingLotId } = req.params;
    
    // Get parking lot with spots and recent sessions
    const parkingLot = await prisma.parkingLot.findUnique({
      where: { id: parkingLotId },
      include: {
        spots: true,
        sessions: {
          where: {
            startTime: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: { startTime: 'desc' }
        }
      }
    });
    
    if (!parkingLot) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }
    
    // Calculate metrics
    const totalRevenue = parkingLot.sessions.reduce((sum, session) => 
      sum + (session.totalAmount || 0), 0
    );
    
    const activeSessions = parkingLot.sessions.filter(session => session.status === 'ACTIVE');
    const occupancyRate = activeSessions.length / parkingLot.totalSpots;
    
    // Get hourly revenue data for chart
    const hourlyRevenue = Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date();
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1, 0, 0, 0);
      
      const hourSessions = parkingLot.sessions.filter(session => {
        const sessionStart = new Date(session.startTime);
        return sessionStart >= hourStart && sessionStart < hourEnd;
      });
      
      return {
        hour,
        revenue: hourSessions.reduce((sum, session) => sum + (session.totalAmount || 0), 0),
        sessions: hourSessions.length
      };
    });
    
    // Get recent anomalies
    const anomalies = await prisma.anomaly.findMany({
      where: {
        resolved: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    res.json({
      parkingLot: {
        id: parkingLot.id,
        name: parkingLot.name,
        address: parkingLot.address,
        totalSpots: parkingLot.totalSpots,
        ratePerMin: parkingLot.ratePerMin
      },
      metrics: {
        totalRevenue,
        occupancyRate: Math.round(occupancyRate * 100),
        activeSessions: activeSessions.length,
        availableSpots: parkingLot.spots.filter(spot => spot.isAvailable).length,
        totalSessions: parkingLot.sessions.length
      },
      hourlyRevenue,
      anomalies: anomalies.map(anomaly => ({
        id: anomaly.id,
        type: anomaly.type,
        description: anomaly.description,
        severity: anomaly.severity,
        createdAt: anomaly.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error fetching provider dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get occupancy heatmap
router.get('/occupancy/:parkingLotId', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { parkingLotId } = req.params;
    
    const spots = await prisma.spot.findMany({
      where: { parkingLotId },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE'
          }
        }
      },
      orderBy: { number: 'asc' }
    });
    
    const heatmap = spots.map(spot => ({
      id: spot.id,
      number: spot.number,
      isAvailable: spot.isAvailable,
      isOccupied: !spot.isAvailable,
      activeSession: spot.sessions[0] || null
    }));
    
    res.json({ heatmap });
    
  } catch (error) {
    console.error('Error fetching occupancy:', error);
    res.status(500).json({ error: 'Failed to fetch occupancy data' });
  }
});

// Update parking lot settings
router.put('/settings/:parkingLotId', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { parkingLotId } = req.params;
    const { ratePerMin, name, address } = req.body;
    
    const updatedLot = await prisma.parkingLot.update({
      where: { id: parkingLotId },
      data: {
        ...(ratePerMin && { ratePerMin }),
        ...(name && { name }),
        ...(address && { address })
      }
    });
    
    res.json(updatedLot);
    
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Resolve anomaly
router.post('/anomaly/:anomalyId/resolve', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { anomalyId } = req.params;
    
    const anomaly = await prisma.anomaly.update({
      where: { id: anomalyId },
      data: { resolved: true }
    });
    
    res.json(anomaly);
    
  } catch (error) {
    console.error('Error resolving anomaly:', error);
    res.status(500).json({ error: 'Failed to resolve anomaly' });
  }
});

export default router;
