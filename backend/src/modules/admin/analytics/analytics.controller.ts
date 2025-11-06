/**
 * Analytics Controller
 *
 * HTTP endpoints for admin analytics and reports
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AnalyticsService } from './analytics.service';
import { BaseController } from '@/utils/baseController';
import {
  analyticsQuerySchema,
  customAnalyticsQuerySchema,
  cohortAnalysisQuerySchema,
  funnelAnalysisQuerySchema,
  exportAnalyticsSchema,
  scheduleReportSchema,
  updateScheduledReportSchema,
  abTestQuerySchema,
  AnalyticsQuery,
  CustomAnalyticsQuery,
  CohortAnalysisQuery,
  FunnelAnalysisQuery,
  ExportAnalyticsInput,
  ScheduleReportInput,
  UpdateScheduledReportInput,
  ABTestQuery,
} from './analytics.validation';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';

export class AnalyticsController extends BaseController {
  constructor(private analyticsService: AnalyticsService) {
    super();
  }

  /**
   * GET /api/admin/analytics
   * Get comprehensive platform analytics
   */
  getAnalytics = this.asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      const query = analyticsQuerySchema.parse(req.query) as AnalyticsQuery;

      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      const analytics = await this.analyticsService.getComprehensiveAnalytics(
        query.period,
        query.metrics,
        startDate,
        endDate,
        query.limit
      );

      const executionTime = Date.now() - startTime;

      // Log performance warning if query took too long
      if (executionTime > 1000) {
        logger.warn('Analytics query exceeded 1s threshold', {
          executionTime,
          period: query.period,
          metrics: query.metrics,
        });
      }

      return this.success(res, {
        analytics,
        meta: {
          period: query.period,
          limit: query.limit,
          executionTime,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        adminId: req.user?.id,
        query: req.query,
      });

      logger.error('Get analytics failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to fetch analytics', 500);
    }
  });

  /**
   * GET /api/admin/analytics/custom
   * Get custom analytics with date range and metric selection
   */
  getCustomAnalytics = this.asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      const query = customAnalyticsQuerySchema.parse(req.query) as CustomAnalyticsQuery;

      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      const compareWith = query.compareWith
        ? {
            startDate: new Date(query.compareWith.startDate),
            endDate: new Date(query.compareWith.endDate),
          }
        : undefined;

      const result = await this.analyticsService.getCustomAnalytics(
        startDate,
        endDate,
        query.metrics,
        query.granularity,
        compareWith
      );

      const executionTime = Date.now() - startTime;

      if (executionTime > 1000) {
        logger.warn('Custom analytics query exceeded 1s threshold', {
          executionTime,
          metrics: query.metrics,
        });
      }

      return this.success(res, {
        ...result,
        meta: {
          startDate: query.startDate,
          endDate: query.endDate,
          granularity: query.granularity,
          executionTime,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        adminId: req.user?.id,
        query: req.query,
      });

      logger.error('Get custom analytics failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to fetch custom analytics', 500);
    }
  });

  /**
   * GET /api/admin/analytics/cohorts
   * Get cohort retention analysis
   */
  getCohortAnalysis = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = cohortAnalysisQuerySchema.parse(req.query) as CohortAnalysisQuery;

      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      const cohorts = await this.analyticsService.getCohortAnalysis(startDate, endDate);

      return this.success(res, {
        cohorts,
        meta: {
          cohortType: query.cohortType,
          period: query.period,
          startDate: query.startDate,
          endDate: query.endDate,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        adminId: req.user?.id,
        query: req.query,
      });

      logger.error('Get cohort analysis failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to fetch cohort analysis', 500);
    }
  });

  /**
   * GET /api/admin/analytics/funnels/:funnelType
   * Get funnel analysis
   */
  getFunnelAnalysis = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const funnelType = req.params.funnelType as 'user_onboarding' | 'job_application';

      if (!['user_onboarding', 'job_application'].includes(funnelType)) {
        return this.badRequest(res, 'Invalid funnel type. Must be user_onboarding or job_application');
      }

      const query = funnelAnalysisQuerySchema.parse(req.query) as FunnelAnalysisQuery;

      const endDate = query.endDate ? new Date(query.endDate) : new Date();
      const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const funnel = await this.analyticsService.getFunnelAnalysis(funnelType, startDate, endDate);

      return this.success(res, {
        funnelType,
        steps: funnel,
        meta: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: query.groupBy,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        adminId: req.user?.id,
        params: req.params,
        query: req.query,
      });

      logger.error('Get funnel analysis failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to fetch funnel analysis', 500);
    }
  });

  /**
   * GET /api/admin/analytics/ab-tests
   * Get A/B test results (placeholder)
   */
  getABTestResults = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = abTestQuerySchema.parse(req.query) as ABTestQuery;

      const results = await this.analyticsService.getABTestResults(query.testId, query.status);

      return this.success(res, {
        tests: results,
        meta: {
          count: results.length,
          limit: query.limit,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        adminId: req.user?.id,
        query: req.query,
      });

      logger.error('Get A/B test results failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to fetch A/B test results', 500);
    }
  });

  /**
   * POST /api/admin/analytics/export
   * Export analytics data
   */
  exportAnalytics = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const input = exportAnalyticsSchema.parse(req.body) as ExportAnalyticsInput;

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      if (input.format === 'csv') {
        // Get comprehensive analytics
        const analytics = await this.analyticsService.getComprehensiveAnalytics(
          'daily',
          input.metrics,
          startDate,
          endDate
        );

        // Flatten data for CSV
        const flatData: any[] = [];
        if (analytics.userGrowth) {
          analytics.userGrowth.forEach((item) => {
            flatData.push({
              date: item.date,
              totalUsers: item.totalUsers,
              newUsers: item.newUsers,
              activeUsers: item.activeUsers,
            });
          });
        }

        const csv = await this.analyticsService.exportToCSV(flatData, input.metrics);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.csv"`);
        return res.send(csv);
      } else if (input.format === 'pdf') {
        const analytics = await this.analyticsService.getComprehensiveAnalytics(
          'daily',
          input.metrics,
          startDate,
          endDate
        );

        const pdfBuffer = await this.analyticsService.exportToPDF(analytics, startDate, endDate, input.includeCharts);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.pdf"`);
        return res.send(pdfBuffer);
      } else if (input.format === 'excel') {
        return this.error(res, 'Excel export not yet implemented', 501);
      }

      return this.badRequest(res, 'Invalid export format');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        adminId: req.user?.id,
        body: req.body,
      });

      logger.error('Export analytics failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to export analytics', 500);
    }
  });

  /**
   * POST /api/admin/analytics/reports/schedule
   * Schedule a recurring report
   */
  scheduleReport = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const input = scheduleReportSchema.parse(req.body) as ScheduleReportInput;

      const result = await this.analyticsService.scheduleReport(
        input.frequency,
        input.recipients,
        input.metrics,
        input.format,
        input.enabled
      );

      logger.info('Report scheduled by admin', {
        adminId: req.user?.id,
        reportId: result.id,
        frequency: input.frequency,
      });

      return this.success(res, result, 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        adminId: req.user?.id,
        body: req.body,
      });

      logger.error('Schedule report failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to schedule report', 500);
    }
  });

  /**
   * GET /api/admin/analytics/reports
   * List scheduled reports
   */
  listScheduledReports = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Placeholder implementation
      logger.info('Listing scheduled reports', { adminId: req.user?.id });

      return this.success(res, {
        reports: [],
        message: 'Scheduled reports feature will be implemented in the database',
      });
    } catch (error) {
      this.captureException(error as Error, {
        adminId: req.user?.id,
      });

      logger.error('List scheduled reports failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to list scheduled reports', 500);
    }
  });

  /**
   * PATCH /api/admin/analytics/reports/:reportId
   * Update scheduled report
   */
  updateScheduledReport = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const reportId = req.params.reportId;
      const input = updateScheduledReportSchema.parse(req.body) as UpdateScheduledReportInput;

      logger.info('Updating scheduled report', {
        adminId: req.user?.id,
        reportId,
        updates: input,
      });

      return this.success(res, {
        message: 'Scheduled report updated successfully',
        reportId,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        adminId: req.user?.id,
        params: req.params,
        body: req.body,
      });

      logger.error('Update scheduled report failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to update scheduled report', 500);
    }
  });

  /**
   * DELETE /api/admin/analytics/reports/:reportId
   * Delete scheduled report
   */
  deleteScheduledReport = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const reportId = req.params.reportId;

      logger.info('Deleting scheduled report', {
        adminId: req.user?.id,
        reportId,
      });

      return this.success(res, {
        message: 'Scheduled report deleted successfully',
        reportId,
      });
    } catch (error) {
      this.captureException(error as Error, {
        adminId: req.user?.id,
        params: req.params,
      });

      logger.error('Delete scheduled report failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to delete scheduled report', 500);
    }
  });

  /**
   * POST /api/admin/analytics/cache/invalidate
   * Invalidate analytics cache
   */
  invalidateCache = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      await this.analyticsService.invalidateCache();

      logger.info('Analytics cache invalidated by admin', {
        adminId: req.user?.id,
      });

      return this.success(res, {
        message: 'Analytics cache invalidated successfully',
      });
    } catch (error) {
      this.captureException(error as Error, {
        adminId: req.user?.id,
      });

      logger.error('Invalidate cache failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to invalidate cache', 500);
    }
  });
}
