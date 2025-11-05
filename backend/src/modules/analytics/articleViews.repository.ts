import { PrismaClient, ArticleView, Prisma } from '@prisma/client';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

/**
 * Article Views Repository
 *
 * Data access layer for article view tracking and analytics.
 * Handles:
 * - Creating view records with deduplication
 * - Querying view statistics
 * - Aggregating analytics data
 */

export interface CreateArticleViewData {
  articleId: string;
  userId?: string;
  ipHash?: string;
  sessionId?: string;
  timeOnPage?: number;
  scrollDepth?: number;
  userAgent?: string;
  referrer?: string;
}

export interface ViewStatsResult {
  totalViews: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  bounceRate: number;
}

export interface PopularArticle {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  uniqueViewCount: number;
  publishedAt: Date;
}

export interface TrendingArticle extends PopularArticle {
  trendingScore: number;
  recentViews: number;
  avgTimeOnPage: number;
}

export class ArticleViewsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new article view record
   */
  async createView(data: CreateArticleViewData): Promise<ArticleView> {
    try {
      return await this.prisma.articleView.create({
        data: {
          articleId: data.articleId,
          userId: data.userId,
          ipHash: data.ipHash,
          sessionId: data.sessionId,
          timeOnPage: data.timeOnPage || 0,
          scrollDepth: data.scrollDepth || 0,
          userAgent: data.userAgent,
          referrer: data.referrer,
        },
      });
    } catch (error) {
      logger.error('Failed to create article view:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleViewsRepository', method: 'createView' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Check if user has viewed article within time window
   * @param articleId - Article ID
   * @param userId - User ID
   * @param hoursAgo - Time window in hours (default 24)
   */
  async hasRecentViewByUser(
    articleId: string,
    userId: string,
    hoursAgo: number = 24
  ): Promise<boolean> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursAgo);

      const count = await this.prisma.articleView.count({
        where: {
          articleId,
          userId,
          viewedAt: {
            gte: cutoffTime,
          },
        },
      });

      return count > 0;
    } catch (error) {
      logger.error('Failed to check recent view by user:', error);
      return false;
    }
  }

  /**
   * Check if IP has viewed article within time window
   * @param articleId - Article ID
   * @param ipHash - Hashed IP address
   * @param hoursAgo - Time window in hours (default 24)
   */
  async hasRecentViewByIp(
    articleId: string,
    ipHash: string,
    hoursAgo: number = 24
  ): Promise<boolean> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursAgo);

      const count = await this.prisma.articleView.count({
        where: {
          articleId,
          ipHash,
          viewedAt: {
            gte: cutoffTime,
          },
        },
      });

      return count > 0;
    } catch (error) {
      logger.error('Failed to check recent view by IP:', error);
      return false;
    }
  }

  /**
   * Get view statistics for an article
   */
  async getViewStats(articleId: string, daysAgo?: number): Promise<ViewStatsResult> {
    try {
      const whereClause: Prisma.ArticleViewWhereInput = {
        articleId,
      };

      // Add date filter if specified
      if (daysAgo) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        whereClause.viewedAt = {
          gte: cutoffDate,
        };
      }

      // Get total views
      const totalViews = await this.prisma.articleView.count({
        where: whereClause,
      });

      // Get unique views (distinct users + distinct IPs)
      const [uniqueUsers, uniqueIps] = await Promise.all([
        this.prisma.articleView.findMany({
          where: {
            ...whereClause,
            userId: { not: null },
          },
          distinct: ['userId'],
          select: { userId: true },
        }),
        this.prisma.articleView.findMany({
          where: {
            ...whereClause,
            userId: null,
            ipHash: { not: null },
          },
          distinct: ['ipHash'],
          select: { ipHash: true },
        }),
      ]);

      const uniqueViews = uniqueUsers.length + uniqueIps.length;

      // Get engagement metrics aggregation
      const aggregation = await this.prisma.articleView.aggregate({
        where: whereClause,
        _avg: {
          timeOnPage: true,
          scrollDepth: true,
        },
      });

      const avgTimeOnPage = Math.round(aggregation._avg.timeOnPage || 0);
      const avgScrollDepth = Math.round(aggregation._avg.scrollDepth || 0);

      // Calculate bounce rate (views with < 30 seconds and < 30% scroll)
      const bounceCount = await this.prisma.articleView.count({
        where: {
          ...whereClause,
          OR: [
            { timeOnPage: { lt: 30 } },
            { scrollDepth: { lt: 30 } },
          ],
        },
      });

      const bounceRate = totalViews > 0 ? (bounceCount / totalViews) * 100 : 0;

      return {
        totalViews,
        uniqueViews,
        avgTimeOnPage,
        avgScrollDepth,
        bounceRate: Math.round(bounceRate * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get view stats:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleViewsRepository', method: 'getViewStats' },
        extra: { articleId, daysAgo },
      });
      throw error;
    }
  }

  /**
   * Get popular articles based on view count
   * @param limit - Number of articles to return
   * @param daysAgo - Time period to consider (optional)
   */
  async getPopularArticles(limit: number = 10, daysAgo?: number): Promise<PopularArticle[]> {
    try {
      const whereClause: Prisma.ArticleViewWhereInput = {};

      if (daysAgo) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        whereClause.viewedAt = {
          gte: cutoffDate,
        };
      }

      // Group by article and count views
      const popularViews = await this.prisma.articleView.groupBy({
        by: ['articleId'],
        where: whereClause,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: limit,
      });

      // Get article details for top articles
      const articleIds = popularViews.map((v) => v.articleId);

      const articles = await this.prisma.article.findMany({
        where: {
          id: { in: articleIds },
          status: 'published',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          viewCount: true,
          publishedAt: true,
        },
      });

      // Calculate unique views for each article
      const articlesWithStats = await Promise.all(
        articles.map(async (article) => {
          const stats = await this.getViewStats(article.id, daysAgo);
          return {
            ...article,
            uniqueViewCount: stats.uniqueViews,
            publishedAt: article.publishedAt!,
          };
        })
      );

      // Sort by total views (from the groupBy result)
      return articlesWithStats.sort((a, b) => b.viewCount - a.viewCount);
    } catch (error) {
      logger.error('Failed to get popular articles:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleViewsRepository', method: 'getPopularArticles' },
        extra: { limit, daysAgo },
      });
      throw error;
    }
  }

  /**
   * Get trending articles using weighted scoring algorithm
   * Formula: score = (views_7d * 0.5) + (avgTime * 0.3) + (recency * 0.2)
   */
  async getTrendingArticles(limit: number = 10): Promise<TrendingArticle[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get views from last 7 days with engagement metrics
      const recentViews = await this.prisma.articleView.groupBy({
        by: ['articleId'],
        where: {
          viewedAt: {
            gte: sevenDaysAgo,
          },
        },
        _count: {
          id: true,
        },
        _avg: {
          timeOnPage: true,
        },
      });

      // Calculate trending scores
      const now = new Date();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      const trenScores = await Promise.all(
        recentViews.map(async (view) => {
          const article = await this.prisma.article.findUnique({
            where: { id: view.articleId },
            select: {
              id: true,
              title: true,
              slug: true,
              viewCount: true,
              publishedAt: true,
              status: true,
            },
          });

          if (!article || article.status !== 'published' || !article.publishedAt) {
            return null;
          }

          // Calculate recency score (0-1, newer is higher)
          const publishedMs = article.publishedAt.getTime();
          const ageMs = now.getTime() - publishedMs;
          const recencyScore = Math.max(0, 1 - ageMs / (30 * 24 * 60 * 60 * 1000)); // 30 days max

          // Normalize time on page (0-1, assuming 600s = max engagement)
          const avgTime = view._avg.timeOnPage || 0;
          const timeScore = Math.min(1, avgTime / 600);

          // Normalize view count (0-1, log scale)
          const viewScore = Math.min(1, Math.log10(view._count.id + 1) / 3);

          // Calculate weighted score
          const trendingScore = viewScore * 0.5 + timeScore * 0.3 + recencyScore * 0.2;

          return {
            id: article.id,
            title: article.title,
            slug: article.slug,
            viewCount: article.viewCount,
            uniqueViewCount: 0, // Will be calculated separately
            publishedAt: article.publishedAt,
            trendingScore: Math.round(trendingScore * 1000) / 1000,
            recentViews: view._count.id,
            avgTimeOnPage: Math.round(avgTime),
          };
        })
      );

      // Filter out nulls and sort by trending score
      const validArticles = trenScores.filter((a): a is TrendingArticle => a !== null);
      validArticles.sort((a, b) => b.trendingScore - a.trendingScore);

      // Get unique view counts for top articles
      const topArticles = validArticles.slice(0, limit);
      const articlesWithUniqueViews = await Promise.all(
        topArticles.map(async (article) => {
          const stats = await this.getViewStats(article.id, 7);
          return {
            ...article,
            uniqueViewCount: stats.uniqueViews,
          };
        })
      );

      return articlesWithUniqueViews;
    } catch (error) {
      logger.error('Failed to get trending articles:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleViewsRepository', method: 'getTrendingArticles' },
        extra: { limit },
      });
      throw error;
    }
  }

  /**
   * Get view count for a specific time period
   */
  async getViewCountByPeriod(
    articleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      return await this.prisma.articleView.count({
        where: {
          articleId,
          viewedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get view count by period:', error);
      return 0;
    }
  }

  /**
   * Update view metrics (time_on_page, scroll_depth) for existing view
   */
  async updateViewMetrics(
    viewId: string,
    timeOnPage: number,
    scrollDepth: number
  ): Promise<ArticleView | null> {
    try {
      return await this.prisma.articleView.update({
        where: { id: viewId },
        data: {
          timeOnPage,
          scrollDepth,
        },
      });
    } catch (error) {
      logger.error('Failed to update view metrics:', error);
      return null;
    }
  }
}

export default ArticleViewsRepository;
