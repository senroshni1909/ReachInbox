import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Redis Configuration (BullMQ)
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  // Ethereal / Custom SMTP Configuration
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || 'dean.prosacco@ethereal.email',
  SMTP_PASS: process.env.SMTP_PASS || 'pfyMsQUR5hzmPuPNAq',

  // Rate Limiting Defaults
  DEFAULT_HOURLY_LIMIT: process.env.MAX_EMAILS_PER_HOUR_DEFAULT
    ? parseInt(process.env.MAX_EMAILS_PER_HOUR_DEFAULT, 10)
    : 50,
  DEFAULT_DELAY_SECONDS: process.env.MIN_DELAY_BETWEEN_EMAILS_SECONDS
    ? parseInt(process.env.MIN_DELAY_BETWEEN_EMAILS_SECONDS, 10)
    : 2,
  WORKER_CONCURRENCY: process.env.WORKER_CONCURRENCY
    ? parseInt(process.env.WORKER_CONCURRENCY, 10)
    : 5,

  // Slack Integration
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
} as const;
