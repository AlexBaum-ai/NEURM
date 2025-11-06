/**
 * Analytics Routes
 *
 * Route definitions for admin analytics endpoints
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { authenticate, requireAdmin } from '@/middleware/auth.middleware';
import unifiedConfig from '@/config/unifiedConfig';

const router = Router();

// Initialize dependencies
const prisma = new PrismaClient();
const redis = new Redis(unifiedConfig.redis.url);

// Initialize service and controller
const analyticsService = new AnalyticsService(prisma, redis);
const analyticsController = new AnalyticsController(analyticsService);

// Apply authentication and admin role middleware to all analytics routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get comprehensive platform analytics
 * @access  Admin only
 * @query   period, metrics, startDate, endDate, limit
 */
router.get('/', analyticsController.getAnalytics);

/**
 * @route   GET /api/admin/analytics/custom
 * @desc    Get custom analytics with date range and metric selection
 * @access  Admin only
 * @query   startDate, endDate, metrics, granularity, compareWith
 */
router.get('/custom', analyticsController.getCustomAnalytics);

/**
 * @route   GET /api/admin/analytics/cohorts
 * @desc    Get cohort retention analysis
 * @access  Admin only
 * @query   startDate, endDate, cohortType, period
 */
router.get('/cohorts', analyticsController.getCohortAnalysis);

/**
 * @route   GET /api/admin/analytics/funnels/:funnelType
 * @desc    Get funnel analysis (user_onboarding or job_application)
 * @access  Admin only
 * @params  funnelType
 * @query   startDate, endDate, groupBy
 */
router.get('/funnels/:funnelType', analyticsController.getFunnelAnalysis);

/**
 * @route   GET /api/admin/analytics/ab-tests
 * @desc    Get A/B test results (placeholder for future)
 * @access  Admin only
 * @query   testId, status, limit
 */
router.get('/ab-tests', analyticsController.getABTestResults);

/**
 * @route   POST /api/admin/analytics/export
 * @desc    Export analytics data (CSV, Excel, PDF)
 * @access  Admin only
 * @body    format, metrics, startDate, endDate, includeCharts
 */
router.post('/export', analyticsController.exportAnalytics);

/**
 * @route   GET /api/admin/analytics/reports
 * @desc    List scheduled reports
 * @access  Admin only
 */
router.get('/reports', analyticsController.listScheduledReports);

/**
 * @route   POST /api/admin/analytics/reports/schedule
 * @desc    Schedule a recurring report
 * @access  Admin only
 * @body    frequency, recipients, metrics, format, enabled
 */
router.post('/reports/schedule', analyticsController.scheduleReport);

/**
 * @route   PATCH /api/admin/analytics/reports/:reportId
 * @desc    Update scheduled report
 * @access  Admin only
 * @params  reportId
 * @body    frequency, recipients, metrics, format, enabled (all optional)
 */
router.patch('/reports/:reportId', analyticsController.updateScheduledReport);

/**
 * @route   DELETE /api/admin/analytics/reports/:reportId
 * @desc    Delete scheduled report
 * @access  Admin only
 * @params  reportId
 */
router.delete('/reports/:reportId', analyticsController.deleteScheduledReport);

/**
 * @route   POST /api/admin/analytics/cache/invalidate
 * @desc    Invalidate analytics cache
 * @access  Admin only
 */
router.post('/cache/invalidate', analyticsController.invalidateCache);

export default router;
