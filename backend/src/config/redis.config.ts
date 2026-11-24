import { RedisOptions } from 'ioredis';
import { ENV } from './env.config.js';

export const redisConnectionOptions: RedisOptions = {
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  password: ENV.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times: number) {
    // Exponential backoff capped at 30 seconds
    return Math.min(times * 500, 30000);
  },
};
