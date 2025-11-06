/**
 * Analytics Repository
 *
 * Database queries for analytics and reports
 * Optimized for performance with proper indexing
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';

export interface UserGrowthData {
  date: Date;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  weeklyActive: number;
  monthlyActive: number;
}

export interface EngagementData {
  date: Date;
  pageViews: number;
  uniqueVisitors: number;
  avgSessionTime: number | null;
  bounceRate: number | null;
}

export interface ContentPerformanceData {
  date: Date;
  totalArticles: number;
  newArticles: number;
  totalTopics: number;
  newTopics: number;
  totalReplies: number;
  newReplies: number;
}

export interface RevenueData {
  date: Date;
  mrr: number | null;
  arpu: number | null;
  churn: number | null;
}

export interface TopContributor {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  contributionScore: number;
  articlesCount: number;
  topicsCount: number;
  repliesCount: number;
  helpfulVotes: number;
}

export interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
}

export interface CohortData {
  cohort: string;
  period0: number;
  period1: number;
  period2: number;
  period3: number;
  period4: number;
  period5: number;
  period6: number;
  period7: number;
}

export interface FunnelStep {
  step: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

export class AnalyticsRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get user growth metrics for date range
   */
  async getUserGrowth(startDate: Date, endDate: Date): Promise<UserGrowthData[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AnalyticsRepository.getUserGrowth',
    });

    try {
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
          activeUsers: true,
          weeklyActive: true,
          monthlyActive: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      transaction.finish();
      return metrics;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get user growth', { error, startDate, endDate });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get engagement metrics for date range
   */
  async getEngagementTrends(startDate: Date, endDate: Date): Promise<EngagementData[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AnalyticsRepository.getEngagementTrends',
    });

    try {
      const metrics = await this.prisma.platformMetrics.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          date: true,
          pageViews: true,
          uniqueVisitors: true,
          avgSessionTime: true,
          bounceRate: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      transaction.finish();
      return metrics;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get engagement trends', { error, startDate, endDate });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get content performance metrics
   */
  async getContentPerformance(startDate: Date, endDate: Date): Promise<ContentPerformanceData[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AnalyticsRepository.getContentPerformance',
    });

    try {
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
          newArticles: true,
          totalTopics: true,
          newTopics: true,
          totalReplies: true,
          newReplies: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      transaction.finish();
      return metrics;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get content performance', { error, startDate, endDate });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get revenue metrics (for future)
   */
  async getRevenue(startDate: Date, endDate: Date): Promise<RevenueData[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AnalyticsRepository.getRevenue',
    });

    try {
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
          arpu: true,
          churn: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      transaction.finish();
      return metrics;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get revenue', { error, startDate, endDate });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get top contributors by activity
   */
  async getTopContributors(startDate: Date, endDate: Date, limit: number = 10): Promise<TopContributor[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AnalyticsRepository.getTopContributors',
    });

    try {
      // Query to get top contributors with aggregated metrics
      const contributors = await this.prisma.$queryRaw<TopContributor[]>`
        SELECT
          u.id as "userId",
          u.username,
          up.display_name as "displayName",
          up.avatar_url as "avatarUrl",
          (
            COALESCE(articles_count, 0) * 5 +
            COALESCE(topics_count, 0) * 3 +
            COALESCE(replies_count, 0) * 1 +
            COALESCE(helpful_votes, 0) * 2
          ) as "contributionScore",
          COALESCE(articles_count, 0) as "articlesCount",
          COALESCE(topics_count, 0) as "topicsCount",
          COALESCE(replies_count, 0) as "repliesCount",
          COALESCE(helpful_votes, 0) as "helpfulVotes"
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT LATERAL (
          SELECT COUNT(*) as articles_count
          FROM articles a
          WHERE a.author_id = u.id
          AND a.created_at >= ${startDate}
          AND a.created_at <= ${endDate}
        ) articles ON true
        LEFT LATERAL (
          SELECT COUNT(*) as topics_count
          FROM forum_topics ft
          WHERE ft.user_id = u.id
          AND ft.created_at >= ${startDate}
          AND ft.created_at <= ${endDate}
        ) topics ON true
        LEFT LATERAL (
          SELECT COUNT(*) as replies_count
          FROM forum_replies fr
          WHERE fr.user_id = u.id
          AND fr.created_at >= ${startDate}
          AND fr.created_at <= ${endDate}
        ) replies ON true
        LEFT LATERAL (
          SELECT COUNT(*) as helpful_votes
          FROM forum_votes fv
          JOIN forum_replies fr ON fv.reply_id = fr.id
          WHERE fr.user_id = u.id
          AND fv.vote_type = 'up'
          AND fv.created_at >= ${startDate}
          AND fv.created_at <= ${endDate}
        ) votes ON true
        WHERE (articles_count > 0 OR topics_count > 0 OR replies_count > 0)
        ORDER BY "contributionScore" DESC
        LIMIT ${limit}
      `;

      transaction.finish();
      return contributors;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get top contributors', { error, startDate, endDate, limit });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get traffic sources from analytics events
   */
  async getTrafficSources(startDate: Date, endDate: Date, limit: number = 10): Promise<TrafficSource[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AnalyticsRepository.getTrafficSources',
    });

    try {
      const sources = await this.prisma.$queryRaw<Array<{ source: string; visits: bigint }>>`
        SELECT
          COALESCE(
            CASE
              WHEN av.referrer LIKE '%google.%' THEN 'Google'
              WHEN av.referrer LIKE '%facebook.%' THEN 'Facebook'
              WHEN av.referrer LIKE '%twitter.%' OR av.referrer LIKE '%t.co%' THEN 'Twitter'
              WHEN av.referrer LIKE '%linkedin.%' THEN 'LinkedIn'
              WHEN av.referrer LIKE '%reddit.%' THEN 'Reddit'
              WHEN av.referrer IS NULL OR av.referrer = '' THEN 'Direct'
              ELSE 'Other'
            END,
            'Direct'
          ) as source,
          COUNT(DISTINCT av.id) as visits
        FROM article_views av
        WHERE av.viewed_at >= ${startDate}
        AND av.viewed_at <= ${endDate}
        GROUP BY source
        ORDER BY visits DESC
        LIMIT ${limit}
      `;

      // Calculate total visits for percentage
      const totalVisits = sources.reduce((sum, s) => sum + Number(s.visits), 0);

      const result = sources.map((s) => ({
        source: s.source,
        visits: Number(s.visits),
        percentage: totalVisits > 0 ? (Number(s.visits) / totalVisits) * 100 : 0,
      }));

      transaction.finish();
      return result;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get traffic sources', { error, startDate, endDate });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get cohort retention analysis
   */
  async getCohortRetention(startDate: Date, endDate: Date): Promise<CohortData[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AnalyticsRepository.getCohortRetention',
    });

    try {
      // Cohort analysis: group users by signup week and track retention
      const cohorts = await this.prisma.$queryRaw<CohortData[]>`
        WITH user_cohorts AS (
          SELECT
            id as user_id,
            DATE_TRUNC('week', created_at)::date as cohort_week
          FROM users
          WHERE created_at >= ${startDate}
          AND created_at <= ${endDate}
        ),
        user_activity AS (
          SELECT DISTINCT
            user_id,
            DATE_TRUNC('week', created_at)::date as activity_week
          FROM analytics_events
          WHERE user_id IS NOT NULL
        )
        SELECT
          TO_CHAR(uc.cohort_week, 'YYYY-MM-DD') as cohort,
          COUNT(DISTINCT uc.user_id) as period0,
          COUNT(DISTINCT CASE WHEN ua1.activity_week = uc.cohort_week + INTERVAL '1 week' THEN uc.user_id END) as period1,
          COUNT(DISTINCT CASE WHEN ua2.activity_week = uc.cohort_week + INTERVAL '2 weeks' THEN uc.user_id END) as period2,
          COUNT(DISTINCT CASE WHEN ua3.activity_week = uc.cohort_week + INTERVAL '3 weeks' THEN uc.user_id END) as period3,
          COUNT(DISTINCT CASE WHEN ua4.activity_week = uc.cohort_week + INTERVAL '4 weeks' THEN uc.user_id END) as period4,
          COUNT(DISTINCT CASE WHEN ua5.activity_week = uc.cohort_week + INTERVAL '5 weeks' THEN uc.user_id END) as period5,
          COUNT(DISTINCT CASE WHEN ua6.activity_week = uc.cohort_week + INTERVAL '6 weeks' THEN uc.user_id END) as period6,
          COUNT(DISTINCT CASE WHEN ua7.activity_week = uc.cohort_week + INTERVAL '7 weeks' THEN uc.user_id END) as period7
        FROM user_cohorts uc
        LEFT JOIN user_activity ua1 ON uc.user_id = ua1.user_id
        LEFT JOIN user_activity ua2 ON uc.user_id = ua2.user_id
        LEFT JOIN user_activity ua3 ON uc.user_id = ua3.user_id
        LEFT JOIN user_activity ua4 ON uc.user_id = ua4.user_id
        LEFT JOIN user_activity ua5 ON uc.user_id = ua5.user_id
        LEFT JOIN user_activity ua6 ON uc.user_id = ua6.user_id
        LEFT JOIN user_activity ua7 ON uc.user_id = ua7.user_id
        GROUP BY uc.cohort_week
        ORDER BY uc.cohort_week DESC
        LIMIT 12
      `;

      transaction.finish();
      return cohorts;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get cohort retention', { error, startDate, endDate });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get user onboarding funnel
   */
  async getUserOnboardingFunnel(startDate: Date, endDate: Date): Promise<FunnelStep[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AnalyticsRepository.getUserOnboardingFunnel',
    });

    try {
      const funnelData = await this.prisma.$queryRaw<Array<{ step: string; users: bigint }>>`
        SELECT 'Registration' as step, COUNT(DISTINCT id) as users
        FROM users
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}

        UNION ALL

        SELECT 'Email Verified' as step, COUNT(DISTINCT id) as users
        FROM users
        WHERE email_verified = true
        AND created_at >= ${startDate} AND created_at <= ${endDate}

        UNION ALL

        SELECT 'Profile Completed' as step, COUNT(DISTINCT up.user_id) as users
        FROM user_profiles up
        JOIN users u ON up.user_id = u.id
        WHERE u.created_at >= ${startDate} AND u.created_at <= ${endDate}
        AND up.bio IS NOT NULL

        UNION ALL

        SELECT 'First Article View' as step, COUNT(DISTINCT av.user_id) as users
        FROM article_views av
        JOIN users u ON av.user_id = u.id
        WHERE u.created_at >= ${startDate} AND u.created_at <= ${endDate}
        AND av.user_id IS NOT NULL

        UNION ALL

        SELECT 'First Topic Created' as step, COUNT(DISTINCT ft.user_id) as users
        FROM forum_topics ft
        JOIN users u ON ft.user_id = u.id
        WHERE u.created_at >= ${startDate} AND u.created_at <= ${endDate}

        ORDER BY
          CASE step
            WHEN 'Registration' THEN 1
            WHEN 'Email Verified' THEN 2
            WHEN 'Profile Completed' THEN 3
            WHEN 'First Article View' THEN 4
            WHEN 'First Topic Created' THEN 5
          END
      `;

      // Calculate conversion and dropoff rates
      let previousUsers = 0;
      const result: FunnelStep[] = funnelData.map((step, index) => {
        const users = Number(step.users);
        const conversionRate = index === 0 ? 100 : previousUsers > 0 ? (users / previousUsers) * 100 : 0;
        const dropoffRate = index === 0 ? 0 : previousUsers > 0 ? ((previousUsers - users) / previousUsers) * 100 : 0;

        previousUsers = users;

        return {
          step: step.step,
          users,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          dropoffRate: parseFloat(dropoffRate.toFixed(2)),
        };
      });

      transaction.finish();
      return result;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get user onboarding funnel', { error, startDate, endDate });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get job application funnel
   */
  async getJobApplicationFunnel(startDate: Date, endDate: Date): Promise<FunnelStep[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AnalyticsRepository.getJobApplicationFunnel',
    });

    try {
      const funnelData = await this.prisma.$queryRaw<Array<{ step: string; users: bigint }>>`
        SELECT 'Job View' as step, COUNT(DISTINCT ae.user_id) as users
        FROM analytics_events ae
        WHERE ae.event_type = 'job_view'
        AND ae.created_at >= ${startDate} AND ae.created_at <= ${endDate}
        AND ae.user_id IS NOT NULL

        UNION ALL

        SELECT 'Job Save' as step, COUNT(DISTINCT ae.user_id) as users
        FROM analytics_events ae
        WHERE ae.event_type = 'job_save'
        AND ae.created_at >= ${startDate} AND ae.created_at <= ${endDate}
        AND ae.user_id IS NOT NULL

        UNION ALL

        SELECT 'Application Started' as step, COUNT(DISTINCT ja.user_id) as users
        FROM job_applications ja
        WHERE ja.created_at >= ${startDate} AND ja.created_at <= ${endDate}

        UNION ALL

        SELECT 'Application Submitted' as step, COUNT(DISTINCT ja.user_id) as users
        FROM job_applications ja
        WHERE ja.status != 'draft'
        AND ja.created_at >= ${startDate} AND ja.created_at <= ${endDate}

        ORDER BY
          CASE step
            WHEN 'Job View' THEN 1
            WHEN 'Job Save' THEN 2
            WHEN 'Application Started' THEN 3
            WHEN 'Application Submitted' THEN 4
          END
      `;

      let previousUsers = 0;
      const result: FunnelStep[] = funnelData.map((step, index) => {
        const users = Number(step.users);
        const conversionRate = index === 0 ? 100 : previousUsers > 0 ? (users / previousUsers) * 100 : 0;
        const dropoffRate = index === 0 ? 0 : previousUsers > 0 ? ((previousUsers - users) / previousUsers) * 100 : 0;

        previousUsers = users;

        return {
          step: step.step,
          users,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          dropoffRate: parseFloat(dropoffRate.toFixed(2)),
        };
      });

      transaction.finish();
      return result;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get job application funnel', { error, startDate, endDate });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get aggregated metrics for time series data
   */
  async getAggregatedMetrics(
    startDate: Date,
    endDate: Date,
    granularity: 'daily' | 'weekly' | 'monthly'
  ): Promise<any[]> {
    const transaction = Sentry.startTransaction({
      op: 'db.query',
      name: 'AnalyticsRepository.getAggregatedMetrics',
    });

    try {
      let truncFunction = 'day';
      if (granularity === 'weekly') truncFunction = 'week';
      if (granularity === 'monthly') truncFunction = 'month';

      const metrics = await this.prisma.$queryRaw<any[]>`
        SELECT
          DATE_TRUNC(${truncFunction}, date)::date as period,
          SUM(new_users) as "newUsers",
          AVG(active_users) as "avgActiveUsers",
          SUM(new_articles) as "newArticles",
          SUM(new_topics) as "newTopics",
          SUM(new_replies) as "newReplies",
          SUM(page_views) as "pageViews",
          AVG(avg_session_time) as "avgSessionTime",
          AVG(bounce_rate) as "avgBounceRate"
        FROM platform_metrics
        WHERE date >= ${startDate}
        AND date <= ${endDate}
        GROUP BY period
        ORDER BY period ASC
      `;

      transaction.finish();
      return metrics;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get aggregated metrics', { error, startDate, endDate, granularity });
      Sentry.captureException(error);
      throw error;
    }
  }
}
