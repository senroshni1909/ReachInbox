import express, { Application } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

export function createApp(): Application {
  const app = express();

  // Middlewares
  app.use(
    cors({
      origin: '*',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Healthcheck endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'ReachInbox Job Scheduler API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routes
  app.use('/api', apiRouter);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
