import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();

// Validation schemas
const startSessionSchema = z.object({
  walletAddress: z.string().min(1),
  spotId: z.string().min(1),
});

const endSessionSchema = z.object({
  sessionId: z.string().min(1),
});

// Start a parking session
router.post('/start', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const io = req.app.get('io');
    
    const { walletAddress, spotId } = startSessionSchema.parse(req.body);
    
    // Get spot and parking lot info
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: { parkingLot: true }
    });
    
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    
    if (!spot.isAvailable) {
      return res.status(400).json({ error: 'Spot is not available' });
    }
    
    // Create session
    const session = await prisma.session.create({
      data: {
        walletAddress,
        spotId,
        parkingLotId: spot.parkingLotId,
        startTime: new Date(),
        status: 'ACTIVE'
      },
      include: {
        spot: true,
        parkingLot: true
      }
    });
    
    // Update spot availability
    await prisma.spot.update({
      where: { id: spotId },
      data: { isAvailable: false }
    });
    
    // Emit real-time update
    io.to(`lot-${spot.parkingLotId}`).emit('spot-updated', {
      spotId,
      isAvailable: false,
      sessionId: session.id
    });
    
    res.json({
      sessionId: session.id,
      spotNumber: spot.number,
      parkingLot: spot.parkingLot.name,
      startTime: session.startTime,
      ratePerMin: spot.parkingLot.ratePerMin
    });
    
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// End a parking session
router.post('/end', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const io = req.app.get('io');
    
    const { sessionId } = endSessionSchema.parse(req.body);
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { spot: true, parkingLot: true }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is not active' });
    }
    
    const endTime = new Date();
    const durationMs = endTime.getTime() - session.startTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    const totalAmount = durationMinutes * session.parkingLot.ratePerMin;
    
    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        endTime,
        totalAmount,
        status: 'ENDED',
        xrplTxHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });
    
    // Update spot availability
    await prisma.spot.update({
      where: { id: session.spotId },
      data: { isAvailable: true }
    });
    
    // Emit real-time updates
    io.to(`lot-${session.parkingLotId}`).emit('session-ended', {
      sessionId,
      spotId: session.spotId,
      totalAmount,
      durationMinutes
    });
    
    io.to(`lot-${session.parkingLotId}`).emit('spot-updated', {
      spotId: session.spotId,
      isAvailable: true
    });
    
    res.json({
      sessionId: updatedSession.id,
      endTime: updatedSession.endTime,
      totalAmount: updatedSession.totalAmount,
      durationMinutes,
      xrplTxHash: updatedSession.xrplTxHash
    });
    
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get session details
router.get('/:sessionId', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { sessionId } = req.params;
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        spot: true,
        parkingLot: true
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Calculate current amount if session is active
    let currentAmount = 0;
    if (session.status === 'ACTIVE') {
      const durationMs = Date.now() - session.startTime.getTime();
      const durationMinutes = Math.ceil(durationMs / (1000 * 60));
      currentAmount = durationMinutes * session.parkingLot.ratePerMin;
    }
    
    res.json({
      ...session,
      currentAmount: session.status === 'ACTIVE' ? currentAmount : session.totalAmount
    });
    
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Heartbeat for active sessions
router.post('/heartbeat', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { sessionId } = req.body;
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { parkingLot: true }
    });
    
    if (!session || session.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Active session not found' });
    }
    
    const durationMs = Date.now() - session.startTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    const currentAmount = durationMinutes * session.parkingLot.ratePerMin;
    
    res.json({
      sessionId: session.id,
      durationMinutes,
      currentAmount,
      lastHeartbeat: new Date()
    });
    
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ error: 'Failed to process heartbeat' });
  }
});

export default router;
