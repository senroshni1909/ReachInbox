import { RedisOptions } from 'ioredis';
import { ENV } from './env.js';

export const redisConnectionOptions: RedisOptions = {
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  password: ENV.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times: number) {
    // Reconnection exponential backoff, capping at 30 seconds
    const delay = Math.min(times * 500, 30000);
    return delay;
  },
};
