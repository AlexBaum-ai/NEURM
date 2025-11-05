import Redis from 'ioredis';
import env from './env';
import logger from '@/utils/logger';

/**
 * Redis client configuration
 * Used for caching, sessions, rate limiting, and queues
 */

class RedisClient {
  private static instance: Redis | null = null;

  static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err: Error) => {
          const targetErrors = ['READONLY', 'ECONNRESET'];
          if (targetErrors.some(targetError => err.message.includes(targetError))) {
            return true;
          }
          return false;
        },
      });

      this.instance.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.instance.on('error', (error) => {
        logger.error('Redis client error:', error);
      });

      this.instance.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.instance.on('reconnecting', () => {
        logger.warn('Redis client reconnecting');
      });
    }

    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
      this.instance = null;
      logger.info('Redis client disconnected');
    }
  }

  static isConnected(): boolean {
    return this.instance?.status === 'ready';
  }
}

export default RedisClient;
export const redis = RedisClient.getInstance();
