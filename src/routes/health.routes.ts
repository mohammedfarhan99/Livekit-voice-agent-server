import { Router } from 'express';
import { config } from '../config';
import { HybridLiveKitService } from '../services/hybrid-livekit.service';

const router = Router();
const liveKitService = new HybridLiveKitService();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'livekit-voice-agent-server',
    version: '1.0.0',
    environment: config.NODE_ENV
  });
});

/**
 * GET /health/livekit
 * LiveKit service health check
 */
router.get('/livekit', async (req, res) => {
  try {
    // Try to list rooms to check LiveKit connectivity
    const rooms = liveKitService.getActiveRooms();
    
    res.json({
      status: 'healthy',
      service: 'livekit',
      activeRooms: rooms.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: Error | any) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'livekit',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
