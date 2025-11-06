/**
 * Admin Dashboard Service
 *
 * Business logic for admin dashboard with real-time metrics and caching
 */

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import * as Sentry from '@sentry/node';
import { AdminRepository } from './admin.repository';
import {
  AdminDashboardData,
  RealTimeStats,
  KeyMetrics,
  SystemHealth,
  GrowthCharts,
} from './types/admin.types';
import logger from '../../utils/logger';

export class AdminService {
  private adminRepo: AdminRepository;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_KEY = 'admin:dashboard';
  private readonly REDIS_PREFIX = 'admin:realtime:';

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    this.adminRepo = new AdminRepository(prisma);
  }

  /**
   * Get complete admin dashboard data
   */
  async getDashboardData(forceRefresh: boolean = false): Promise<AdminDashboardData> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'AdminService.getDashboardData',
    });

    const startTime = Date.now();

    try {
      // Try to get from cache unless force refresh
      if (!forceRefresh) {
        const cached = await this.redis.get(this.CACHE_KEY);
        if (cached) {
          transaction.finish();
          logger.info('Admin dashboard served from cache');
          return JSON.parse(cached);
        }
      }

      // Fetch all data in parallel
      const [realTimeStats, keyMetrics, quickStats, growthCharts, alerts, recentActivity, systemHealth] =
        await Promise.all([
          this.getRealTimeStats(),
          this.getKeyMetrics(),
          this.adminRepo.getQuickStats(),
          this.getGrowthCharts(),
          this.adminRepo.getAlerts(10),
          this.adminRepo.getRecentActivity(20),
          this.getSystemHealth(),
        ]);

      const dashboardData: AdminDashboardData = {
        realTimeStats,
        keyMetrics,
        quickStats,
        growthCharts,
        alerts,
        recentActivity,
        systemHealth,
        generatedAt: new Date(),
      };

      // Cache the result
      await this.redis.setex(this.CACHE_KEY, this.CACHE_TTL, JSON.stringify(dashboardData));

      const executionTime = Date.now() - startTime;
      logger.info('Admin dashboard data generated', {
        executionTime,
        hasAlerts: alerts.length > 0,
      });

      transaction.finish();
      return dashboardData;
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Admin dashboard generation failed', { error });
      throw error;
    }
  }

  /**
   * Get real-time statistics from Redis
   */
  private async getRealTimeStats(): Promise<RealTimeStats> {
    const transaction = Sentry.startTransaction({
      op: 'redis',
      name: 'AdminService.getRealTimeStats',
    });

    try {
      // Get values from Redis
      const [usersOnlineStr, postsPerHourStr] = await Promise.all([
        this.redis.get(`${this.REDIS_PREFIX}users_online`),
        this.redis.get(`${this.REDIS_PREFIX}posts_per_hour`),
      ]);

      // Get applications today from database
      const applicationsToday = await this.adminRepo.getApplicationsToday();

      transaction.finish();

      return {
        usersOnline: parseInt(usersOnlineStr || '0', 10),
        postsPerHour: parseInt(postsPerHourStr || '0', 10),
        applicationsToday,
      };
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Failed to get real-time stats', { error });
      // Return zeros instead of throwing
      return {
        usersOnline: 0,
        postsPerHour: 0,
        applicationsToday: 0,
      };
    }
  }

  /**
   * Get key metrics (DAU, MAU, WAU, MRR, ARPU, NPS, retention)
   */
  private async getKeyMetrics(): Promise<KeyMetrics> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AdminService.getKeyMetrics',
    });

    try {
      const [dau, wau, mau, retentionRate, latestMetrics] = await Promise.all([
        this.adminRepo.getDailyActiveUsers(),
        this.adminRepo.getWeeklyActiveUsers(),
        this.adminRepo.getMonthlyActiveUsers(),
        this.adminRepo.calculateRetentionRate(),
        this.adminRepo.getLatestMetrics(),
      ]);

      const mrr = latestMetrics?.mrr || 0;
      const arpu = latestMetrics?.arpu || 0;

      transaction.finish();

      return {
        dau,
        mau,
        wau,
        mrr,
        arpu,
        nps: null, // TODO: Implement NPS calculation when survey system is ready
        retentionRate: Math.round(retentionRate * 100) / 100, // Round to 2 decimals
      };
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Failed to get key metrics', { error });
      throw error;
    }
  }

  /**
   * Get growth charts data (users, content, revenue)
   */
  private async getGrowthCharts(): Promise<GrowthCharts> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AdminService.getGrowthCharts',
    });

    try {
      // Get data for last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const [users, content, revenue] = await Promise.all([
        this.adminRepo.getUserGrowthData(startDate, endDate),
        this.adminRepo.getContentGrowthData(startDate, endDate),
        this.adminRepo.getRevenueGrowthData(startDate, endDate),
      ]);

      transaction.finish();

      return {
        users,
        content,
        revenue,
      };
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Failed to get growth charts', { error });
      throw error;
    }
  }

  /**
   * Get system health metrics
   */
  private async getSystemHealth(): Promise<SystemHealth> {
    const transaction = Sentry.startTransaction({
      op: 'system',
      name: 'AdminService.getSystemHealth',
    });

    try {
      // Check Redis connection
      let redisStatus: 'connected' | 'disconnected' = 'connected';
      try {
        await this.redis.ping();
      } catch {
        redisStatus = 'disconnected';
      }

      // Check database connection
      let databaseStatus: 'connected' | 'disconnected' = 'connected';
      try {
        await this.prisma.$queryRaw`SELECT 1`;
      } catch {
        databaseStatus = 'disconnected';
      }

      // Get database size
      let databaseSize = 'N/A';
      try {
        const result: any[] = await this.prisma.$queryRaw`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size;
        `;
        databaseSize = result[0]?.size || 'N/A';
      } catch (error) {
        logger.warn('Failed to get database size', { error });
      }

      // Get API response time from latest metrics
      const latestMetrics = await this.adminRepo.getLatestMetrics();
      const avgApiLatency = latestMetrics?.avgApiLatency || 0;

      // Calculate error rate (errors per 1000 requests - simplified)
      const errorCount = await this.adminRepo.getErrorCountToday();
      const errorRate = errorCount > 0 ? (errorCount / 1000) * 100 : 0;

      transaction.finish();

      return {
        apiResponseTime: {
          avg: avgApiLatency,
          p95: avgApiLatency * 1.5, // Simplified approximation
          p99: avgApiLatency * 2, // Simplified approximation
        },
        errorRate: Math.round(errorRate * 100) / 100,
        databaseSize,
        redisStatus,
        databaseStatus,
      };
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Failed to get system health', { error });
      throw error;
    }
  }

  /**
   * Increment online users counter
   */
  async incrementOnlineUsers(userId: string): Promise<void> {
    try {
      const key = `${this.REDIS_PREFIX}users_online`;
      const userKey = `${this.REDIS_PREFIX}user:${userId}`;

      // Add user to online set with 5-minute expiry
      await this.redis.setex(userKey, 300, '1');

      // Count all online users (keys matching pattern)
      const keys = await this.redis.keys(`${this.REDIS_PREFIX}user:*`);
      await this.redis.set(key, keys.length);
    } catch (error) {
      logger.error('Failed to increment online users', { error, userId });
      // Don't throw - this is not critical
    }
  }

  /**
   * Increment posts per hour counter
   */
  async incrementPostsPerHour(): Promise<void> {
    try {
      const key = `${this.REDIS_PREFIX}posts_per_hour`;
      const hourKey = `${this.REDIS_PREFIX}posts:${new Date().getHours()}`;

      // Increment counter for current hour
      await this.redis.incr(hourKey);
      await this.redis.expire(hourKey, 3600); // Expire after 1 hour

      // Get count for current hour
      const count = await this.redis.get(hourKey);
      await this.redis.set(key, count || '0');
    } catch (error) {
      logger.error('Failed to increment posts per hour', { error });
      // Don't throw - this is not critical
    }
  }

  /**
   * Invalidate admin dashboard cache
   */
  async invalidateCache(): Promise<void> {
    try {
      await this.redis.del(this.CACHE_KEY);
      logger.info('Admin dashboard cache invalidated');
    } catch (error) {
      logger.error('Failed to invalidate cache', { error });
      Sentry.captureException(error);
    }
  }

  /**
   * Export dashboard data as CSV
   */
  async exportToCSV(startDate?: Date, endDate?: Date): Promise<string> {
    const transaction = Sentry.startTransaction({
      op: 'export',
      name: 'AdminService.exportToCSV',
    });

    try {
      // Default to last 30 days if no dates provided
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      const metrics = await this.prisma.platformMetrics.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Create CSV header
      const headers = [
        'Date',
        'Total Users',
        'New Users',
        'DAU',
        'WAU',
        'MAU',
        'Total Articles',
        'New Articles',
        'Total Topics',
        'New Topics',
        'Total Jobs',
        'Active Jobs',
        'Applications',
        'Page Views',
        'Error Count',
        'Spam Reports',
        'Abuse Reports',
      ];

      // Create CSV rows
      const rows = metrics.map((m) => [
        m.date.toISOString().split('T')[0],
        m.totalUsers,
        m.newUsers,
        m.activeUsers,
        m.weeklyActive,
        m.monthlyActive,
        m.totalArticles,
        m.newArticles,
        m.totalTopics,
        m.newTopics,
        m.totalJobs,
        m.activeJobs,
        m.applications,
        m.pageViews,
        m.errorCount,
        m.spamReports,
        m.abuseReports,
      ]);

      // Combine header and rows
      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      transaction.finish();
      logger.info('CSV export generated', {
        rowCount: rows.length,
        startDate: start,
        endDate: end,
      });

      return csv;
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('CSV export failed', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Precompute and store daily metrics (called by cron job)
   */
  async precomputeDailyMetrics(date: Date = new Date()): Promise<void> {
    const transaction = Sentry.startTransaction({
      op: 'cron',
      name: 'AdminService.precomputeDailyMetrics',
    });

    const startTime = Date.now();

    try {
      logger.info('Starting daily metrics precomputation', { date });

      // Set date to start of day
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const [
        totalUsers,
        newUsers,
        dau,
        wau,
        mau,
        totalArticles,
        newArticles,
        totalTopics,
        newTopics,
        totalReplies,
        newReplies,
        totalJobs,
        activeJobs,
        newJobs,
        applications,
      ] = await Promise.all([
        // User metrics
        this.prisma.user.count({ where: { status: { not: 'deleted' } } }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: targetDate,
              lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.adminRepo.getDailyActiveUsers(),
        this.adminRepo.getWeeklyActiveUsers(),
        this.adminRepo.getMonthlyActiveUsers(),
        // Article metrics
        this.prisma.article.count({ where: { status: 'published' } }),
        this.prisma.article.count({
          where: {
            publishedAt: {
              gte: targetDate,
              lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
            },
            status: 'published',
          },
        }),
        // Topic metrics
        this.prisma.topic.count({ where: { status: { not: 'archived' } } }),
        this.prisma.topic.count({
          where: {
            createdAt: {
              gte: targetDate,
              lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        }),
        // Reply metrics
        this.prisma.reply.count(),
        this.prisma.reply.count({
          where: {
            createdAt: {
              gte: targetDate,
              lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        }),
        // Job metrics
        this.prisma.job.count(),
        this.prisma.job.count({ where: { status: 'active' } }),
        this.prisma.job.count({
          where: {
            publishedAt: {
              gte: targetDate,
              lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        }),
        // Application metrics
        this.prisma.application.count({
          where: {
            createdAt: {
              gte: targetDate,
              lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      // Store metrics in database
      await this.adminRepo.storeDailyMetrics(targetDate, {
        totalUsers,
        newUsers,
        activeUsers: dau,
        weeklyActive: wau,
        monthlyActive: mau,
        totalArticles,
        newArticles,
        totalTopics,
        newTopics,
        totalReplies,
        newReplies,
        totalJobs,
        activeJobs,
        newJobs,
        applications,
        pageViews: 0, // TODO: Implement page view tracking
        uniqueVisitors: 0, // TODO: Implement visitor tracking
        errorCount: 0, // TODO: Get from error tracking
        spamReports: 0, // TODO: Get from moderation
        abuseReports: 0, // TODO: Get from moderation
      });

      // Invalidate dashboard cache
      await this.invalidateCache();

      const executionTime = Date.now() - startTime;
      logger.info('Daily metrics precomputation completed', {
        date: targetDate,
        executionTime,
        metrics: {
          totalUsers,
          newUsers,
          dau,
          mau,
        },
      });

      transaction.finish();
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Daily metrics precomputation failed', { error, date });
      throw error;
    }
  }
}
