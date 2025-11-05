import { NewsCategory } from '@prisma/client';
import * as Sentry from '@sentry/node';
import CategoryRepository from './categories.repository';
import { redis } from '@/config/redis';
import logger from '@/utils/logger';
import { NotFoundError } from '@/utils/errors';

/**
 * CategoryService
 * Business logic for news categories with Redis caching
 */
export class CategoryService {
  private categoryRepository: CategoryRepository;
  private readonly CACHE_KEY_PREFIX = 'news:categories';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(categoryRepository?: CategoryRepository) {
    this.categoryRepository = categoryRepository || new CategoryRepository();
  }


  /**
   * Get all categories as hierarchical tree (cached)
   */
  async getAllCategories(includeInactive: boolean = false): Promise<NewsCategory[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:tree:${includeInactive ? 'all' : 'active'}`;

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Categories retrieved from cache');
        return JSON.parse(cached);
      }

      // Fetch from database
      logger.debug('Categories cache miss, fetching from database');
      const categories = await this.categoryRepository.getRootCategories(includeInactive);

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(categories));

      return categories;
    } catch (error) {
      logger.error('Error fetching categories:', error);
      Sentry.captureException(error, {
        tags: { service: 'CategoryService', method: 'getAllCategories' },
        extra: { includeInactive },
      });

      // Fallback to database if Redis fails
      return this.categoryRepository.getRootCategories(includeInactive);
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<NewsCategory> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:slug:${slug}`;

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug(`Category ${slug} retrieved from cache`);
        return JSON.parse(cached);
      }

      // Fetch from database
      const category = await this.categoryRepository.getCategoryBySlug(slug);

      if (!category) {
        throw new NotFoundError(`Category with slug '${slug}' not found`);
      }

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(category));

      return category;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error(`Error fetching category ${slug}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'CategoryService', method: 'getCategoryBySlug' },
        extra: { slug },
      });

      // Fallback to database if Redis fails
      const category = await this.categoryRepository.getCategoryBySlug(slug);
      if (!category) {
        throw new NotFoundError(`Category with slug '${slug}' not found`);
      }
      return category;
    }
  }

  /**
   * Get flat list of categories with article counts
   */
  async getCategoriesWithCounts(): Promise<NewsCategory[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:with-counts`;

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Categories with counts retrieved from cache');
        return JSON.parse(cached);
      }

      // Fetch from database
      const categories = await this.categoryRepository.getCategoriesWithCounts();

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(categories));

      return categories;
    } catch (error) {
      logger.error('Error fetching categories with counts:', error);
      Sentry.captureException(error, {
        tags: { service: 'CategoryService', method: 'getCategoriesWithCounts' },
      });

      // Fallback to database if Redis fails
      return this.categoryRepository.getCategoriesWithCounts();
    }
  }

  /**
   * Invalidate category cache
   */
  async invalidateCache(): Promise<void> {
    try {
      const pattern = `${this.CACHE_KEY_PREFIX}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Invalidated ${keys.length} category cache keys`);
      }
    } catch (error) {
      logger.error('Error invalidating category cache:', error);
      Sentry.captureException(error, {
        tags: { service: 'CategoryService', method: 'invalidateCache' },
      });
    }
  }

  /**
   * Increment article count for a category and invalidate cache
   */
  async incrementArticleCount(categoryId: string): Promise<void> {
    await this.categoryRepository.incrementArticleCount(categoryId);
    await this.invalidateCache();
  }

  /**
   * Decrement article count for a category and invalidate cache
   */
  async decrementArticleCount(categoryId: string): Promise<void> {
    await this.categoryRepository.decrementArticleCount(categoryId);
    await this.invalidateCache();
  }

  /**
   * Recalculate article count for a category and invalidate cache
   */
  async recalculateArticleCount(categoryId: string): Promise<number> {
    const count = await this.categoryRepository.recalculateArticleCount(categoryId);
    await this.invalidateCache();
    return count;
  }
}

export default CategoryService;
