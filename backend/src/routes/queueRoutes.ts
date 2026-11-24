import { Router, Request, Response } from 'express';
import { getQueueMetrics } from '../services/queueService.js';

export const queueRouter = Router();

// GET /api/queue/stats
queueRouter.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getQueueMetrics();
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch queue stats' });
  }
});
