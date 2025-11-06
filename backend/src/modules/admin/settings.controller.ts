/**
 * Settings Controller
 *
 * Handles HTTP requests for platform settings management
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { SettingsService } from './settings.service';
import { BaseController } from '@/utils/baseController';
import {
  updateSettingSchema,
  bulkUpdateSettingsSchema,
  getSettingsQuerySchema,
  deleteSettingSchema,
  maintenanceModeSchema,
  UpdateSettingInput,
  BulkUpdateSettingsInput,
  GetSettingsQuery,
  MaintenanceModeInput,
} from './settings.validation';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import { SettingCategory } from '@prisma/client';

export class SettingsController extends BaseController {
  constructor(private settingsService: SettingsService) {
    super();
  }

  /**
   * GET /api/admin/settings
   * Get all platform settings
   */
  getAllSettings = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const query = getSettingsQuerySchema.parse(req.query);

      const settings = await this.settingsService.getAllSettings(
        query.includeEncrypted || false
      );

      return this.success(res, {
        settings,
        count: settings.length,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        userId: req.user?.id,
        query: req.query,
      });

      logger.error('Get all settings failed', {
        error,
        userId: req.user?.id,
      });

      return this.error(res, 'Failed to fetch settings', 500);
    }
  });

  /**
   * GET /api/admin/settings/category/:category
   * Get settings by category
   */
  getSettingsByCategory = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const category = req.params.category as SettingCategory;
      const query = getSettingsQuerySchema.parse(req.query);

      const settings = await this.settingsService.getSettingsByCategory(
        category,
        query.includeEncrypted || false
      );

      return this.success(res, {
        category,
        settings,
        count: settings.length,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        userId: req.user?.id,
        category: req.params.category,
      });

      logger.error('Get settings by category failed', {
        error,
        userId: req.user?.id,
        category: req.params.category,
      });

      return this.error(res, 'Failed to fetch settings', 500);
    }
  });

  /**
   * GET /api/admin/settings/:key
   * Get a single setting by key
   */
  getSetting = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const query = getSettingsQuerySchema.parse(req.query);

      const setting = await this.settingsService.getSetting(
        key,
        query.includeEncrypted || false
      );

      if (!setting) {
        return this.notFound(res, `Setting with key '${key}' not found`);
      }

      return this.success(res, { setting });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        userId: req.user?.id,
        key: req.params.key,
      });

      logger.error('Get setting failed', {
        error,
        userId: req.user?.id,
        key: req.params.key,
      });

      return this.error(res, 'Failed to fetch setting', 500);
    }
  });

  /**
   * PUT /api/admin/settings
   * Update or create a setting
   */
  updateSetting = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate request body
      const input = updateSettingSchema.parse(req.body) as UpdateSettingInput;

      const adminId = req.user!.id;
      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      };

      const updated = await this.settingsService.updateSetting(
        adminId,
        input,
        metadata
      );

      logger.info('Setting updated', {
        key: input.key,
        adminId,
      });

      return this.success(res, {
        message: 'Setting updated successfully',
        setting: updated,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        userId: req.user?.id,
        body: req.body,
      });

      logger.error('Update setting failed', {
        error,
        userId: req.user?.id,
      });

      return this.error(res, 'Failed to update setting', 500);
    }
  });

  /**
   * PUT /api/admin/settings/bulk
   * Bulk update settings
   */
  bulkUpdateSettings = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate request body
      const input = bulkUpdateSettingsSchema.parse(req.body) as BulkUpdateSettingsInput;

      const adminId = req.user!.id;
      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      };

      const updated = await this.settingsService.bulkUpdateSettings(
        adminId,
        input,
        metadata
      );

      logger.info('Bulk settings update completed', {
        count: updated.length,
        adminId,
      });

      return this.success(res, {
        message: 'Settings updated successfully',
        settings: updated,
        count: updated.length,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        userId: req.user?.id,
        body: req.body,
      });

      logger.error('Bulk update settings failed', {
        error,
        userId: req.user?.id,
      });

      return this.error(res, 'Failed to update settings', 500);
    }
  });

  /**
   * DELETE /api/admin/settings/:key
   * Delete a setting
   */
  deleteSetting = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { reason } = req.body;

      const adminId = req.user!.id;
      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      };

      await this.settingsService.deleteSetting(adminId, key, reason, metadata);

      logger.info('Setting deleted', {
        key,
        adminId,
      });

      return this.success(res, {
        message: 'Setting deleted successfully',
      });
    } catch (error) {
      this.captureException(error as Error, {
        userId: req.user?.id,
        key: req.params.key,
      });

      logger.error('Delete setting failed', {
        error,
        userId: req.user?.id,
        key: req.params.key,
      });

      return this.error(res, 'Failed to delete setting', 500);
    }
  });

  /**
   * GET /api/admin/settings/audit/:key
   * Get audit logs for a setting
   */
  getAuditLogs = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const logs = await this.settingsService.getAuditLogs(key, limit);

      return this.success(res, {
        key,
        logs,
        count: logs.length,
      });
    } catch (error) {
      this.captureException(error as Error, {
        userId: req.user?.id,
        key: req.params.key,
      });

      logger.error('Get audit logs failed', {
        error,
        userId: req.user?.id,
        key: req.params.key,
      });

      return this.error(res, 'Failed to fetch audit logs', 500);
    }
  });

  /**
   * GET /api/admin/settings/audit
   * Get all audit logs with pagination
   */
  getAllAuditLogs = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const adminId = req.query.adminId as string | undefined;

      const result = await this.settingsService.getAllAuditLogs({
        page,
        limit,
        adminId,
      });

      return this.success(res, {
        logs: result.logs,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      this.captureException(error as Error, {
        userId: req.user?.id,
        query: req.query,
      });

      logger.error('Get all audit logs failed', {
        error,
        userId: req.user?.id,
      });

      return this.error(res, 'Failed to fetch audit logs', 500);
    }
  });

  /**
   * GET /api/settings/public
   * Get public settings (no authentication required)
   */
  getPublicSettings = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const settings = await this.settingsService.getPublicSettings();

      return this.success(res, { settings });
    } catch (error) {
      this.captureException(error as Error);

      logger.error('Get public settings failed', { error });

      return this.error(res, 'Failed to fetch public settings', 500);
    }
  });

  /**
   * GET /api/settings/maintenance
   * Get maintenance mode status (no authentication required)
   */
  getMaintenanceMode = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const maintenanceMode = await this.settingsService.getMaintenanceMode();

      return this.success(res, maintenanceMode);
    } catch (error) {
      this.captureException(error as Error);

      logger.error('Get maintenance mode failed', { error });

      return this.error(res, 'Failed to fetch maintenance mode', 500);
    }
  });

  /**
   * PUT /api/admin/settings/maintenance
   * Set maintenance mode
   */
  setMaintenanceMode = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate request body
      const input = maintenanceModeSchema.parse(req.body) as MaintenanceModeInput;

      const adminId = req.user!.id;
      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      };

      const maintenanceMode = await this.settingsService.setMaintenanceMode(
        adminId,
        input,
        metadata
      );

      logger.info('Maintenance mode updated', {
        enabled: input.enabled,
        adminId,
      });

      return this.success(res, {
        message: 'Maintenance mode updated successfully',
        maintenanceMode,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        userId: req.user?.id,
        body: req.body,
      });

      logger.error('Set maintenance mode failed', {
        error,
        userId: req.user?.id,
      });

      return this.error(res, 'Failed to update maintenance mode', 500);
    }
  });
}
