/**
 * Dashboard Service
 *
 * Business logic for personalized dashboard with modular widget system
 */

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import * as Sentry from '@sentry/node';
import { DashboardRepository } from './dashboard.repository';
import { FollowsService } from '../follows/follows.service';
import {
  DashboardData,
  GetDashboardOptions,
  QuickAction,
  ForYouItem,
  WidgetType,
  DashboardConfig,
} from './types/dashboard.types';
import { UpdateDashboardConfigInput } from './dashboard.validation';
import logger from '../../utils/logger';

export class DashboardService {
  private dashboardRepo: DashboardRepository;
  private followsService: FollowsService;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'dashboard:';

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    this.dashboardRepo = new DashboardRepository(prisma);
    this.followsService = new FollowsService(prisma, redis);
  }

  /**
   * Get personalized dashboard data for user
   */
  async getDashboard(options: GetDashboardOptions): Promise<DashboardData> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'DashboardService.getDashboard',
    });

    const startTime = Date.now();

    try {
      const { userId, includeWidgets, limit = 10 } = options;

      // Try to get from cache
      const cacheKey = `${this.CACHE_PREFIX}${userId}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        transaction.finish();
        logger.info('Dashboard data served from cache', { userId });
        return JSON.parse(cached);
      }

      // Get user's dashboard configuration
      const config = await this.dashboardRepo.getDashboardConfig(userId);
      const enabledWidgets = config?.widgets.filter((w) => w.enabled) || [];

      // Determine which widgets to fetch
      const widgetsToFetch = includeWidgets
        ? enabledWidgets.filter((w) => includeWidgets.includes(w.id))
        : enabledWidgets;

      // Fetch widget data in parallel using modular widget system
      const widgetData = await this.fetchWidgets(userId, widgetsToFetch, limit);

      // Generate For You feed
      const forYouFeed = await this.generateForYouFeed(userId, limit);

      // Get recent user activity
      const recentActivity = await this.dashboardRepo.getUserActivity(userId, limit);

      // Get quick actions
      const quickActions = this.getQuickActions();

      const dashboardData: DashboardData = {
        widgets: widgetData,
        forYouFeed,
        recentActivity,
        quickActions,
        config: config || this.getDefaultConfig(),
      };

      // Cache the result
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(dashboardData));

      const executionTime = Date.now() - startTime;
      logger.info('Dashboard data generated', {
        userId,
        executionTime,
        widgetCount: widgetsToFetch.length,
      });

      transaction.finish();
      return dashboardData;
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error, {
        extra: { userId: options.userId },
      });
      logger.error('Dashboard generation failed', { error, options });
      throw error;
    }
  }

  /**
   * Update user's dashboard configuration
   */
  async updateConfig(
    userId: string,
    input: UpdateDashboardConfigInput
  ): Promise<DashboardConfig> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'DashboardService.updateConfig',
    });

    try {
      const config: DashboardConfig = {
        widgets: input.widgets,
      };

      const updated = await this.dashboardRepo.updateDashboardConfig(userId, config);

      // Invalidate dashboard cache
      await this.invalidateCache(userId);

      logger.info('Dashboard config updated', { userId, config });

      transaction.finish();
      return updated;
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error, {
        extra: { userId, input },
      });
      logger.error('Dashboard config update failed', { error, userId, input });
      throw error;
    }
  }

  // ============================================================================
  // Widget Fetchers - Modular widget system
  // ============================================================================

  /**
   * Fetch all requested widgets in parallel
   */
  private async fetchWidgets(
    userId: string,
    widgets: Array<{ id: WidgetType; enabled: boolean; order: number }>,
    limit: number
  ): Promise<DashboardData['widgets']> {
    const widgetFetchers = new Map<WidgetType, () => Promise<any>>([
      ['top_stories_today', () => this.fetchTopStoriesToday(limit)],
      ['trending_discussions', () => this.fetchTrendingDiscussions(limit)],
      ['job_matches', () => this.fetchJobMatches(userId, limit)],
      ['your_stats', () => this.fetchYourStats(userId)],
      ['following_activity', () => this.fetchFollowingActivity(userId, limit)],
      ['trending_tags', () => this.fetchTrendingTags(limit)],
    ]);

    const widgetData: DashboardData['widgets'] = {};

    // Fetch enabled widgets in parallel
    const widgetPromises = widgets.map(async (widget) => {
      const fetcher = widgetFetchers.get(widget.id);
      if (fetcher) {
        try {
          const data = await fetcher();
          return { id: widget.id, data };
        } catch (error) {
          logger.error(`Widget fetch failed: ${widget.id}`, { error, userId });
          Sentry.captureException(error, {
            extra: { widgetId: widget.id, userId },
          });
          return { id: widget.id, data: null };
        }
      }
      return { id: widget.id, data: null };
    });

    const results = await Promise.all(widgetPromises);

    // Map results to widget data object
    results.forEach((result) => {
      if (result.data !== null) {
        switch (result.id) {
          case 'top_stories_today':
            widgetData.topStoriesToday = result.data;
            break;
          case 'trending_discussions':
            widgetData.trendingDiscussions = result.data;
            break;
          case 'job_matches':
            widgetData.jobMatches = result.data;
            break;
          case 'your_stats':
            widgetData.yourStats = result.data;
            break;
          case 'following_activity':
            widgetData.followingActivity = result.data;
            break;
          case 'trending_tags':
            widgetData.trendingTags = result.data;
            break;
        }
      }
    });

    return widgetData;
  }

  private async fetchTopStoriesToday(limit: number) {
    return this.dashboardRepo.getTopStoriesToday(limit);
  }

  private async fetchTrendingDiscussions(limit: number) {
    return this.dashboardRepo.getTrendingDiscussions(limit);
  }

  private async fetchJobMatches(userId: string, limit: number) {
    return this.dashboardRepo.getJobMatchesForUser(userId, limit);
  }

  private async fetchYourStats(userId: string) {
    return this.dashboardRepo.getUserStats(userId);
  }

  private async fetchFollowingActivity(userId: string, limit: number) {
    try {
      const feed = await this.followsService.getFollowingFeed(userId, {
        type: 'all',
        limit,
        offset: 0,
      });

      // Transform to FollowingActivity format
      return feed.data.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        excerpt: item.excerpt || item.content?.substring(0, 150),
        url:
          item.type === 'article'
            ? `/news/${item.slug}`
            : item.type === 'topic'
              ? `/forum/${item.slug}`
              : `/jobs/${item.slug}`,
        createdAt: item.createdAt,
        author: item.author,
        company: item.company,
        category: item.category,
      }));
    } catch (error) {
      logger.error('Following activity fetch failed', { error, userId });
      return [];
    }
  }

  private async fetchTrendingTags(limit: number) {
    return this.dashboardRepo.getTrendingTags(limit);
  }

  // ============================================================================
  // For You Feed Generation
  // ============================================================================

  /**
   * Generate personalized For You feed
   * Combines: followed categories articles, trending topics, high-match jobs
   */
  private async generateForYouFeed(userId: string, limit: number): Promise<ForYouItem[]> {
    try {
      const forYouItems: ForYouItem[] = [];

      // Get user's followed entities
      const followedCategories = await this.prisma.follow.findMany({
        where: {
          followerId: userId,
          followableType: 'category',
        },
        select: { followableId: true },
      });

      const followedTags = await this.prisma.follow.findMany({
        where: {
          followerId: userId,
          followableType: 'tag',
        },
        select: { followableId: true },
      });

      const followedCompanies = await this.prisma.follow.findMany({
        where: {
          followerId: userId,
          followableType: 'company',
        },
        select: { followableId: true },
      });

      const categoryIds = followedCategories.map((f) => f.followableId);
      const tagIds = followedTags.map((f) => f.followableId);
      const companyIds = followedCompanies.map((f) => f.followableId);

      // Fetch articles from followed categories (if any)
      if (categoryIds.length > 0) {
        const articles = await this.prisma.article.findMany({
          where: {
            categoryId: { in: categoryIds },
            status: 'published',
          },
          select: {
            id: true,
            title: true,
            excerpt: true,
            slug: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        articles.forEach((article) => {
          forYouItems.push({
            id: article.id,
            type: 'article',
            title: article.title,
            excerpt: article.excerpt,
            url: `/news/${article.slug}`,
            reason: 'From a category you follow',
            relevanceScore: 80,
            createdAt: article.createdAt,
            metadata: {},
          });
        });
      }

      // Fetch topics with followed tags (if any)
      if (tagIds.length > 0) {
        const topics = await this.prisma.topic.findMany({
          where: {
            tags: {
              some: {
                tagId: { in: tagIds },
              },
            },
            status: { not: 'archived' },
          },
          select: {
            id: true,
            title: true,
            content: true,
            slug: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        topics.forEach((topic) => {
          forYouItems.push({
            id: topic.id,
            type: 'topic',
            title: topic.title,
            excerpt: topic.content.substring(0, 150),
            url: `/forum/${topic.slug}`,
            reason: 'Tagged with topics you follow',
            relevanceScore: 75,
            createdAt: topic.createdAt,
            metadata: {},
          });
        });
      }

      // Fetch jobs from followed companies (if any)
      if (companyIds.length > 0) {
        const jobs = await this.prisma.job.findMany({
          where: {
            companyId: { in: companyIds },
            status: 'active',
            expiresAt: { gt: new Date() },
          },
          select: {
            id: true,
            title: true,
            description: true,
            slug: true,
            createdAt: true,
            company: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        jobs.forEach((job) => {
          forYouItems.push({
            id: job.id,
            type: 'job',
            title: job.title,
            excerpt: job.description.substring(0, 150),
            url: `/jobs/${job.slug}`,
            reason: `From ${job.company.name}, a company you follow`,
            relevanceScore: 85,
            createdAt: job.createdAt,
            metadata: {},
          });
        });
      }

      // If user doesn't follow anything, show trending content
      if (forYouItems.length === 0) {
        const trendingTopics = await this.dashboardRepo.getTrendingDiscussions(5);
        trendingTopics.forEach((topic) => {
          forYouItems.push({
            id: topic.id,
            type: 'topic',
            title: topic.title,
            excerpt: '',
            url: `/forum/${topic.slug}`,
            reason: 'Trending in the community',
            relevanceScore: 60,
            createdAt: topic.createdAt,
            metadata: {},
          });
        });
      }

      // Sort by relevance and recency
      forYouItems.sort((a, b) => {
        const scoreA = a.relevanceScore + this.recencyBoost(a.createdAt);
        const scoreB = b.relevanceScore + this.recencyBoost(b.createdAt);
        return scoreB - scoreA;
      });

      return forYouItems.slice(0, limit);
    } catch (error) {
      logger.error('For You feed generation failed', { error, userId });
      Sentry.captureException(error, { extra: { userId } });
      return [];
    }
  }

  /**
   * Calculate recency boost for scoring
   */
  private recencyBoost(createdAt: Date): number {
    const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 6) return 20;
    if (hoursAgo < 24) return 10;
    if (hoursAgo < 72) return 5;
    return 0;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get quick actions
   */
  private getQuickActions(): QuickAction[] {
    return [
      {
        id: 'new_post',
        label: 'New Post',
        icon: 'plus-circle',
        url: '/forum/new',
        description: 'Start a new discussion',
      },
      {
        id: 'search_jobs',
        label: 'Search Jobs',
        icon: 'briefcase',
        url: '/jobs',
        description: 'Find your next opportunity',
      },
      {
        id: 'browse_forum',
        label: 'Browse Forum',
        icon: 'message-square',
        url: '/forum',
        description: 'Join the conversation',
      },
    ];
  }

  /**
   * Get default dashboard configuration
   */
  private getDefaultConfig(): DashboardConfig {
    return {
      widgets: [
        { id: 'top_stories_today', enabled: true, order: 0 },
        { id: 'trending_discussions', enabled: true, order: 1 },
        { id: 'job_matches', enabled: true, order: 2 },
        { id: 'your_stats', enabled: true, order: 3 },
        { id: 'following_activity', enabled: true, order: 4 },
        { id: 'trending_tags', enabled: true, order: 5 },
      ],
    };
  }

  /**
   * Invalidate dashboard cache
   */
  private async invalidateCache(userId: string): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${userId}`;
      await this.redis.del(cacheKey);
    } catch (error) {
      logger.error('Cache invalidation failed', { error, userId });
      Sentry.captureException(error);
      // Don't throw - cache invalidation failure shouldn't break operation
    }
  }
}
