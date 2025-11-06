/**
 * Dashboard Routes
 *
 * Defines routes for personalized dashboard
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { redisClient } from '../../config/redisClient';
import prisma from '../../config/database';

const router = Router();

// Initialize service and controller
const dashboardService = new DashboardService(prisma, redisClient);
const dashboardController = new DashboardController(dashboardService);

/**
 * @route   GET /api/dashboard
 * @desc    Get personalized dashboard data
 * @access  Private
 * @query   widgets - Comma-separated list of widget IDs to include (optional)
 * @query   limit - Number of items per widget (optional, default: 10, max: 50)
 */
router.get('/', authMiddleware, dashboardController.getDashboard);

/**
 * @route   GET /api/dashboard/config
 * @desc    Get current dashboard configuration
 * @access  Private
 */
router.get('/config', authMiddleware, dashboardController.getDashboardConfig);

/**
 * @route   PUT /api/dashboard/config
 * @desc    Update dashboard configuration
 * @access  Private
 * @body    { widgets: WidgetConfig[] }
 */
router.put('/config', authMiddleware, dashboardController.updateDashboardConfig);

export default router;
