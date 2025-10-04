import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();

// Validation schemas
const walletSchema = z.object({
  address: z.string().min(1),
});

// Get wallet balance and info
router.get('/:address', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { address } = req.params;
    
    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { address }
    });
    
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          address,
          rlusdBalance: 100.0 // Demo balance
        }
      });
    }
    
    // Get recent transactions (sessions)
    const recentSessions = await prisma.session.findMany({
      where: { walletAddress: address },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        spot: true,
        parkingLot: true
      }
    });
    
    res.json({
      address: wallet.address,
      rlusdBalance: wallet.rlusdBalance,
      recentTransactions: recentSessions.map(session => ({
        id: session.id,
        type: session.status === 'ENDED' ? 'payment' : 'active',
        amount: session.totalAmount || 0,
        parkingLot: session.parkingLot.name,
        spotNumber: session.spot.number,
        timestamp: session.createdAt,
        xrplTxHash: session.xrplTxHash
      }))
    });
    
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Failed to fetch wallet info' });
  }
});

// Add funds to wallet (demo)
router.post('/add-funds', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { address, amount } = req.body;
    
    if (!address || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid address or amount' });
    }
    
    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: {
        rlusdBalance: {
          increment: amount
        }
      },
      create: {
        address,
        rlusdBalance: amount
      }
    });
    
    res.json({
      address: wallet.address,
      rlusdBalance: wallet.rlusdBalance,
      addedAmount: amount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({ error: 'Failed to add funds' });
  }
});

// Get transaction history
router.get('/:address/transactions', async (req, res) => {
  try {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { address } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const sessions = await prisma.session.findMany({
      where: { walletAddress: address },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        spot: true,
        parkingLot: true
      }
    });
    
    const transactions = sessions.map(session => ({
      id: session.id,
      type: session.status === 'ENDED' ? 'payment' : 'active',
      amount: session.totalAmount || 0,
      parkingLot: session.parkingLot.name,
      spotNumber: session.spot.number,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.endTime 
        ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
        : null,
      xrplTxHash: session.xrplTxHash,
      status: session.status
    }));
    
    res.json({
      transactions,
      total: sessions.length,
      hasMore: sessions.length === parseInt(limit as string)
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
