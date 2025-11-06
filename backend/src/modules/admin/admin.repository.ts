/**
 * Admin Repository
 *
 * Database queries for admin dashboard metrics and statistics
 */

import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '../../utils/logger';
import { QuickStats, RecentActivity, Alert, TimeSeriesData } from './types/admin.types';

export class AdminRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get quick stats (total counts)
   */
  async getQuickStats(): Promise<QuickStats> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AdminRepository.getQuickStats',
    });

    try {
      const [totalUsers, totalArticles, totalTopics, totalJobs, totalApplications] =
        await Promise.all([
          this.prisma.user.count({ where: { status: { not: 'deleted' } } }),
          this.prisma.article.count({ where: { status: 'published' } }),
          this.prisma.topic.count({ where: { status: { not: 'archived' } } }),
          this.prisma.job.count({ where: { status: 'active' } }),
          this.prisma.application.count(),
        ]);

      transaction.finish();

      return {
        totalUsers,
        totalArticles,
        totalTopics,
        totalJobs,
        totalApplications,
      };
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Failed to get quick stats', { error });
      throw error;
    }
  }

  /**
   * Get Daily Active Users (DAU)
   */
  async getDailyActiveUsers(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.user.count({
      where: {
        lastLoginAt: {
          gte: today,
        },
        status: 'active',
      },
    });
  }

  /**
   * Get Weekly Active Users (WAU)
   */
  async getWeeklyActiveUsers(): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return this.prisma.user.count({
      where: {
        lastLoginAt: {
          gte: weekAgo,
        },
        status: 'active',
      },
    });
  }

  /**
   * Get Monthly Active Users (MAU)
   */
  async getMonthlyActiveUsers(): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    return this.prisma.user.count({
      where: {
        lastLoginAt: {
          gte: monthAgo,
        },
        status: 'active',
      },
    });
  }

  /**
   * Get new users count for today
   */
  async getNewUsersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.user.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });
  }

  /**
   * Get applications submitted today
   */
  async getApplicationsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.application.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AdminRepository.getRecentActivity',
    });

    try {
      const activities: RecentActivity[] = [];

      // Get recent user registrations
      const recentUsers = await this.prisma.user.findMany({
        where: { status: { not: 'deleted' } },
        select: {
          id: true,
          username: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: Math.floor(limit / 4),
      });

      recentUsers.forEach((user) => {
        activities.push({
          id: user.id,
          type: 'user_registered',
          description: `New user registered: ${user.username}`,
          userId: user.id,
          userName: user.username,
          timestamp: user.createdAt,
        });
      });

      // Get recent published articles
      const recentArticles = await this.prisma.article.findMany({
        where: { status: 'published' },
        select: {
          id: true,
          title: true,
          publishedAt: true,
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: Math.floor(limit / 4),
      });

      recentArticles.forEach((article) => {
        if (article.publishedAt) {
          activities.push({
            id: article.id,
            type: 'article_published',
            description: `Article published: "${article.title}"`,
            userId: article.author.id,
            userName: article.author.username,
            timestamp: article.publishedAt,
          });
        }
      });

      // Get recent topics
      const recentTopics = await this.prisma.topic.findMany({
        where: { status: { not: 'archived' } },
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.floor(limit / 4),
      });

      recentTopics.forEach((topic) => {
        activities.push({
          id: topic.id,
          type: 'topic_created',
          description: `Topic created: "${topic.title}"`,
          userId: topic.author.id,
          userName: topic.author.username,
          timestamp: topic.createdAt,
        });
      });

      // Get recent job postings
      const recentJobs = await this.prisma.job.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          title: true,
          publishedAt: true,
          company: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: Math.floor(limit / 4),
      });

      recentJobs.forEach((job) => {
        if (job.publishedAt) {
          activities.push({
            id: job.id,
            type: 'job_posted',
            description: `Job posted: "${job.title}" by ${job.company.name}`,
            timestamp: job.publishedAt,
            metadata: {
              companyName: job.company.name,
            },
          });
        }
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      transaction.finish();

      return activities.slice(0, limit);
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Failed to get recent activity', { error });
      throw error;
    }
  }

  /**
   * Get alerts (errors, spam reports, abuse flags)
   */
  async getAlerts(limit: number = 10): Promise<Alert[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AdminRepository.getAlerts',
    });

    try {
      const alerts: Alert[] = [];
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      // Get pending moderation reports
      const pendingReports = await this.prisma.moderationReport.count({
        where: {
          status: 'pending',
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      if (pendingReports > 0) {
        alerts.push({
          id: 'pending-reports',
          type: 'spam',
          severity: pendingReports > 10 ? 'high' : 'medium',
          message: `${pendingReports} pending moderation report${pendingReports > 1 ? 's' : ''}`,
          count: pendingReports,
          timestamp: new Date(),
          url: '/admin/moderation',
        });
      }

      // Get spam reports
      const spamReports = await this.prisma.moderationReport.count({
        where: {
          reason: 'spam',
          status: 'pending',
        },
      });

      if (spamReports > 5) {
        alerts.push({
          id: 'spam-reports',
          type: 'spam',
          severity: spamReports > 20 ? 'critical' : 'medium',
          message: `${spamReports} spam reports awaiting review`,
          count: spamReports,
          timestamp: new Date(),
          url: '/admin/moderation?filter=spam',
        });
      }

      // Get abuse reports
      const abuseReports = await this.prisma.moderationReport.count({
        where: {
          reason: 'harassment',
          status: 'pending',
        },
      });

      if (abuseReports > 0) {
        alerts.push({
          id: 'abuse-reports',
          type: 'abuse',
          severity: 'critical',
          message: `${abuseReports} abuse report${abuseReports > 1 ? 's' : ''} require immediate attention`,
          count: abuseReports,
          timestamp: new Date(),
          url: '/admin/moderation?filter=harassment',
        });
      }

      transaction.finish();

      // Sort by severity (critical > high > medium > low)
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      return alerts.slice(0, limit);
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Failed to get alerts', { error });
      throw error;
    }
  }

  /**
   * Get user growth time series data
   */
  async getUserGrowthData(startDate: Date, endDate: Date): Promise<TimeSeriesData[]> {
    const metrics = await this.prisma.platformMetrics.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        totalUsers: true,
        newUsers: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return metrics.map((metric) => ({
      date: metric.date.toISOString().split('T')[0],
      value: metric.totalUsers,
      label: `${metric.newUsers} new`,
    }));
  }

  /**
   * Get content growth time series data
   */
  async getContentGrowthData(startDate: Date, endDate: Date): Promise<TimeSeriesData[]> {
    const metrics = await this.prisma.platformMetrics.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        totalArticles: true,
        totalTopics: true,
        newArticles: true,
        newTopics: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return metrics.map((metric) => ({
      date: metric.date.toISOString().split('T')[0],
      value: metric.totalArticles + metric.totalTopics,
      label: `${metric.newArticles + metric.newTopics} new`,
    }));
  }

  /**
   * Get revenue growth time series data
   */
  async getRevenueGrowthData(startDate: Date, endDate: Date): Promise<TimeSeriesData[]> {
    const metrics = await this.prisma.platformMetrics.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        mrr: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return metrics.map((metric) => ({
      date: metric.date.toISOString().split('T')[0],
      value: metric.mrr || 0,
    }));
  }

  /**
   * Get error count for today
   */
  async getErrorCountToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metrics = await this.prisma.platformMetrics.findFirst({
      where: {
        date: {
          gte: today,
        },
      },
      select: {
        errorCount: true,
      },
    });

    return metrics?.errorCount || 0;
  }

  /**
   * Calculate user retention rate
   */
  async calculateRetentionRate(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Users who signed up 30-60 days ago
    const cohortUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lte: thirtyDaysAgo,
        },
      },
    });

    if (cohortUsers === 0) return 0;

    // How many of them are still active
    const activeFromCohort = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lte: thirtyDaysAgo,
        },
        lastLoginAt: {
          gte: thirtyDaysAgo,
        },
        status: 'active',
      },
    });

    return (activeFromCohort / cohortUsers) * 100;
  }

  /**
   * Store daily metrics
   */
  async storeDailyMetrics(date: Date, metrics: Partial<any>): Promise<void> {
    await this.prisma.platformMetrics.upsert({
      where: { date },
      update: metrics,
      create: {
        date,
        ...metrics,
      },
    });
  }

  /**
   * Get latest platform metrics
   */
  async getLatestMetrics() {
    return this.prisma.platformMetrics.findFirst({
      orderBy: {
        date: 'desc',
      },
    });
  }
}
