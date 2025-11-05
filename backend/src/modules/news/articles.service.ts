import { Article } from '@prisma/client';
import * as Sentry from '@sentry/node';
import ArticleRepository from './articles.repository';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ListArticlesQuery,
} from './articles.validation';
import redisClient from '@/config/redisClient';
import logger from '@/utils/logger';
import { NotFoundError, BadRequestError, ConflictError } from '@/utils/errors';

/**
 * Article Service
 * Handles business logic for articles including caching
 */
export class ArticleService {
  private repository: ArticleRepository;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'article:';
  private readonly LIST_CACHE_PREFIX = 'articles:list:';

  constructor(repository?: ArticleRepository) {
    this.repository = repository || new ArticleRepository();
  }

  /**
   * Create a new article (admin only)
   */
  async createArticle(
    data: CreateArticleInput,
    createdById: string
  ): Promise<Article> {
    try {
      // Check if slug already exists
      const slugExists = await this.repository.slugExists(data.slug);
      if (slugExists) {
        throw new ConflictError(
          `Article with slug "${data.slug}" already exists`
        );
      }

      // Validate scheduled/published dates
      if (data.scheduledAt && data.scheduledAt < new Date()) {
        throw new BadRequestError('Scheduled date must be in the future');
      }

      // Create article
      const article = await this.repository.create(data, createdById);

      // Invalidate list cache
      await this.invalidateListCache();

      logger.info(`Article created: ${article.id} by user ${createdById}`);

      return article;
    } catch (error) {
      logger.error('Failed to create article:', error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleService', method: 'createArticle' },
        extra: { data, createdById },
      });
      throw error;
    }
  }

  /**
   * Get article by slug (public - with caching)
   */
  async getArticleBySlug(
    slug: string,
    userId?: string
  ): Promise<{
    article: Article;
    relatedArticles: Article[];
    isBookmarked: boolean;
  }> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}slug:${slug}:${userId || 'anonymous'}`;

      // Try to get from cache
      if (redisClient.isReady()) {
        const cached = await redisClient.getJSON<{
          article: Article;
          relatedArticles: Article[];
          isBookmarked: boolean;
        }>(cacheKey);

        if (cached) {
          logger.debug(`Article cache hit: ${slug}`);

          // Increment view count asynchronously (don't wait)
          this.repository.incrementViewCount(cached.article.id).catch((error) => {
            logger.error(`Failed to increment view count: ${error}`);
          });

          return cached;
        }
      }

      logger.debug(`Article cache miss: ${slug}`);

      // Get from database
      const article = await this.repository.findBySlug(slug, userId);

      if (!article) {
        throw new NotFoundError(`Article with slug "${slug}" not found`);
      }

      // Get related articles
      const relatedArticles = await this.repository.findRelated(article.id, 5);

      // Check if bookmarked
      const isBookmarked = userId
        ? (article as any).bookmarks?.length > 0
        : false;

      const result = {
        article,
        relatedArticles,
        isBookmarked,
      };

      // Cache the result
      if (redisClient.isReady()) {
        await redisClient
          .setJSON(cacheKey, result, this.CACHE_TTL)
          .catch((error) => {
            logger.error(`Failed to cache article: ${error}`);
          });
      }

      // Increment view count asynchronously
      this.repository.incrementViewCount(article.id).catch((error) => {
        logger.error(`Failed to increment view count: ${error}`);
      });

      return result;
    } catch (error) {
      logger.error(`Failed to get article by slug ${slug}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleService', method: 'getArticleBySlug' },
        extra: { slug, userId },
      });
      throw error;
    }
  }

  /**
   * List articles with filters and pagination (public - with caching)
   */
  async listArticles(query: ListArticlesQuery): Promise<{
    articles: Article[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Generate cache key based on query parameters
      const cacheKey = `${this.LIST_CACHE_PREFIX}${JSON.stringify(query)}`;

      // Try to get from cache
      if (redisClient.isReady()) {
        const cached = await redisClient.getJSON<{
          articles: Article[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }>(cacheKey);

        if (cached) {
          logger.debug('Articles list cache hit');
          return cached;
        }
      }

      logger.debug('Articles list cache miss');

      // Get from database
      const result = await this.repository.findMany(query);

      // Cache the result
      if (redisClient.isReady()) {
        await redisClient
          .setJSON(cacheKey, result, this.CACHE_TTL)
          .catch((error) => {
            logger.error(`Failed to cache articles list: ${error}`);
          });
      }

      return result;
    } catch (error) {
      logger.error('Failed to list articles:', error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleService', method: 'listArticles' },
        extra: { query },
      });
      throw error;
    }
  }

  /**
   * Get article by ID (admin only - no caching)
   */
  async getArticleById(id: string): Promise<Article> {
    try {
      const article = await this.repository.findById(id);

      if (!article) {
        throw new NotFoundError(`Article with ID "${id}" not found`);
      }

      return article;
    } catch (error) {
      logger.error(`Failed to get article by ID ${id}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleService', method: 'getArticleById' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Update article (admin only)
   */
  async updateArticle(
    id: string,
    data: UpdateArticleInput,
    updatedById: string
  ): Promise<Article> {
    try {
      // Check if article exists
      const existingArticle = await this.repository.findById(id);
      if (!existingArticle) {
        throw new NotFoundError(`Article with ID "${id}" not found`);
      }

      // Check if slug is being changed and if it already exists
      if (data.slug && data.slug !== existingArticle.slug) {
        const slugExists = await this.repository.slugExists(data.slug, id);
        if (slugExists) {
          throw new ConflictError(
            `Article with slug "${data.slug}" already exists`
          );
        }
      }

      // Validate scheduled/published dates
      if (data.scheduledAt && data.scheduledAt < new Date()) {
        throw new BadRequestError('Scheduled date must be in the future');
      }

      // Update article
      const article = await this.repository.update(id, data, updatedById);

      // Invalidate caches
      await this.invalidateArticleCache(existingArticle.slug);
      await this.invalidateListCache();

      // If slug changed, invalidate new slug cache too
      if (data.slug && data.slug !== existingArticle.slug) {
        await this.invalidateArticleCache(data.slug);
      }

      logger.info(`Article updated: ${article.id} by user ${updatedById}`);

      return article;
    } catch (error) {
      logger.error(`Failed to update article ${id}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleService', method: 'updateArticle' },
        extra: { id, data, updatedById },
      });
      throw error;
    }
  }

  /**
   * Delete article (admin only)
   */
  async deleteArticle(id: string): Promise<void> {
    try {
      // Check if article exists
      const article = await this.repository.findById(id);
      if (!article) {
        throw new NotFoundError(`Article with ID "${id}" not found`);
      }

      // Delete article
      await this.repository.delete(id);

      // Invalidate caches
      await this.invalidateArticleCache(article.slug);
      await this.invalidateListCache();

      logger.info(`Article deleted: ${id}`);
    } catch (error) {
      logger.error(`Failed to delete article ${id}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleService', method: 'deleteArticle' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Invalidate article cache by slug
   */
  private async invalidateArticleCache(slug: string): Promise<void> {
    if (!redisClient.isReady()) return;

    try {
      // Invalidate all user-specific caches for this slug
      await redisClient.delPattern(`${this.CACHE_PREFIX}slug:${slug}:*`);
      logger.debug(`Invalidated cache for article: ${slug}`);
    } catch (error) {
      logger.error(`Failed to invalidate article cache: ${error}`);
      // Don't throw - cache invalidation is not critical
    }
  }

  /**
   * Invalidate list cache
   */
  private async invalidateListCache(): Promise<void> {
    if (!redisClient.isReady()) return;

    try {
      await redisClient.delPattern(`${this.LIST_CACHE_PREFIX}*`);
      logger.debug('Invalidated articles list cache');
    } catch (error) {
      logger.error(`Failed to invalidate list cache: ${error}`);
      // Don't throw - cache invalidation is not critical
    }
  }
}

export default ArticleService;
