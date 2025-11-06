/**
 * Settings Routes
 *
 * Defines routes for platform settings management
 */

import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { authenticate, requireAdmin } from '@/middleware/auth.middleware';
import { redisClient } from '@/config/redisClient';
import prisma from '@/config/database';

const router = Router();

// Initialize service and controller
const settingsService = new SettingsService(prisma, redisClient.getClient());
const settingsController = new SettingsController(settingsService);

/**
 * Public endpoints (no authentication required)
 */

/**
 * @route   GET /api/settings/public
 * @desc    Get public platform settings
 * @access  Public
 */
router.get('/public', settingsController.getPublicSettings);

/**
 * @route   GET /api/settings/maintenance
 * @desc    Get maintenance mode status
 * @access  Public
 */
router.get('/maintenance', settingsController.getMaintenanceMode);

/**
 * Admin-only endpoints (require authentication + admin role)
 */

/**
 * @route   GET /api/admin/settings
 * @desc    Get all platform settings
 * @access  Private (Admin only)
 * @query   category - Filter by category (optional)
 * @query   includeEncrypted - Include decrypted values for encrypted settings (optional)
 */
router.get(
  '/admin/settings',
  authenticate,
  requireAdmin,
  settingsController.getAllSettings
);

/**
 * @route   GET /api/admin/settings/category/:category
 * @desc    Get settings by category
 * @access  Private (Admin only)
 * @param   category - Setting category
 * @query   includeEncrypted - Include decrypted values for encrypted settings (optional)
 */
router.get(
  '/admin/settings/category/:category',
  authenticate,
  requireAdmin,
  settingsController.getSettingsByCategory
);

/**
 * @route   GET /api/admin/settings/audit
 * @desc    Get all audit logs with pagination
 * @access  Private (Admin only)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 50)
 * @query   adminId - Filter by admin user ID (optional)
 */
router.get(
  '/admin/settings/audit',
  authenticate,
  requireAdmin,
  settingsController.getAllAuditLogs
);

/**
 * @route   GET /api/admin/settings/audit/:key
 * @desc    Get audit logs for a specific setting
 * @access  Private (Admin only)
 * @param   key - Setting key
 * @query   limit - Number of logs to return (default: 50)
 */
router.get(
  '/admin/settings/audit/:key',
  authenticate,
  requireAdmin,
  settingsController.getAuditLogs
);

/**
 * @route   GET /api/admin/settings/:key
 * @desc    Get a single setting by key
 * @access  Private (Admin only)
 * @param   key - Setting key
 * @query   includeEncrypted - Include decrypted value for encrypted setting (optional)
 */
router.get(
  '/admin/settings/:key',
  authenticate,
  requireAdmin,
  settingsController.getSetting
);

/**
 * @route   PUT /api/admin/settings
 * @desc    Update or create a setting
 * @access  Private (Admin only)
 * @body    { key, value, category, type, description, isPublic, reason }
 */
router.put(
  '/admin/settings',
  authenticate,
  requireAdmin,
  settingsController.updateSetting
);

/**
 * @route   PUT /api/admin/settings/bulk
 * @desc    Bulk update settings
 * @access  Private (Admin only)
 * @body    { settings: [{ key, value, category, type, ... }], reason }
 */
router.put(
  '/admin/settings/bulk',
  authenticate,
  requireAdmin,
  settingsController.bulkUpdateSettings
);

/**
 * @route   PUT /api/admin/settings/maintenance
 * @desc    Set maintenance mode
 * @access  Private (Admin only)
 * @body    { enabled, message, reason }
 */
router.put(
  '/admin/settings/maintenance',
  authenticate,
  requireAdmin,
  settingsController.setMaintenanceMode
);

/**
 * @route   DELETE /api/admin/settings/:key
 * @desc    Delete a setting
 * @access  Private (Admin only)
 * @param   key - Setting key
 * @body    { reason } - Reason for deletion (optional)
 */
router.delete(
  '/admin/settings/:key',
  authenticate,
  requireAdmin,
  settingsController.deleteSetting
);

export default router;
