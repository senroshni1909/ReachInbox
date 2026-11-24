import { Router } from 'express';
import { QueueController } from '../controllers/queue.controller.js';

export const queueRoutes = Router();

queueRoutes.get('/stats', QueueController.getQueueStats);
