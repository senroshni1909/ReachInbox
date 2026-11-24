import net from 'net';
import { Redis, RedisOptions } from 'ioredis';
import { ENV } from './env.config.js';

export const redisConnectionOptions: RedisOptions = {
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  password: ENV.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy() {
    // Return null to stop infinite reconnect spam if Redis is not installed
    return null;
  },
};

let cachedRedisStatus: boolean | null = null;
let sharedRedisClient: Redis | null = null;

export async function isRedisOnline(): Promise<boolean> {
  if (cachedRedisStatus !== null) return cachedRedisStatus;

  return new Promise(resolve => {
    const socket = new net.Socket();
    socket.setTimeout(800);

    socket.on('connect', () => {
      socket.destroy();
      cachedRedisStatus = true;
      resolve(true);
    });

    socket.on('error', () => {
      socket.destroy();
      cachedRedisStatus = false;
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      cachedRedisStatus = false;
      resolve(false);
    });

    socket.connect(ENV.REDIS_PORT, ENV.REDIS_HOST);
  });
}

export async function getRedisClient(): Promise<Redis | null> {
  const online = await isRedisOnline();
  if (!online) return null;

  if (!sharedRedisClient) {
    const client = new Redis(redisConnectionOptions);
    client.on('error', () => {});
    sharedRedisClient = client;
  }
  return sharedRedisClient;
}
