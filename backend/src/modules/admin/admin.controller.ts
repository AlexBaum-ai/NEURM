/**
 * Admin Dashboard Controller
 *
 * Handles HTTP requests for admin dashboard
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AdminService } from './admin.service';
import { BaseController } from '../../utils/baseController';
import {
  dashboardQuerySchema,
  exportFormatSchema,
  metricsDateRangeSchema,
  DashboardQuery,
  ExportFormatInput,
  MetricsDateRange,
} from './admin.validation';
import * as Sentry from '@sentry/node';
import logger from '../../utils/logger';

export class AdminController extends BaseController {
  constructor(private adminService: AdminService) {
    super();
  }

  /**
   * GET /api/admin/dashboard
   * Get admin dashboard overview with all metrics
   */
  getDashboard = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const query = dashboardQuerySchema.parse(req.query) as DashboardQuery;

      const forceRefresh = query.refresh === 'true';

      // Get dashboard data
      const dashboard = await this.adminService.getDashboardData(forceRefresh);

      return this.success(res, {
        dashboard,
        cached: !forceRefresh,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        adminId: req.user?.id,
        query: req.query,
      });

      logger.error('Get admin dashboard failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to fetch admin dashboard', 500);
    }
  });

  /**
   * POST /api/admin/dashboard/export
   * Export dashboard metrics
   */
  exportDashboard = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate request body
      const input = exportFormatSchema.parse(req.body) as ExportFormatInput;

      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      if (input.format === 'csv') {
        // Export as CSV
        const csv = await this.adminService.exportToCSV(startDate, endDate);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="admin-metrics.csv"');
        return res.send(csv);
      } else if (input.format === 'pdf') {
        // TODO: Implement PDF export
        return this.error(res, 'PDF export not yet implemented', 501);
      }

      return this.error(res, 'Invalid export format', 400);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        adminId: req.user?.id,
        body: req.body,
      });

      logger.error('Export dashboard failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to export dashboard', 500);
    }
  });

  /**
   * POST /api/admin/dashboard/refresh
   * Force refresh dashboard cache
   */
  refreshDashboard = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Invalidate cache
      await this.adminService.invalidateCache();

      // Get fresh data
      const dashboard = await this.adminService.getDashboardData(true);

      logger.info('Admin dashboard cache refreshed', {
        adminId: req.user?.id,
      });

      return this.success(res, {
        message: 'Dashboard refreshed successfully',
        dashboard,
      });
    } catch (error) {
      this.captureException(error as Error, {
        adminId: req.user?.id,
      });

      logger.error('Refresh dashboard failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to refresh dashboard', 500);
    }
  });

  /**
   * GET /api/admin/dashboard/metrics
   * Get historical metrics for custom date range
   */
  getMetrics = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const query = metricsDateRangeSchema.parse(req.query) as MetricsDateRange;

      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      // TODO: Implement historical metrics retrieval
      // This would fetch PlatformMetrics records for the date range
      // and return aggregated data

      return this.success(res, {
        message: 'Historical metrics endpoint',
        startDate,
        endDate,
        granularity: query.granularity,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        adminId: req.user?.id,
        query: req.query,
      });

      logger.error('Get metrics failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to fetch metrics', 500);
    }
  });

  /**
   * POST /api/admin/dashboard/precompute
   * Manually trigger daily metrics precomputation (admin only)
   */
  precomputeMetrics = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = req.body.date ? new Date(req.body.date) : new Date();

      logger.info('Manual metrics precomputation triggered', {
        adminId: req.user?.id,
        date,
      });

      // Run precomputation
      await this.adminService.precomputeDailyMetrics(date);

      return this.success(res, {
        message: 'Metrics precomputation completed successfully',
        date,
      });
    } catch (error) {
      this.captureException(error as Error, {
        adminId: req.user?.id,
        body: req.body,
      });

      logger.error('Precompute metrics failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to precompute metrics', 500);
    }
  });

  /**
   * GET /api/admin/dashboard/health
   * Get system health check
   */
  getHealth = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get fresh dashboard data (includes system health)
      const dashboard = await this.adminService.getDashboardData(true);

      return this.success(res, {
        health: dashboard.systemHealth,
        timestamp: new Date(),
      });
    } catch (error) {
      this.captureException(error as Error, {
        adminId: req.user?.id,
      });

      logger.error('Get health check failed', {
        error,
        adminId: req.user?.id,
      });

      return this.error(res, 'Failed to get system health', 500);
    }
  });
}
