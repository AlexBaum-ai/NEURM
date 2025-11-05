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
 * @route   GET /api/v1/analytics/articles/popular
 * @desc    Get popular articles based on view count
 * @access  Public
 * @query   { limit?: number, days?: number }
 * @note    Must be defined before /:articleId route
 */
router.get(
  '/articles/popular',
  analyticsLimiter,
  controller.getPopularArticles
);

/**
 * @route   GET /api/v1/analytics/articles/trending
 * @desc    Get trending articles using weighted scoring algorithm
 * @access  Public
 * @query   { limit?: number }
 * @note    Must be defined before /:articleId route
 */
router.get(
  '/articles/trending',
  analyticsLimiter,
  controller.getTrendingArticles
);

/**
 * @route   POST /api/v1/analytics/articles/:articleId/view
 * @desc    Track article view with engagement metrics
 * @access  Public (optional auth)
 * @body    { timeOnPage?: number, scrollDepth?: number }
 */
router.post(
  '/articles/:articleId/view',
  analyticsLimiter,
  optionalAuth,
  controller.trackArticleView
);

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
 * @route   GET /api/v1/analytics/articles/:articleId
 * @desc    Get article analytics (views, engagement, bounce rate)
 * @access  Public
 * @query   { days?: number }
 */
router.get(
  '/articles/:articleId',
  analyticsLimiter,
  controller.getArticleAnalytics
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
