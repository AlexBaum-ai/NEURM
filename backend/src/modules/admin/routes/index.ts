import { Router } from 'express';
import contentModerationRoutes from './contentModerationRoutes';
import dashboardRoutes from './dashboardRoutes';
import analyticsRoutes from '../analytics/analytics.routes';

/**
 * Admin Module Routes
 *
 * Consolidates all admin-related routes:
 * - /api/admin/dashboard - Admin dashboard with metrics and analytics
 * - /api/admin/content - Content moderation
 * - /api/admin/analytics - Advanced analytics and reports
 * - /api/admin/users - User management
 * - Future: /api/admin/settings - Platform settings
 */

const router = Router();

// Admin dashboard routes
router.use('', dashboardRoutes);

// Content moderation routes
router.use('/content', contentModerationRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

export default router;
