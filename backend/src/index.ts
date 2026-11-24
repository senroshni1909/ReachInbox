import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { emailRouter } from './routes/emailRoutes.js';
import { queueRouter } from './routes/queueRoutes.js';
import { slackRouter } from './routes/slackRoutes.js';
import { initEmailWorker } from './services/workerService.js';
import { prisma } from './lib/prisma.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/emails', emailRouter);
app.use('/api/queue', queueRouter);
app.use('/api/slack', slackRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start BullMQ Worker in background
try {
  initEmailWorker();
} catch (err: any) {
  console.warn('BullMQ Worker initialization warning:', err.message);
}

// Start Server
const server = app.listen(ENV.PORT, () => {
  console.log(`🚀 ReachInbox Backend running in TypeScript on http://localhost:${ENV.PORT}`);
});

// Graceful Shutdown
async function shutdown() {
  console.log('Shutting down server gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
