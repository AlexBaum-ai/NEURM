import redisClient from '@/config/redisClient';
import logger from '@/utils/logger';
import { performanceService } from './performance.service';
import * as Sentry from '@sentry/node';

/**
 * Enhanced Caching Service with Tiered Caching Strategy
 *
 * Cache Tiers:
 * - HOT: Frequently accessed data (TTL: 5 minutes)
 * - WARM: Moderately accessed data (TTL: 1 hour)
 * - COLD: Rarely accessed data (TTL: 24 hours)
 * - PERMANENT: Static data (no expiry)
 */

export enum CacheTier {
  HOT = 'hot',      // 5 minutes
  WARM = 'warm',    // 1 hour
  COLD = 'cold',    // 24 hours
  PERMANENT = 'permanent', // No expiry
}

export interface CacheOptions {
  tier?: CacheTier;
  ttl?: number; // Override default TTL (in seconds)
  tags?: string[]; // For invalidation by tag
}

class CacheService {
  private readonly DEFAULT_TTLS = {
    [CacheTier.HOT]: 300,        // 5 minutes
    [CacheTier.WARM]: 3600,      // 1 hour
    [CacheTier.COLD]: 86400,     // 24 hours
    [CacheTier.PERMANENT]: 0,    // No expiry
  };

  /**
   * Get value from cache with performance tracking
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);

      if (value) {
        performanceService.trackCacheHit();
        return JSON.parse(value) as T;
      }

      performanceService.trackCacheMiss();
      return null;
    } catch (error) {
      logger.error(`Cache GET error for key ${key}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'cache', operation: 'get' },
        extra: { key },
      });
      return null;
    }
  }

  /**
   * Set value in cache with options
   */
  async set(
    key: string,
    value: any,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const { tier = CacheTier.WARM, ttl, tags = [] } = options;
      const effectiveTTL = ttl ?? this.DEFAULT_TTLS[tier];
      const serialized = JSON.stringify(value);

      if (effectiveTTL > 0) {
        await redisClient.set(key, serialized, effectiveTTL);
      } else {
        await redisClient.getClient().set(key, serialized);
      }

      // Store tags for invalidation
      if (tags.length > 0) {
        await this.storeTags(key, tags);
      }

      return true;
    } catch (error) {
      logger.error(`Cache SET error for key ${key}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'cache', operation: 'set' },
        extra: { key, options },
      });
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, options);

    return value;
  }

  /**
   * Delete single key
   */
  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
      await this.removeKeyFromTags(key);
    } catch (error) {
      logger.error(`Cache DEL error for key ${key}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'cache', operation: 'del' },
        extra: { key },
      });
    }
  }

  /**
   * Delete keys by pattern (use cautiously in production)
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const client = redisClient.getClient();
      const keys = await client.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await client.del(...keys);

      // Remove from tag indexes
      for (const key of keys) {
        await this.removeKeyFromTags(key);
      }

      return keys.length;
    } catch (error) {
      logger.error(`Cache DEL pattern error for ${pattern}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'cache', operation: 'delPattern' },
        extra: { pattern },
      });
      return 0;
    }
  }

  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = this.getTagKey(tag);
      const keys = await redisClient.getClient().smembers(tagKey);

      if (keys.length === 0) {
        return 0;
      }

      // Delete all keys with this tag
      await redisClient.getClient().del(...keys);

      // Remove tag index
      await redisClient.getClient().del(tagKey);

      logger.info(`Invalidated ${keys.length} cache entries for tag: ${tag}`);

      return keys.length;
    } catch (error) {
      logger.error(`Cache invalidation error for tag ${tag}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'cache', operation: 'invalidateByTag' },
        extra: { tag },
      });
      return 0;
    }
  }

  /**
   * Warm cache with data (cache warming strategy)
   */
  async warmCache(entries: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    logger.info(`Warming cache with ${entries.length} entries`);

    const pipeline = redisClient.getClient().pipeline();

    for (const entry of entries) {
      const { key, value, options = {} } = entry;
      const { tier = CacheTier.WARM, ttl } = options;
      const effectiveTTL = ttl ?? this.DEFAULT_TTLS[tier];
      const serialized = JSON.stringify(value);

      if (effectiveTTL > 0) {
        pipeline.setex(key, effectiveTTL, serialized);
      } else {
        pipeline.set(key, serialized);
      }
    }

    await pipeline.exec();
    logger.info('Cache warming completed');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: number;
    hitRate: number;
  }> {
    try {
      const client = redisClient.getClient();
      const info = await client.info('stats');
      const dbsize = await client.dbsize();

      // Parse memory info
      const memoryInfo = await client.info('memory');
      const memMatch = memoryInfo.match(/used_memory:(\d+)/);
      const memoryUsage = memMatch ? parseInt(memMatch[1], 10) : 0;

      // Parse hit rate
      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);
      const hits = hitsMatch ? parseInt(hitsMatch[1], 10) : 0;
      const misses = missesMatch ? parseInt(missesMatch[1], 10) : 0;
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;

      return {
        totalKeys: dbsize,
        memoryUsage,
        hitRate: Math.round(hitRate * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return {
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0,
      };
    }
  }

  /**
   * Clear all cache (use only in development/testing)
   */
  async clearAll(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Attempted to clear all cache in production - operation blocked');
      return;
    }

    try {
      await redisClient.getClient().flushdb();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Store tags for a key
   */
  private async storeTags(key: string, tags: string[]): Promise<void> {
    const client = redisClient.getClient();
    const pipeline = client.pipeline();

    for (const tag of tags) {
      const tagKey = this.getTagKey(tag);
      pipeline.sadd(tagKey, key);
    }

    await pipeline.exec();
  }

  /**
   * Remove key from all tag indexes
   */
  private async removeKeyFromTags(key: string): Promise<void> {
    try {
      const client = redisClient.getClient();
      const tagKeys = await client.keys('cache:tag:*');

      if (tagKeys.length === 0) {
        return;
      }

      const pipeline = client.pipeline();

      for (const tagKey of tagKeys) {
        pipeline.srem(tagKey, key);
      }

      await pipeline.exec();
    } catch (error) {
      logger.error(`Failed to remove key ${key} from tag indexes:`, error);
    }
  }

  /**
   * Get Redis key for tag
   */
  private getTagKey(tag: string): string {
    return `cache:tag:${tag}`;
  }

  /**
   * Generate cache key from components
   */
  static generateKey(namespace: string, ...components: (string | number)[]): string {
    return `cache:${namespace}:${components.join(':')}`;
  }
}

export const cacheService = new CacheService();
export default CacheService;
