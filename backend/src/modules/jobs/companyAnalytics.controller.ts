import { Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import companyAnalyticsService, {
  CompanyAnalyticsService,
} from './services/companyAnalyticsService';
import { AuthRequest } from '@/middleware/auth.middleware';
import { logger } from '@/utils/logger';

export class CompanyAnalyticsController {
  private service: CompanyAnalyticsService;

  constructor(service: CompanyAnalyticsService) {
    this.service = service;
  }

  /**
   * GET /api/v1/companies/:companyId/analytics
   * Get company-wide analytics
   */
  getCompanyAnalytics = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { companyId } = req.params;
      const userId = req.user!.userId;
      const { from, to } = req.query;

      let dateRange: { from: Date; to: Date } | undefined;
      if (from && to) {
        dateRange = {
          from: new Date(from as string),
          to: new Date(to as string),
        };
      }

      const analytics = await this.service.getCompanyAnalytics(
        companyId,
        userId,
        dateRange
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'get_company_analytics' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * GET /api/v1/companies/:companyId/analytics/jobs/:jobId
   * Get job-specific analytics
   */
  getJobAnalytics = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { companyId, jobId } = req.params;
      const userId = req.user!.userId;
      const { from, to } = req.query;

      let dateRange: { from: Date; to: Date } | undefined;
      if (from && to) {
        dateRange = {
          from: new Date(from as string),
          to: new Date(to as string),
        };
      }

      const analytics = await this.service.getJobAnalytics(
        jobId,
        companyId,
        userId,
        dateRange
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'get_job_analytics' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * GET /api/v1/companies/:companyId/analytics/export/csv
   * Export company analytics to CSV
   */
  exportAnalyticsCSV = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { companyId } = req.params;
      const userId = req.user!.userId;
      const { type, jobId } = req.query;

      const csv = await this.service.exportAnalyticsCSV(
        companyId,
        userId,
        (type as 'company' | 'job') || 'company',
        jobId as string | undefined
      );

      logger.info('Analytics exported to CSV', {
        companyId,
        userId,
        type,
        jobId,
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=analytics-${companyId}-${Date.now()}.csv`
      );
      res.status(200).send(csv);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'export_analytics_csv' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };

  /**
   * GET /api/v1/companies/:companyId/analytics/export/pdf
   * Export company analytics to PDF
   */
  exportAnalyticsPDF = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { companyId } = req.params;
      const userId = req.user!.userId;
      const { type, jobId } = req.query;

      const pdf = await this.service.exportAnalyticsPDF(
        companyId,
        userId,
        (type as 'company' | 'job') || 'company',
        jobId as string | undefined
      );

      logger.info('Analytics exported to PDF', {
        companyId,
        userId,
        type,
        jobId,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=analytics-${companyId}-${Date.now()}.pdf`
      );
      res.status(200).send(pdf);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { endpoint: 'export_analytics_pdf' },
        user: req.user ? { id: req.user.userId } : undefined,
      });
      next(error);
    }
  };
}

export default new CompanyAnalyticsController(companyAnalyticsService);
