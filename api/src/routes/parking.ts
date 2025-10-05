/**
 * Parking API Routes
 * 
 * Handles parking data fetching from TomTom API and provides
 * endpoints for the frontend to consume real-time parking data.
 */

import { Router } from 'express';
import { fetchParkingData, fetchParkingLotById, refreshParkingAvailability } from '../services/tomtom';

const router = Router();

/**
 * GET /api/parking/lots
 * Fetches all available parking lots with real-time availability
 * Query params:
 * - bbox: Bounding box coordinates (optional, defaults to NYC area)
 */
router.get('/lots', async (req, res) => {
  try {
    const { bbox } = req.query;
    
    console.log('📍 Fetching parking lots...');
    const parkingData = await fetchParkingData(bbox as string);
    
    res.json({
      success: true,
      data: parkingData,
      count: parkingData.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching parking lots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parking data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/parking/lots/:id
 * Fetches specific parking lot by ID
 */
router.get('/lots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📍 Fetching parking lot: ${id}`);
    const parkingLot = await fetchParkingLotById(id);
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        error: 'Parking lot not found'
      });
    }
    
    res.json({
      success: true,
      data: parkingLot,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching parking lot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parking lot data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/parking/lots/:id/refresh
 * Refreshes parking availability for a specific lot
 */
router.post('/lots/:id/refresh', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Refreshing parking availability for lot: ${id}`);
    const success = await refreshParkingAvailability(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Failed to refresh parking lot data'
      });
    }
    
    res.json({
      success: true,
      message: 'Parking availability refreshed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error refreshing parking lot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh parking data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/parking/health
 * Health check endpoint for parking service
 */
router.get('/health', async (req, res) => {
  try {
    // Test TomTom API connectivity
    const testData = await fetchParkingData();
    
    res.json({
      success: true,
      service: 'parking',
      status: 'healthy',
      dataSource: testData.length > 0 ? 'tomtom' : 'demo',
      lotsAvailable: testData.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Parking service health check failed:', error);
    res.status(500).json({
      success: false,
      service: 'parking',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
