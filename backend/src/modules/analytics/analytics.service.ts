import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { redis } from '@/config/redis';
import { trackEvent, AnalyticsEventData } from '@/jobs/queues/analyticsQueue';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';
import ArticleViewsRepository from './articleViews.repository';

const prisma = new PrismaClient();

/**
 * Analytics Service
 *
 * Handles tracking of user interactions with articles and other content.
 * Provides methods for:
 * - View tracking (with IP deduplication - 24h window)
 * - Read tracking (completed reading)
 * - Share tracking
 * - Bookmark tracking
 * - Analytics statistics (views, engagement metrics)
 *
 * All tracking is asynchronous and non-blocking.
 */

interface TrackViewParams {
  articleId: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

interface TrackReadParams {
  articleId: string;
  userId?: string;
  sessionId?: string;
  readTimeSeconds: number;
  scrollDepth: number; // Percentage of article scrolled (0-100)
}

interface TrackShareParams {
  articleId: string;
  userId?: string;
  sessionId?: string;
  platform: string; // 'twitter', 'linkedin', 'facebook', 'email', 'copy'
}

interface TrackBookmarkParams {
  articleId: string;
  userId: string;
  collectionId?: string;
}

class AnalyticsService {
  private readonly VIEW_DEDUP_TTL = 86400; // 24 hours in seconds
  private readonly READ_TIME_WPM = 200; // Average reading speed: 200 words per minute
  private readonly viewsRepository: ArticleViewsRepository;

  constructor() {
    this.viewsRepository = new ArticleViewsRepository(prisma);
  }

  /**
   * Track article view with IP deduplication
   * One view per user/IP per 24 hours
   */
  async trackArticleView(params: TrackViewParams): Promise<boolean> {
    const { articleId, userId, sessionId, ipAddress, userAgent, referrer } = params;

    try {
      // Check for duplicate view (authenticated user)
      if (userId) {
        const hasViewed = await this.viewsRepository.hasRecentViewByUser(articleId, userId, 24);
        if (hasViewed) {
          logger.debug('Article view deduplicated (user)', { articleId, userId });
          return false;
        }
      }
      // Check for duplicate view (anonymous user by IP)
      else if (ipAddress) {
        const ipHash = this.hashIp(ipAddress);
        const hasViewed = await this.viewsRepository.hasRecentViewByIp(articleId, ipHash, 24);
        if (hasViewed) {
          logger.debug('Article view deduplicated (IP)', { articleId, ipHash: ipHash.substring(0, 8) });
          return false;
        }
      }

      // Also check Redis cache for faster deduplication
      if (ipAddress) {
        const dedupKey = this.getViewDedupKey(articleId, ipAddress);
        const alreadyViewed = await redis.get(dedupKey);

        if (alreadyViewed) {
          logger.debug('Article view deduplicated (Redis)', { articleId });
          return false; // View not counted (duplicate)
        }

        // Set dedup key with TTL
        await redis.setex(dedupKey, this.VIEW_DEDUP_TTL, '1');
      }

      // Queue analytics event for background processing
      const eventData: AnalyticsEventData = {
        eventType: 'article_view',
        entityType: 'article',
        entityId: articleId,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        referrer,
      };

      await trackEvent(eventData);

      logger.debug('Article view tracked', { articleId, userId });
      return true; // View counted
    } catch (error) {
      logger.error('Failed to track article view:', error);
      Sentry.captureException(error, {
        tags: { operation: 'track_article_view' },
        contexts: {
          params: params as Record<string, any>,
        },
      });
      return false;
    }
  }

  /**
   * Track article read (completed reading)
   * Indicates user spent sufficient time reading
   */
  async trackArticleRead(params: TrackReadParams): Promise<void> {
    const { articleId, userId, sessionId, readTimeSeconds, scrollDepth } = params;

    try {
      const eventData: AnalyticsEventData = {
        eventType: 'article_read',
        entityType: 'article',
        entityId: articleId,
        userId,
        sessionId,
        metadata: {
          readTimeSeconds,
          scrollDepth,
        },
      };

      await trackEvent(eventData);

      logger.debug('Article read tracked', { articleId, userId, readTimeSeconds });
    } catch (error) {
      logger.error('Failed to track article read:', error);
      Sentry.captureException(error, {
        tags: { operation: 'track_article_read' },
        contexts: {
          params: params as Record<string, any>,
        },
      });
    }
  }

  /**
   * Track article share
   */
  async trackArticleShare(params: TrackShareParams): Promise<void> {
    const { articleId, userId, sessionId, platform } = params;

    try {
      const eventData: AnalyticsEventData = {
        eventType: 'article_share',
        entityType: 'article',
        entityId: articleId,
        userId,
        sessionId,
        metadata: {
          platform,
        },
      };

      await trackEvent(eventData);

      logger.debug('Article share tracked', { articleId, userId, platform });
    } catch (error) {
      logger.error('Failed to track article share:', error);
      Sentry.captureException(error, {
        tags: { operation: 'track_article_share' },
        contexts: {
          params: params as Record<string, any>,
        },
      });
    }
  }

  /**
   * Track article bookmark
   */
  async trackArticleBookmark(params: TrackBookmarkParams): Promise<void> {
    const { articleId, userId, collectionId } = params;

    try {
      const eventData: AnalyticsEventData = {
        eventType: 'article_bookmark',
        entityType: 'article',
        entityId: articleId,
        userId,
        metadata: {
          collectionId,
        },
      };

      await trackEvent(eventData);

      logger.debug('Article bookmark tracked', { articleId, userId });
    } catch (error) {
      logger.error('Failed to track article bookmark:', error);
      Sentry.captureException(error, {
        tags: { operation: 'track_article_bookmark' },
        contexts: {
          params: params as Record<string, any>,
        },
      });
    }
  }

  /**
   * Calculate estimated reading time based on word count
   * @param wordCount - Number of words in article
   * @returns Estimated reading time in minutes
   */
  calculateReadingTime(wordCount: number): number {
    return Math.ceil(wordCount / this.READ_TIME_WPM);
  }

  /**
   * Get Redis key for view deduplication
   */
  private getViewDedupKey(articleId: string, ipAddress: string): string {
    return `analytics:view:${articleId}:${ipAddress}`;
  }

  /**
   * Check if IP has recently viewed an article
   */
  async hasRecentView(articleId: string, ipAddress: string): Promise<boolean> {
    try {
      const dedupKey = this.getViewDedupKey(articleId, ipAddress);
      const exists = await redis.exists(dedupKey);
      return exists === 1;
    } catch (error) {
      logger.error('Failed to check recent view:', error);
      return false;
    }
  }

  /**
   * Clear view deduplication cache (for testing)
   */
  async clearViewDedup(articleId: string, ipAddress: string): Promise<void> {
    try {
      const dedupKey = this.getViewDedupKey(articleId, ipAddress);
      await redis.del(dedupKey);
    } catch (error) {
      logger.error('Failed to clear view dedup:', error);
    }
  }

  /**
   * Hash IP address using SHA-256 for privacy
   */
  private hashIp(ipAddress: string): string {
    return crypto.createHash('sha256').update(ipAddress).digest('hex');
  }

  /**
   * Get article analytics statistics
   */
  async getArticleAnalytics(articleId: string, daysAgo?: number) {
    try {
      return await this.viewsRepository.getViewStats(articleId, daysAgo);
    } catch (error) {
      logger.error('Failed to get article analytics:', error);
      Sentry.captureException(error, {
        tags: { operation: 'get_article_analytics' },
        extra: { articleId, daysAgo },
      });
      throw error;
    }
  }

  /**
   * Get popular articles
   */
  async getPopularArticles(limit: number = 10, daysAgo?: number) {
    try {
      return await this.viewsRepository.getPopularArticles(limit, daysAgo);
    } catch (error) {
      logger.error('Failed to get popular articles:', error);
      Sentry.captureException(error, {
        tags: { operation: 'get_popular_articles' },
        extra: { limit, daysAgo },
      });
      throw error;
    }
  }

  /**
   * Get trending articles
   */
  async getTrendingArticles(limit: number = 10) {
    try {
      return await this.viewsRepository.getTrendingArticles(limit);
    } catch (error) {
      logger.error('Failed to get trending articles:', error);
      Sentry.captureException(error, {
        tags: { operation: 'get_trending_articles' },
        extra: { limit },
      });
      throw error;
    }
  }
}

export default new AnalyticsService();
