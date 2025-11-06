/**
 * Dashboard Controller
 *
 * Handles HTTP requests for personalized dashboard
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { DashboardService } from './dashboard.service';
import { BaseController } from '../../utils/baseController';
import {
  getDashboardQuerySchema,
  updateDashboardConfigSchema,
  GetDashboardQuery,
  UpdateDashboardConfigInput,
} from './dashboard.validation';
import * as Sentry from '@sentry/node';
import logger from '../../utils/logger';

export class DashboardController extends BaseController {
  constructor(private dashboardService: DashboardService) {
    super();
  }

  /**
   * GET /api/dashboard
   * Get personalized dashboard data
   */
  getDashboard = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const query = getDashboardQuerySchema.parse(req.query);

      const userId = req.user!.id;

      // Get dashboard data
      const dashboard = await this.dashboardService.getDashboard({
        userId,
        includeWidgets: query.widgets,
        limit: query.limit || 10,
      });

      return this.success(res, dashboard);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        userId: req.user?.id,
        query: req.query,
      });

      logger.error('Get dashboard failed', {
        error,
        userId: req.user?.id,
      });

      return this.error(res, 'Failed to fetch dashboard data', 500);
    }
  });

  /**
   * PUT /api/dashboard/config
   * Update dashboard configuration
   */
  updateDashboardConfig = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate request body
      const input = updateDashboardConfigSchema.parse(req.body);

      const userId = req.user!.id;

      // Update configuration
      const config = await this.dashboardService.updateConfig(userId, input);

      return this.success(res, {
        message: 'Dashboard configuration updated successfully',
        config,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        userId: req.user?.id,
        body: req.body,
      });

      logger.error('Update dashboard config failed', {
        error,
        userId: req.user?.id,
      });

      return this.error(res, 'Failed to update dashboard configuration', 500);
    }
  });

  /**
   * GET /api/dashboard/config
   * Get current dashboard configuration
   */
  getDashboardConfig = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      // This is fetched as part of getDashboard, but we can provide a dedicated endpoint
      const dashboard = await this.dashboardService.getDashboard({
        userId,
        includeWidgets: [], // Don't fetch widget data, just config
        limit: 0,
      });

      return this.success(res, {
        config: dashboard.config,
      });
    } catch (error) {
      this.captureException(error as Error, {
        userId: req.user?.id,
      });

      logger.error('Get dashboard config failed', {
        error,
        userId: req.user?.id,
      });

      return this.error(res, 'Failed to fetch dashboard configuration', 500);
    }
  });
}
