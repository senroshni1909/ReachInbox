import { createApp } from './app.js';
import { ENV } from './config/env.config.js';
import { verifySmtpConnection } from './config/smtp.config.js';
import { initEmailWorker } from './services/worker.service.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

const server = app.listen(ENV.PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 ReachInbox Scheduler API running in TypeScript`);
  console.log(`📡 URL: http://localhost:${ENV.PORT}`);
  console.log(`📧 SMTP: ${ENV.SMTP_HOST}:${ENV.SMTP_PORT} (${ENV.SMTP_USER})`);
  console.log(`=======================================================`);

  // Verify Ethereal SMTP connection
  await verifySmtpConnection();

  // Initialize BullMQ background worker
  try {
    initEmailWorker();
  } catch (err: any) {
    console.warn(`BullMQ worker init warning: ${err.message}`);
  }
});

// Graceful Shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ Server and database disconnected.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
