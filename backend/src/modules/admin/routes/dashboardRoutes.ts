/**
 * Admin Dashboard Routes
 *
 * Route definitions for admin dashboard endpoints
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();

// Initialize dependencies
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize service and controller
const adminService = new AdminService(prisma, redis);
const adminController = new AdminController(adminService);

// Apply authentication and admin role middleware to all admin routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard overview
 * @access  Admin only
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @route   POST /api/admin/dashboard/export
 * @desc    Export dashboard metrics (CSV or PDF)
 * @access  Admin only
 */
router.post('/dashboard/export', adminController.exportDashboard);

/**
 * @route   POST /api/admin/dashboard/refresh
 * @desc    Force refresh dashboard cache
 * @access  Admin only
 */
router.post('/dashboard/refresh', adminController.refreshDashboard);

/**
 * @route   GET /api/admin/dashboard/metrics
 * @desc    Get historical metrics for custom date range
 * @access  Admin only
 */
router.get('/dashboard/metrics', adminController.getMetrics);

/**
 * @route   POST /api/admin/dashboard/precompute
 * @desc    Manually trigger daily metrics precomputation
 * @access  Admin only
 */
router.post('/dashboard/precompute', adminController.precomputeMetrics);

/**
 * @route   GET /api/admin/dashboard/health
 * @desc    Get system health check
 * @access  Admin only
 */
router.get('/dashboard/health', adminController.getHealth);

export default router;
