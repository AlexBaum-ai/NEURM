/**
 * Analytics Service
 *
 * Business logic for platform analytics and reports
 */

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import * as Sentry from '@sentry/node';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import {
  AnalyticsRepository,
  UserGrowthData,
  EngagementData,
  ContentPerformanceData,
  RevenueData,
  TopContributor,
  TrafficSource,
  CohortData,
  FunnelStep,
} from './analytics.repository';
import logger from '@/utils/logger';

export interface ComprehensiveAnalytics {
  userGrowth?: UserGrowthData[];
  engagementTrends?: EngagementData[];
  contentPerformance?: ContentPerformanceData[];
  revenue?: RevenueData[];
  topContributors?: TopContributor[];
  trafficSources?: TrafficSource[];
  summary: {
    totalUsers: number;
    totalArticles: number;
    totalTopics: number;
    avgEngagement: number;
  };
  generatedAt: Date;
}

export interface CustomAnalyticsResult {
  data: any;
  comparison?: any;
  insights: string[];
}

export interface ABTestResult {
  testId: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  variants: Array<{
    name: string;
    users: number;
    conversions: number;
    conversionRate: number;
  }>;
  winner?: string;
  statisticalSignificance?: number;
}

export class AnalyticsService {
  private analyticsRepo: AnalyticsRepository;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'admin:analytics:';

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    this.analyticsRepo = new AnalyticsRepository(prisma);
  }

  /**
   * Get comprehensive platform analytics
   */
  async getComprehensiveAnalytics(
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    metrics?: string[],
    startDate?: Date,
    endDate?: Date,
    limit: number = 30
  ): Promise<ComprehensiveAnalytics> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'AnalyticsService.getComprehensiveAnalytics',
    });

    const startTime = Date.now();

    try {
      // Calculate date range
      const end = endDate || new Date();
      const start =
        startDate ||
        new Date(
          end.getTime() -
            (period === 'daily' ? limit : period === 'weekly' ? limit * 7 : limit * 30) * 24 * 60 * 60 * 1000
        );

      // Check cache
      const cacheKey = `${this.CACHE_PREFIX}comprehensive:${period}:${start.toISOString()}:${end.toISOString()}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        transaction.finish();
        logger.info('Analytics served from cache');
        return JSON.parse(cached);
      }

      // Determine which metrics to fetch
      const shouldFetchAll = !metrics || metrics.length === 0;
      const metricsSet = new Set(metrics);

      // Fetch metrics in parallel
      const promises: Promise<any>[] = [];

      if (shouldFetchAll || metricsSet.has('user_growth')) {
        promises.push(this.analyticsRepo.getUserGrowth(start, end));
      } else {
        promises.push(Promise.resolve(undefined));
      }

      if (shouldFetchAll || metricsSet.has('engagement_trends')) {
        promises.push(this.analyticsRepo.getEngagementTrends(start, end));
      } else {
        promises.push(Promise.resolve(undefined));
      }

      if (shouldFetchAll || metricsSet.has('content_performance')) {
        promises.push(this.analyticsRepo.getContentPerformance(start, end));
      } else {
        promises.push(Promise.resolve(undefined));
      }

      if (shouldFetchAll || metricsSet.has('revenue')) {
        promises.push(this.analyticsRepo.getRevenue(start, end));
      } else {
        promises.push(Promise.resolve(undefined));
      }

      if (shouldFetchAll || metricsSet.has('top_contributors')) {
        promises.push(this.analyticsRepo.getTopContributors(start, end, 10));
      } else {
        promises.push(Promise.resolve(undefined));
      }

      if (shouldFetchAll || metricsSet.has('traffic_sources')) {
        promises.push(this.analyticsRepo.getTrafficSources(start, end, 10));
      } else {
        promises.push(Promise.resolve(undefined));
      }

      const [userGrowth, engagementTrends, contentPerformance, revenue, topContributors, trafficSources] =
        await Promise.all(promises);

      // Calculate summary
      const latestMetrics = await this.prisma.platformMetrics.findFirst({
        orderBy: { date: 'desc' },
      });

      const summary = {
        totalUsers: latestMetrics?.totalUsers || 0,
        totalArticles: latestMetrics?.totalArticles || 0,
        totalTopics: latestMetrics?.totalTopics || 0,
        avgEngagement:
          engagementTrends && engagementTrends.length > 0
            ? engagementTrends.reduce((sum, e) => sum + (e.avgSessionTime || 0), 0) / engagementTrends.length
            : 0,
      };

      const result: ComprehensiveAnalytics = {
        userGrowth,
        engagementTrends,
        contentPerformance,
        revenue,
        topContributors,
        trafficSources,
        summary,
        generatedAt: new Date(),
      };

      // Cache result
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      const executionTime = Date.now() - startTime;
      logger.info('Comprehensive analytics generated', {
        executionTime,
        metricsCount: Object.keys(result).filter((k) => k !== 'generatedAt' && k !== 'summary').length,
      });

      transaction.finish();
      return result;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get comprehensive analytics', { error, period, metrics });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get custom analytics with date range and comparison
   */
  async getCustomAnalytics(
    startDate: Date,
    endDate: Date,
    metrics: string[],
    granularity: 'daily' | 'weekly' | 'monthly',
    compareWith?: { startDate: Date; endDate: Date }
  ): Promise<CustomAnalyticsResult> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'AnalyticsService.getCustomAnalytics',
    });

    try {
      // Get current period data
      const currentData = await this.analyticsRepo.getAggregatedMetrics(startDate, endDate, granularity);

      // Get comparison period data if provided
      let comparisonData;
      if (compareWith) {
        comparisonData = await this.analyticsRepo.getAggregatedMetrics(
          compareWith.startDate,
          compareWith.endDate,
          granularity
        );
      }

      // Generate insights
      const insights = this.generateInsights(currentData, comparisonData);

      transaction.finish();
      return {
        data: currentData,
        comparison: comparisonData,
        insights,
      };
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get custom analytics', { error, startDate, endDate, metrics });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get cohort retention analysis
   */
  async getCohortAnalysis(startDate: Date, endDate: Date): Promise<CohortData[]> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'AnalyticsService.getCohortAnalysis',
    });

    try {
      const cohorts = await this.analyticsRepo.getCohortRetention(startDate, endDate);
      transaction.finish();
      return cohorts;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get cohort analysis', { error, startDate, endDate });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get funnel analysis
   */
  async getFunnelAnalysis(funnelType: 'user_onboarding' | 'job_application', startDate: Date, endDate: Date): Promise<FunnelStep[]> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'AnalyticsService.getFunnelAnalysis',
    });

    try {
      let funnel: FunnelStep[];

      if (funnelType === 'user_onboarding') {
        funnel = await this.analyticsRepo.getUserOnboardingFunnel(startDate, endDate);
      } else if (funnelType === 'job_application') {
        funnel = await this.analyticsRepo.getJobApplicationFunnel(startDate, endDate);
      } else {
        throw new Error(`Unknown funnel type: ${funnelType}`);
      }

      transaction.finish();
      return funnel;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to get funnel analysis', { error, funnelType, startDate, endDate });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get A/B test results (placeholder for future implementation)
   */
  async getABTestResults(testId?: string, status?: string): Promise<ABTestResult[]> {
    // Placeholder implementation
    logger.info('A/B test results requested', { testId, status });

    return [
      {
        testId: 'test-001',
        name: 'Homepage CTA Test',
        status: 'active',
        variants: [
          { name: 'Control', users: 1000, conversions: 120, conversionRate: 12.0 },
          { name: 'Variant A', users: 1000, conversions: 145, conversionRate: 14.5 },
        ],
        statisticalSignificance: 0.95,
      },
    ];
  }

  /**
   * Export analytics to CSV
   */
  async exportToCSV(data: any[], metrics: string[]): Promise<string> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'AnalyticsService.exportToCSV',
    });

    try {
      const fields = ['date', ...metrics.map((m) => this.metricToFieldName(m))];
      const parser = new Parser({ fields });
      const csv = parser.parse(data);

      transaction.finish();
      logger.info('Analytics exported to CSV', { rowCount: data.length, metrics });
      return csv;
    } catch (error) {
      transaction.finish();
      logger.error('Failed to export analytics to CSV', { error, metrics });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Export analytics to PDF
   */
  async exportToPDF(
    analytics: ComprehensiveAnalytics,
    startDate: Date,
    endDate: Date,
    includeCharts: boolean = true
  ): Promise<Buffer> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'AnalyticsService.exportToPDF',
    });

    try {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          transaction.finish();
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', reject);

        // Header
        doc.fontSize(24).text('Platform Analytics Report', { align: 'center' });
        doc.moveDown();
        doc
          .fontSize(12)
          .text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, { align: 'center' });
        doc.text(`Generated: ${analytics.generatedAt.toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Summary Section
        doc.fontSize(18).text('Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Users: ${analytics.summary.totalUsers.toLocaleString()}`);
        doc.text(`Total Articles: ${analytics.summary.totalArticles.toLocaleString()}`);
        doc.text(`Total Topics: ${analytics.summary.totalTopics.toLocaleString()}`);
        doc.text(`Average Session Time: ${Math.round(analytics.summary.avgEngagement)}s`);
        doc.moveDown(2);

        // User Growth Section
        if (analytics.userGrowth && analytics.userGrowth.length > 0) {
          doc.fontSize(18).text('User Growth', { underline: true });
          doc.moveDown();
          doc.fontSize(12);

          const latestGrowth = analytics.userGrowth[analytics.userGrowth.length - 1];
          doc.text(`New Users: ${latestGrowth.newUsers.toLocaleString()}`);
          doc.text(`Active Users (DAU): ${latestGrowth.activeUsers.toLocaleString()}`);
          doc.text(`Weekly Active (WAU): ${latestGrowth.weeklyActive.toLocaleString()}`);
          doc.text(`Monthly Active (MAU): ${latestGrowth.monthlyActive.toLocaleString()}`);
          doc.moveDown(2);
        }

        // Top Contributors Section
        if (analytics.topContributors && analytics.topContributors.length > 0) {
          doc.fontSize(18).text('Top Contributors', { underline: true });
          doc.moveDown();
          doc.fontSize(10);

          analytics.topContributors.slice(0, 10).forEach((contributor, index) => {
            doc.text(
              `${index + 1}. ${contributor.username} - Score: ${contributor.contributionScore} ` +
                `(${contributor.articlesCount} articles, ${contributor.topicsCount} topics, ${contributor.repliesCount} replies)`
            );
          });
          doc.moveDown(2);
        }

        // Traffic Sources Section
        if (analytics.trafficSources && analytics.trafficSources.length > 0) {
          doc.fontSize(18).text('Traffic Sources', { underline: true });
          doc.moveDown();
          doc.fontSize(12);

          analytics.trafficSources.forEach((source) => {
            doc.text(`${source.source}: ${source.visits.toLocaleString()} visits (${source.percentage.toFixed(1)}%)`);
          });
          doc.moveDown(2);
        }

        // Footer
        doc.fontSize(10).text('Generated by Neurmatic Analytics Platform', {
          align: 'center',
        });

        doc.end();
        logger.info('Analytics exported to PDF');
      });
    } catch (error) {
      transaction.finish();
      logger.error('Failed to export analytics to PDF', { error });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Schedule a recurring report
   */
  async scheduleReport(
    frequency: 'daily' | 'weekly' | 'monthly',
    recipients: string[],
    metrics: string[],
    format: 'csv' | 'pdf',
    enabled: boolean = true
  ): Promise<{ id: string; message: string }> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'AnalyticsService.scheduleReport',
    });

    try {
      // In a real implementation, this would create a record in a ScheduledReports table
      // and configure a cron job or background task

      const reportId = `report-${Date.now()}`;

      logger.info('Report scheduled', {
        reportId,
        frequency,
        recipients,
        metrics,
        format,
        enabled,
      });

      // TODO: Store in database and configure scheduler
      // await this.prisma.scheduledReport.create({ ... });

      transaction.finish();
      return {
        id: reportId,
        message: `Report scheduled successfully. Will be sent ${frequency} to ${recipients.join(', ')}`,
      };
    } catch (error) {
      transaction.finish();
      logger.error('Failed to schedule report', { error, frequency, recipients });
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Generate insights from analytics data
   */
  private generateInsights(currentData: any[], comparisonData?: any[]): string[] {
    const insights: string[] = [];

    if (currentData.length === 0) {
      insights.push('No data available for the selected period');
      return insights;
    }

    // Calculate growth trends
    const latest = currentData[currentData.length - 1];
    const earliest = currentData[0];

    if (latest.newUsers > earliest.newUsers) {
      const growth = ((latest.newUsers - earliest.newUsers) / earliest.newUsers) * 100;
      insights.push(`User growth increased by ${growth.toFixed(1)}% during this period`);
    }

    // Compare with previous period
    if (comparisonData && comparisonData.length > 0) {
      const currentTotal = currentData.reduce((sum, d) => sum + (d.newUsers || 0), 0);
      const comparisonTotal = comparisonData.reduce((sum, d) => sum + (d.newUsers || 0), 0);

      if (currentTotal > comparisonTotal) {
        const increase = ((currentTotal - comparisonTotal) / comparisonTotal) * 100;
        insights.push(`New user acquisitions increased by ${increase.toFixed(1)}% compared to previous period`);
      } else if (currentTotal < comparisonTotal) {
        const decrease = ((comparisonTotal - currentTotal) / comparisonTotal) * 100;
        insights.push(`New user acquisitions decreased by ${decrease.toFixed(1)}% compared to previous period`);
      }
    }

    // Engagement insights
    if (latest.avgSessionTime) {
      if (latest.avgSessionTime > 180) {
        insights.push('Strong user engagement with average session time over 3 minutes');
      } else if (latest.avgSessionTime < 60) {
        insights.push('Low engagement detected - consider improving content quality or UX');
      }
    }

    // Bounce rate insights
    if (latest.avgBounceRate !== null && latest.avgBounceRate !== undefined) {
      if (latest.avgBounceRate > 70) {
        insights.push('High bounce rate detected - review landing pages and content relevance');
      } else if (latest.avgBounceRate < 40) {
        insights.push('Excellent bounce rate - users are engaging with multiple pages');
      }
    }

    return insights;
  }

  /**
   * Convert metric name to field name
   */
  private metricToFieldName(metric: string): string {
    const mapping: Record<string, string> = {
      user_growth: 'newUsers',
      engagement_trends: 'avgSessionTime',
      content_performance: 'newArticles',
      revenue: 'mrr',
    };
    return mapping[metric] || metric;
  }

  /**
   * Invalidate analytics cache
   */
  async invalidateCache(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info('Analytics cache invalidated', { keysDeleted: keys.length });
      }
    } catch (error) {
      logger.error('Failed to invalidate analytics cache', { error });
      Sentry.captureException(error);
    }
  }
}
