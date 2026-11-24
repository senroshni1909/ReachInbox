import { Request, Response } from 'express';
import { getQueueMetrics } from '../services/queue.service.js';

export class QueueController {
  /**
   * GET /api/queue/stats
   */
  static async getQueueStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await getQueueMetrics();
      res.json({ stats });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch queue stats' });
    }
  }
}
