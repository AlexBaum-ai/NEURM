import { Article, ArticleStatus } from '@prisma/client';
import * as Sentry from '@sentry/node';
import ArticleRepository from './articles.repository';
import ArticleRevisionService from './articleRevisions.service';
import RssService from './rss.service';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ListArticlesQuery,
  ScheduleArticleInput,
  ListScheduledArticlesQuery,
} from './articles.validation';
import redisClient from '@/config/redisClient';
import logger from '@/utils/logger';
import { NotFoundError, BadRequestError, ConflictError } from '@/utils/errors';

/**
 * Article Service
 * Handles business logic for articles including caching and revision tracking
 */
export class ArticleService {
  private repository: ArticleRepository;
  private revisionService: ArticleRevisionService;
  private rssService: RssService;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'article:';
  private readonly LIST_CACHE_PREFIX = 'articles:list:';
  private readonly RELATED_CACHE_PREFIX = 'related:';
  private readonly RELATED_CACHE_TTL = 3600; // 1 hour

  constructor(
    repository?: ArticleRepository,
    revisionService?: ArticleRevisionService,
    rssService?: RssService
  ) {
    this.repository = repository || new ArticleRepository();
    this.revisionService = revisionService || new ArticleRevisionService();
    this.rssService = rssService || new RssService();
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

      // Create initial revision snapshot
      await this.revisionService
        .createRevisionSnapshot(
          article.id,
          {
            title: article.title,
            content: article.content,
            summary: article.summary,
          },
          createdById,
          'Initial version'
        )
        .catch((error) => {
          logger.error(`Failed to create initial revision snapshot: ${error}`);
          // Don't throw - revision creation is not critical for article creation
        });

      // Invalidate list cache and related articles cache
      await this.invalidateListCache();
      await this.invalidateAllRelatedCaches();

      // Invalidate RSS feed cache if article is published
      if (article.status === ArticleStatus.published) {
        await this.rssService.invalidateAllCaches();
      }

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

      // Create revision snapshot if content changed
      const contentChanged =
        (data.title && data.title !== existingArticle.title) ||
        (data.content && data.content !== existingArticle.content) ||
        (data.summary && data.summary !== existingArticle.summary);

      if (contentChanged) {
        await this.revisionService
          .createRevisionSnapshot(
            article.id,
            {
              title: article.title,
              content: article.content,
              summary: article.summary,
            },
            updatedById,
            'Article updated'
          )
          .catch((error) => {
            logger.error(`Failed to create revision snapshot: ${error}`);
            // Don't throw - revision creation is not critical
          });
      }

      // Invalidate caches
      await this.invalidateArticleCache(existingArticle.slug);
      await this.invalidateListCache();
      await this.invalidateRelatedCache(id);

      // When article is updated, all related articles may change, so invalidate all
      await this.invalidateAllRelatedCaches();

      // If slug changed, invalidate new slug cache too
      if (data.slug && data.slug !== existingArticle.slug) {
        await this.invalidateArticleCache(data.slug);
      }

      // Invalidate RSS feed cache if article is published or status changed to published
      const statusChanged = data.status && data.status !== existingArticle.status;
      if (article.status === ArticleStatus.published || statusChanged) {
        await this.rssService.invalidateAllCaches();
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
      await this.invalidateRelatedCache(id);
      await this.invalidateAllRelatedCaches();

      // Invalidate RSS feed cache if article was published
      if (article.status === ArticleStatus.published) {
        await this.rssService.invalidateAllCaches();
      }

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
   * Get related articles with caching (1-hour TTL)
   * Uses hybrid scoring: category (40%) + tags (30%) + content similarity (30%)
   */
  async getRelatedArticles(articleId: string): Promise<{
    articles: Article[];
    count: number;
  }> {
    try {
      const cacheKey = `${this.RELATED_CACHE_PREFIX}${articleId}`;

      // Try to get from cache
      if (redisClient.isReady()) {
        const cached = await redisClient.getJSON<{
          articles: Article[];
          count: number;
        }>(cacheKey);

        if (cached) {
          logger.debug(`Related articles cache hit for: ${articleId}`);
          return cached;
        }
      }

      logger.debug(`Related articles cache miss for: ${articleId}`);

      // Get from database using advanced algorithm
      const relatedArticles = await this.repository.findRelatedAdvanced(articleId, 3, 6);

      const result = {
        articles: relatedArticles,
        count: relatedArticles.length,
      };

      // Cache the result
      if (redisClient.isReady()) {
        await redisClient
          .setJSON(cacheKey, result, this.RELATED_CACHE_TTL)
          .catch((error) => {
            logger.error(`Failed to cache related articles: ${error}`);
          });
      }

      return result;
    } catch (error) {
      logger.error(`Failed to get related articles for ${articleId}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleService', method: 'getRelatedArticles' },
        extra: { articleId },
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

  /**
   * Invalidate related articles cache for a specific article
   */
  private async invalidateRelatedCache(articleId: string): Promise<void> {
    if (!redisClient.isReady()) return;

    try {
      // Invalidate cache for this article
      const cacheKey = `${this.RELATED_CACHE_PREFIX}${articleId}`;
      await redisClient.del(cacheKey);

      logger.debug(`Invalidated related cache for article: ${articleId}`);
    } catch (error) {
      logger.error(`Failed to invalidate related cache: ${error}`);
      // Don't throw - cache invalidation is not critical
    }
  }

  /**
   * Invalidate all related articles caches
   * Called when an article is published/updated to ensure all related articles are recalculated
   */
  private async invalidateAllRelatedCaches(): Promise<void> {
    if (!redisClient.isReady()) return;

    try {
      await redisClient.delPattern(`${this.RELATED_CACHE_PREFIX}*`);
      logger.debug('Invalidated all related articles caches');
    } catch (error) {
      logger.error(`Failed to invalidate all related caches: ${error}`);
      // Don't throw - cache invalidation is not critical
    }
  }
  /**
   * Schedule article for publishing (admin only)
   */
  async scheduleArticle(
    id: string,
    data: ScheduleArticleInput,
    updatedById: string
  ): Promise<Article> {
    try {
      // Check if article exists
      const existingArticle = await this.repository.findById(id);
      if (!existingArticle) {
        throw new NotFoundError(`Article with ID "${id}" not found`);
      }

      // Only draft or scheduled articles can be scheduled/rescheduled
      if (
        existingArticle.status !== ArticleStatus.draft &&
        existingArticle.status !== ArticleStatus.scheduled
      ) {
        throw new BadRequestError(
          `Cannot schedule article with status "${existingArticle.status}". Only draft or scheduled articles can be scheduled.`
        );
      }

      // Validate scheduled date is in the future
      if (data.scheduledAt <= new Date()) {
        throw new BadRequestError('Scheduled date must be in the future');
      }

      // Update article with scheduled status and date
      const article = await this.repository.update(
        id,
        {
          status: ArticleStatus.scheduled,
          scheduledAt: data.scheduledAt,
        },
        updatedById
      );

      // Invalidate caches
      await this.invalidateArticleCache(existingArticle.slug);
      await this.invalidateListCache();

      logger.info(`Article scheduled: ${article.id} for ${data.scheduledAt.toISOString()}`, {
        articleId: article.id,
        scheduledAt: data.scheduledAt,
        updatedById,
      });

      return article;
    } catch (error) {
      logger.error(`Failed to schedule article ${id}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleService', method: 'scheduleArticle' },
        extra: { id, data, updatedById },
      });
      throw error;
    }
  }

  /**
   * Cancel scheduled article publishing (admin only)
   */
  async cancelSchedule(id: string, updatedById: string): Promise<Article> {
    try {
      // Check if article exists
      const existingArticle = await this.repository.findById(id);
      if (!existingArticle) {
        throw new NotFoundError(`Article with ID "${id}" not found`);
      }

      // Only scheduled articles can be cancelled
      if (existingArticle.status !== ArticleStatus.scheduled) {
        throw new BadRequestError(
          `Cannot cancel schedule for article with status "${existingArticle.status}". Only scheduled articles can be cancelled.`
        );
      }

      // Update article back to draft status and clear scheduled date
      const article = await this.repository.update(
        id,
        {
          status: ArticleStatus.draft,
          scheduledAt: null,
        },
        updatedById
      );

      // Invalidate caches
      await this.invalidateArticleCache(existingArticle.slug);
      await this.invalidateListCache();

      logger.info(`Article schedule cancelled: ${article.id}`, {
        articleId: article.id,
        updatedById,
      });

      return article;
    } catch (error) {
      logger.error(`Failed to cancel schedule for article ${id}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleService', method: 'cancelSchedule' },
        extra: { id, updatedById },
      });
      throw error;
    }
  }

  /**
   * List upcoming scheduled articles (admin only)
   */
  async listScheduledArticles(query: ListScheduledArticlesQuery): Promise<{
    articles: Article[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page, limit, sortBy, sortOrder } = query;

      // Build where clause for scheduled articles
      const where = {
        status: ArticleStatus.scheduled,
        scheduledAt: {
          gte: new Date(), // Only future scheduled articles
        },
      };

      // Build order by
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get scheduled articles
      const [articles, total] = await Promise.all([
        this.repository.prisma.article.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            author: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        }),
        this.repository.prisma.article.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug(`Listed ${articles.length} scheduled articles`, {
        total,
        page,
        limit,
      });

      return {
        articles,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to list scheduled articles:', error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleService', method: 'listScheduledArticles' },
        extra: { query },
      });
      throw error;
    }
  }
}

export default ArticleService;
