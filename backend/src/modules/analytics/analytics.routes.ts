import { Router } from 'express';
import AnalyticsController from './analytics.controller';
import { optionalAuth } from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * Analytics Routes
 *
 * Provides endpoints for client-side analytics tracking
 */

const router = Router();
const controller = new AnalyticsController();

// Rate limiter for analytics endpoints
const analyticsLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Too many analytics requests, please try again later',
});

// ============================================================================
// PUBLIC ANALYTICS ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/analytics/articles/:articleId/read
 * @desc    Track article read completion
 * @access  Public (optional auth)
 * @body    { readTimeSeconds: number, scrollDepth: number }
 */
router.post(
  '/articles/:articleId/read',
  analyticsLimiter,
  optionalAuth,
  controller.trackArticleRead
);

/**
 * @route   POST /api/v1/analytics/articles/:articleId/share
 * @desc    Track article share
 * @access  Public (optional auth)
 * @body    { platform: string }
 */
router.post(
  '/articles/:articleId/share',
  analyticsLimiter,
  optionalAuth,
  controller.trackArticleShare
);

/**
 * @route   GET /api/v1/analytics/articles/:articleId/has-viewed
 * @desc    Check if current IP has recently viewed article
 * @access  Public
 * @note    For testing/debugging purposes
 */
router.get(
  '/articles/:articleId/has-viewed',
  analyticsLimiter,
  controller.hasRecentView
);

export default router;
