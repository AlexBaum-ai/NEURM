import { NewsTag } from '@prisma/client';
import * as Sentry from '@sentry/node';
import TagRepository from './tags.repository';
import { redis } from '@/config/redis';
import logger from '@/utils/logger';
import { NotFoundError } from '@/utils/errors';

/**
 * TagService
 * Business logic for news tags with caching and usage count management
 */
export class TagService {
  private tagRepository: TagRepository;
  private readonly CACHE_KEY_PREFIX = 'news:tags';
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(tagRepository?: TagRepository) {
    this.tagRepository = tagRepository || new TagRepository();
  }

  /**
   * Get all tags with optional search and sorting
   */
  async getAllTags(options: {
    search?: string;
    limit?: number;
    sortBy?: 'name' | 'usageCount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<NewsTag[]> {
    const {
      search,
      limit = 50,
      sortBy = 'usageCount',
      sortOrder = 'desc',
    } = options;

    // Generate cache key based on options
    const cacheKey = `${this.CACHE_KEY_PREFIX}:list:${search || 'all'}:${sortBy}:${sortOrder}:${limit}`;

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Tags retrieved from cache');
        return JSON.parse(cached);
      }

      // Fetch from database
      logger.debug('Tags cache miss, fetching from database');
      const tags = await this.tagRepository.getAllTags({
        search,
        limit,
        sortBy,
        sortOrder,
      });

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tags));

      return tags;
    } catch (error) {
      logger.error('Error fetching tags:', error);
      Sentry.captureException(error, {
        tags: { service: 'TagService', method: 'getAllTags' },
        extra: { search, limit, sortBy, sortOrder },
      });

      // Fallback to database if Redis fails
      return this.tagRepository.getAllTags({
        search,
        limit,
        sortBy,
        sortOrder,
      });
    }
  }

  /**
   * Search tags for autocomplete (limit 10)
   */
  async searchTags(query: string): Promise<NewsTag[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cacheKey = `${this.CACHE_KEY_PREFIX}:search:${query.toLowerCase()}`;

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug(`Tag search for '${query}' retrieved from cache`);
        return JSON.parse(cached);
      }

      // Fetch from database
      const tags = await this.tagRepository.searchTags(query);

      // Cache the result (shorter TTL for search results)
      await redis.setex(cacheKey, 600, JSON.stringify(tags)); // 10 minutes

      return tags;
    } catch (error) {
      logger.error(`Error searching tags for '${query}':`, error);
      Sentry.captureException(error, {
        tags: { service: 'TagService', method: 'searchTags' },
        extra: { query },
      });

      // Fallback to database if Redis fails
      return this.tagRepository.searchTags(query);
    }
  }

  /**
   * Get tag by slug
   */
  async getTagBySlug(slug: string): Promise<NewsTag> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:slug:${slug}`;

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug(`Tag ${slug} retrieved from cache`);
        return JSON.parse(cached);
      }

      // Fetch from database
      const tag = await this.tagRepository.getTagBySlug(slug);

      if (!tag) {
        throw new NotFoundError(`Tag with slug '${slug}' not found`);
      }

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tag));

      return tag;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error(`Error fetching tag ${slug}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'TagService', method: 'getTagBySlug' },
        extra: { slug },
      });

      // Fallback to database if Redis fails
      const tag = await this.tagRepository.getTagBySlug(slug);
      if (!tag) {
        throw new NotFoundError(`Tag with slug '${slug}' not found`);
      }
      return tag;
    }
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 20): Promise<NewsTag[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:popular:${limit}`;

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Popular tags retrieved from cache');
        return JSON.parse(cached);
      }

      // Fetch from database
      const tags = await this.tagRepository.getPopularTags(limit);

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tags));

      return tags;
    } catch (error) {
      logger.error('Error fetching popular tags:', error);
      Sentry.captureException(error, {
        tags: { service: 'TagService', method: 'getPopularTags' },
        extra: { limit },
      });

      // Fallback to database if Redis fails
      return this.tagRepository.getPopularTags(limit);
    }
  }

  /**
   * Get tags for an article
   */
  async getArticleTags(articleId: string): Promise<NewsTag[]> {
    return this.tagRepository.getArticleTags(articleId);
  }

  /**
   * Invalidate tag cache
   */
  async invalidateCache(): Promise<void> {
    try {
      const pattern = `${this.CACHE_KEY_PREFIX}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Invalidated ${keys.length} tag cache keys`);
      }
    } catch (error) {
      logger.error('Error invalidating tag cache:', error);
      Sentry.captureException(error, {
        tags: { service: 'TagService', method: 'invalidateCache' },
      });
    }
  }

  /**
   * Increment usage count for a tag and invalidate cache
   */
  async incrementUsageCount(tagId: string): Promise<void> {
    await this.tagRepository.incrementUsageCount(tagId);
    await this.invalidateCache();
  }

  /**
   * Decrement usage count for a tag and invalidate cache
   */
  async decrementUsageCount(tagId: string): Promise<void> {
    await this.tagRepository.decrementUsageCount(tagId);
    await this.invalidateCache();
  }

  /**
   * Recalculate usage count for a tag and invalidate cache
   */
  async recalculateUsageCount(tagId: string): Promise<number> {
    const count = await this.tagRepository.recalculateUsageCount(tagId);
    await this.invalidateCache();
    return count;
  }

  /**
   * Bulk update usage counts for multiple tags and invalidate cache
   */
  async bulkUpdateUsageCounts(tagIds: string[]): Promise<void> {
    await this.tagRepository.bulkUpdateUsageCounts(tagIds);
    await this.invalidateCache();
  }

  /**
   * Find or create tag by name
   */
  async findOrCreateTag(name: string, slug: string): Promise<NewsTag> {
    const existing = await this.tagRepository.getTagByName(name);
    if (existing) {
      return existing;
    }

    const newTag = await this.tagRepository.createTag({ name, slug });
    await this.invalidateCache();
    return newTag;
  }
}

export default TagService;
