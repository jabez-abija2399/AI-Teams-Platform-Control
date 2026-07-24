import Redis, { RedisOptions } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

declare global {
  // eslint-disable-next-line no-var
  var globalRedisConnection: Redis | undefined;
}

/**
 * Singleton IORedis connection instance for BullMQ and general caching.
 * Uses global caching in development to prevent hot-reload connection leaks.
 */
export const redisConnection: Redis =
  globalThis.globalRedisConnection || new Redis(redisUrl, redisOptions);

if (process.env.NODE_ENV !== 'production') {
  globalThis.globalRedisConnection = redisConnection;
}

/**
 * Auxiliary helper function to verify Redis connectivity at startup or health check routes.
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const response = await redisConnection.ping();
    return response === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}
