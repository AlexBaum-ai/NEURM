import { Prisma, ApplicationStatus, ExperienceLevel } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { prisma } from '@/lib/prisma';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger';
import { NotFoundError, ForbiddenError } from '@/utils/errors';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

/**
 * Company Analytics Service
 * Handles computation, caching, and retrieval of analytics data for companies
 */
export class CompanyAnalyticsService {
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly CACHE_PREFIX = 'company_analytics';

  /**
   * Get company-wide analytics
   */
  async getCompanyAnalytics(
    companyId: string,
    userId: string,
    dateRange?: { from: Date; to: Date }
  ) {
    try {
      // Verify company exists and user has access
      await this.verifyCompanyAccess(companyId, userId);

      // Try to get from cache first
      const cacheKey = `${this.CACHE_PREFIX}:${companyId}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        logger.debug('Company analytics cache hit', { companyId });
        return JSON.parse(cached);
      }

      // Compute analytics
      const analytics = await this.computeCompanyAnalytics(companyId, dateRange);

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(analytics));

      logger.info('Company analytics computed', {
        companyId,
        dateRange,
      });

      return analytics;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }

      logger.error('Error getting company analytics', {
        companyId,
        userId,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'get_company_analytics' },
        extra: { companyId, userId },
      });

      throw new Error('Failed to retrieve company analytics');
    }
  }

  /**
   * Get job-specific analytics
   */
  async getJobAnalytics(
    jobId: string,
    companyId: string,
    userId: string,
    dateRange?: { from: Date; to: Date }
  ) {
    try {
      // Verify company exists and user has access
      await this.verifyCompanyAccess(companyId, userId);

      // Verify job belongs to company
      const job = await prisma.job.findFirst({
        where: { id: jobId, companyId },
      });

      if (!job) {
        throw new NotFoundError('Job not found or does not belong to this company');
      }

      // Try to get from cache first
      const cacheKey = `${this.CACHE_PREFIX}:job:${jobId}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        logger.debug('Job analytics cache hit', { jobId });
        return JSON.parse(cached);
      }

      // Compute analytics
      const analytics = await this.computeJobAnalytics(jobId, companyId, dateRange);

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(analytics));

      logger.info('Job analytics computed', {
        jobId,
        companyId,
        dateRange,
      });

      return analytics;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }

      logger.error('Error getting job analytics', {
        jobId,
        companyId,
        userId,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'get_job_analytics' },
        extra: { jobId, companyId, userId },
      });

      throw new Error('Failed to retrieve job analytics');
    }
  }

  /**
   * Compute company-wide analytics
   */
  private async computeCompanyAnalytics(
    companyId: string,
    dateRange?: { from: Date; to: Date }
  ) {
    const where: Prisma.JobWhereInput = { companyId };

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }

    // Get all jobs for the company
    const jobs = await prisma.job.findMany({
      where,
      include: {
        applications: {
          include: {
            statusHistory: true,
            user: {
              include: {
                reputation: true,
                userModels: true,
              },
            },
          },
        },
        matches: true,
      },
    });

    const totalJobs = jobs.length;
    const totalApplications = jobs.reduce(
      (sum, job) => sum + job.applications.length,
      0
    );
    const totalViews = jobs.reduce((sum, job) => sum + job.viewCount, 0);
    const conversionRate =
      totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;

    // Calculate average match score
    const allMatches = jobs.flatMap((job) => job.matches);
    const avgMatchScore =
      allMatches.length > 0
        ? allMatches.reduce((sum, match) => sum + Number(match.matchScore), 0) /
          allMatches.length
        : 0;

    // Calculate applicant quality score
    const qualityScore = await this.calculateApplicantQualityScore(
      jobs.flatMap((job) => job.applications)
    );

    // Calculate time to hire
    const timeToHire = await this.calculateAverageTimeToHire(jobs);

    // Get top performing jobs
    const topPerformingJobs = jobs
      .map((job) => ({
        id: job.id,
        title: job.title,
        applicationCount: job.applications.length,
        viewCount: job.viewCount,
        conversionRate:
          job.viewCount > 0
            ? (job.applications.length / job.viewCount) * 100
            : 0,
        qualityScore: this.calculateJobQualityScore(job.applications),
      }))
      .sort((a, b) => b.applicationCount - a.applicationCount)
      .slice(0, 10);

    // Get time series data
    const timeSeriesData = await this.getTimeSeriesData(companyId, dateRange);

    // Get demographics
    const demographics = this.calculateDemographics(
      jobs.flatMap((job) => job.applications)
    );

    // Get top traffic sources
    const topTrafficSources = this.getTopTrafficSources(
      jobs.flatMap((job) => job.applications)
    );

    return {
      overview: {
        totalJobs,
        totalApplications,
        totalViews,
        conversionRate: Number(conversionRate.toFixed(2)),
        avgMatchScore: Number(avgMatchScore.toFixed(2)),
        applicantQualityScore: Number(qualityScore.toFixed(2)),
        avgTimeToHire: timeToHire,
      },
      topPerformingJobs,
      timeSeriesData,
      demographics,
      topTrafficSources,
    };
  }

  /**
   * Compute job-specific analytics
   */
  private async computeJobAnalytics(
    jobId: string,
    companyId: string,
    dateRange?: { from: Date; to: Date }
  ) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: dateRange
            ? {
                appliedAt: {
                  gte: dateRange.from,
                  lte: dateRange.to,
                },
              }
            : undefined,
          include: {
            statusHistory: true,
            user: {
              include: {
                reputation: true,
                userModels: true,
              },
            },
          },
        },
        matches: {
          where: dateRange
            ? {
                createdAt: {
                  gte: dateRange.from,
                  lte: dateRange.to,
                },
              }
            : undefined,
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const totalApplications = job.applications.length;
    const totalViews = job.viewCount;
    const conversionRate =
      totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;

    // Calculate average match score
    const avgMatchScore =
      job.matches.length > 0
        ? job.matches.reduce((sum, match) => sum + Number(match.matchScore), 0) /
          job.matches.length
        : 0;

    // Calculate applicant quality score
    const qualityScore = await this.calculateApplicantQualityScore(
      job.applications
    );

    // Calculate time to hire for this job
    const timeToHire = await this.calculateJobTimeToHire(jobId);

    // Get funnel visualization data
    const funnelData = this.calculateFunnelData(job.applications);

    // Get time series data
    const timeSeriesData = await this.getJobTimeSeriesData(jobId, dateRange);

    // Get demographics
    const demographics = this.calculateDemographics(job.applications);

    // Get top traffic sources
    const topTrafficSources = this.getTopTrafficSources(job.applications);

    // Get company average for comparison
    const companyAverage = await this.getCompanyAverageMetrics(companyId);

    return {
      overview: {
        totalApplications,
        totalViews,
        conversionRate: Number(conversionRate.toFixed(2)),
        avgMatchScore: Number(avgMatchScore.toFixed(2)),
        applicantQualityScore: Number(qualityScore.toFixed(2)),
        timeToHire,
      },
      funnelData,
      timeSeriesData,
      demographics,
      topTrafficSources,
      comparison: {
        companyAverage,
        difference: {
          conversionRate: Number(
            (conversionRate - companyAverage.conversionRate).toFixed(2)
          ),
          qualityScore: Number(
            (qualityScore - companyAverage.qualityScore).toFixed(2)
          ),
        },
      },
    };
  }

  /**
   * Calculate applicant quality score
   * Formula: avg_match_score * 0.5 + avg_experience_match * 0.3 + forum_reputation * 0.2
   */
  private async calculateApplicantQualityScore(
    applications: any[]
  ): Promise<number> {
    if (applications.length === 0) return 0;

    const scores = applications.map((app) => {
      const matchScore = app.user?.userModels?.length || 0;
      const experienceMatch = 75; // Placeholder - would need job requirements comparison
      const forumReputation = app.user?.reputation?.totalReputation || 0;

      return (
        matchScore * 0.5 +
        experienceMatch * 0.3 +
        Math.min(forumReputation / 10, 100) * 0.2
      );
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Calculate job quality score for a single job
   */
  private calculateJobQualityScore(applications: any[]): number {
    if (applications.length === 0) return 0;

    const avgReputation =
      applications.reduce(
        (sum, app) => sum + (app.user?.reputation?.totalReputation || 0),
        0
      ) / applications.length;

    return Math.min(avgReputation / 10, 100);
  }

  /**
   * Calculate average time to hire across all jobs
   */
  private async calculateAverageTimeToHire(jobs: any[]): Promise<number | null> {
    const hireTimes = await Promise.all(
      jobs.map(async (job) => {
        const hiredApplication = await prisma.jobApplication.findFirst({
          where: {
            jobId: job.id,
            status: ApplicationStatus.offer,
          },
          orderBy: { appliedAt: 'asc' },
        });

        if (hiredApplication) {
          const daysDiff = Math.floor(
            (new Date(hiredApplication.updatedAt).getTime() -
              new Date(hiredApplication.appliedAt).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return daysDiff;
        }
        return null;
      })
    );

    const validHireTimes = hireTimes.filter((time) => time !== null) as number[];

    if (validHireTimes.length === 0) return null;

    return Math.round(
      validHireTimes.reduce((sum, time) => sum + time, 0) / validHireTimes.length
    );
  }

  /**
   * Calculate time to hire for a specific job
   */
  private async calculateJobTimeToHire(jobId: string): Promise<number | null> {
    const hiredApplication = await prisma.jobApplication.findFirst({
      where: {
        jobId,
        status: ApplicationStatus.offer,
      },
      orderBy: { appliedAt: 'asc' },
    });

    if (!hiredApplication) return null;

    return Math.floor(
      (new Date(hiredApplication.updatedAt).getTime() -
        new Date(hiredApplication.appliedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  /**
   * Calculate funnel visualization data
   */
  private calculateFunnelData(applications: any[]) {
    const total = applications.length;

    const statusCounts = {
      viewed: total,
      applied: applications.filter((app) => app.status !== undefined).length,
      screening: applications.filter(
        (app) => app.status === ApplicationStatus.screening
      ).length,
      interview: applications.filter(
        (app) => app.status === ApplicationStatus.interview
      ).length,
      offer: applications.filter((app) => app.status === ApplicationStatus.offer)
        .length,
      rejected: applications.filter(
        (app) => app.status === ApplicationStatus.rejected
      ).length,
    };

    return {
      stages: [
        { stage: 'viewed', count: statusCounts.viewed, percentage: 100 },
        {
          stage: 'applied',
          count: statusCounts.applied,
          percentage: total > 0 ? (statusCounts.applied / total) * 100 : 0,
        },
        {
          stage: 'screening',
          count: statusCounts.screening,
          percentage: total > 0 ? (statusCounts.screening / total) * 100 : 0,
        },
        {
          stage: 'interview',
          count: statusCounts.interview,
          percentage: total > 0 ? (statusCounts.interview / total) * 100 : 0,
        },
        {
          stage: 'offer',
          count: statusCounts.offer,
          percentage: total > 0 ? (statusCounts.offer / total) * 100 : 0,
        },
      ],
      rejectionRate:
        total > 0 ? Number(((statusCounts.rejected / total) * 100).toFixed(2)) : 0,
    };
  }

  /**
   * Get time series data for company
   */
  private async getTimeSeriesData(
    companyId: string,
    dateRange?: { from: Date; to: Date }
  ) {
    const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.to || new Date();

    const analytics = await prisma.jobAnalytics.groupBy({
      by: ['date'],
      where: {
        job: { companyId },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalApplications: true,
        totalViews: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return analytics.map((item) => ({
      date: item.date,
      applications: item._sum.totalApplications || 0,
      views: item._sum.totalViews || 0,
    }));
  }

  /**
   * Get time series data for specific job
   */
  private async getJobTimeSeriesData(
    jobId: string,
    dateRange?: { from: Date; to: Date }
  ) {
    const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.to || new Date();

    const analytics = await prisma.jobAnalytics.findMany({
      where: {
        jobId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return analytics.map((item) => ({
      date: item.date,
      applications: item.totalApplications,
      views: item.totalViews,
      conversionRate: Number(item.conversionRate),
    }));
  }

  /**
   * Calculate demographics from applications
   */
  private calculateDemographics(applications: any[]) {
    if (applications.length === 0) {
      return {
        experienceLevel: [],
        location: [],
        modelsExpertise: [],
      };
    }

    // Experience level distribution (would need to extract from user profiles)
    const experienceLevels = new Map<string, number>();
    applications.forEach((app) => {
      const level = 'mid'; // Placeholder - would extract from user profile
      experienceLevels.set(level, (experienceLevels.get(level) || 0) + 1);
    });

    // Location distribution
    const locations = new Map<string, number>();
    applications.forEach((app) => {
      const location = app.user?.profile?.location || 'Unknown';
      locations.set(location, (locations.get(location) || 0) + 1);
    });

    // Models expertise
    const modelsExpertise = new Map<string, number>();
    applications.forEach((app) => {
      app.user?.userModels?.forEach((userModel: any) => {
        const modelName = userModel.model?.name || 'Unknown';
        modelsExpertise.set(modelName, (modelsExpertise.get(modelName) || 0) + 1);
      });
    });

    return {
      experienceLevel: Array.from(experienceLevels.entries()).map(([level, count]) => ({
        level,
        count,
        percentage: Number(((count / applications.length) * 100).toFixed(2)),
      })),
      location: Array.from(locations.entries())
        .map(([location, count]) => ({
          location,
          count,
          percentage: Number(((count / applications.length) * 100).toFixed(2)),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      modelsExpertise: Array.from(modelsExpertise.entries())
        .map(([model, count]) => ({
          model,
          count,
          percentage: Number(((count / applications.length) * 100).toFixed(2)),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }

  /**
   * Get top traffic sources
   */
  private getTopTrafficSources(applications: any[]) {
    const sources = new Map<string, number>();

    applications.forEach((app) => {
      const source = app.source || 'direct';
      sources.set(source, (sources.get(source) || 0) + 1);
    });

    return Array.from(sources.entries())
      .map(([source, count]) => ({
        source,
        count,
        percentage: Number(((count / applications.length) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Get company average metrics for comparison
   */
  private async getCompanyAverageMetrics(companyId: string) {
    const jobs = await prisma.job.findMany({
      where: { companyId },
      include: {
        applications: true,
      },
    });

    const totalApplications = jobs.reduce(
      (sum, job) => sum + job.applications.length,
      0
    );
    const totalViews = jobs.reduce((sum, job) => sum + job.viewCount, 0);
    const conversionRate =
      totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;

    const qualityScore = await this.calculateApplicantQualityScore(
      jobs.flatMap((job) => job.applications)
    );

    return {
      conversionRate: Number(conversionRate.toFixed(2)),
      qualityScore: Number(qualityScore.toFixed(2)),
    };
  }

  /**
   * Verify company access
   */
  private async verifyCompanyAccess(
    companyId: string,
    userId: string
  ): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    if (company.ownerUserId !== userId) {
      throw new ForbiddenError(
        'You do not have permission to view this company analytics'
      );
    }
  }

  /**
   * Export analytics to CSV
   */
  async exportAnalyticsCSV(
    companyId: string,
    userId: string,
    type: 'company' | 'job',
    jobId?: string
  ): Promise<string> {
    try {
      await this.verifyCompanyAccess(companyId, userId);

      let data: any;
      if (type === 'company') {
        data = await this.computeCompanyAnalytics(companyId);
      } else if (jobId) {
        data = await this.computeJobAnalytics(jobId, companyId);
      } else {
        throw new Error('Job ID required for job analytics export');
      }

      // Flatten data for CSV export
      const flattenedData = this.flattenAnalyticsData(data);

      const parser = new Parser();
      const csv = parser.parse(flattenedData);

      logger.info('Analytics exported to CSV', {
        companyId,
        type,
        jobId,
      });

      return csv;
    } catch (error) {
      logger.error('Error exporting analytics to CSV', {
        companyId,
        type,
        jobId,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'export_analytics_csv' },
        extra: { companyId, type, jobId },
      });

      throw new Error('Failed to export analytics to CSV');
    }
  }

  /**
   * Export analytics to PDF
   */
  async exportAnalyticsPDF(
    companyId: string,
    userId: string,
    type: 'company' | 'job',
    jobId?: string
  ): Promise<Buffer> {
    try {
      await this.verifyCompanyAccess(companyId, userId);

      let data: any;
      if (type === 'company') {
        data = await this.computeCompanyAnalytics(companyId);
      } else if (jobId) {
        data = await this.computeJobAnalytics(jobId, companyId);
      } else {
        throw new Error('Job ID required for job analytics export');
      }

      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));

      // Add content to PDF
      doc.fontSize(20).text('Company Analytics Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Add overview section
      doc.fontSize(16).text('Overview');
      doc.fontSize(10);
      Object.entries(data.overview).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`);
      });

      doc.end();

      return new Promise((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
      });
    } catch (error) {
      logger.error('Error exporting analytics to PDF', {
        companyId,
        type,
        jobId,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'export_analytics_pdf' },
        extra: { companyId, type, jobId },
      });

      throw new Error('Failed to export analytics to PDF');
    }
  }

  /**
   * Flatten analytics data for CSV export
   */
  private flattenAnalyticsData(data: any): any[] {
    const flattened: any[] = [];

    // Add overview data
    if (data.overview) {
      flattened.push({
        section: 'Overview',
        ...data.overview,
      });
    }

    // Add top performing jobs
    if (data.topPerformingJobs) {
      data.topPerformingJobs.forEach((job: any) => {
        flattened.push({
          section: 'Top Performing Jobs',
          ...job,
        });
      });
    }

    return flattened;
  }

  /**
   * Invalidate analytics cache
   */
  async invalidateCache(companyId: string, jobId?: string): Promise<void> {
    try {
      const keys = [`${this.CACHE_PREFIX}:${companyId}`];

      if (jobId) {
        keys.push(`${this.CACHE_PREFIX}:job:${jobId}`);
      }

      await Promise.all(keys.map((key) => redis.del(key)));

      logger.info('Analytics cache invalidated', { companyId, jobId });
    } catch (error) {
      logger.error('Error invalidating analytics cache', {
        companyId,
        jobId,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'invalidate_analytics_cache' },
        extra: { companyId, jobId },
      });
    }
  }
}

export default new CompanyAnalyticsService();
