import { Router } from 'express';
import ArticleController from './articles.controller';
import articleRevisionRoutes from './articleRevisions.routes';
import {
  authenticate,
  optionalAuth,
  requireAdmin,
} from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';
import { trackArticleAnalytics } from '@/middleware/analytics.middleware';

/**
 * Article Routes
 * Defines all routes for article API endpoints
 */

const router = Router();
const controller = new ArticleController();

// Mount revision routes
router.use('/', articleRevisionRoutes);

// Rate limiters
const publicReadLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later',
});

const adminWriteLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many requests, please try again later',
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/news/articles
 * @desc    List published articles with filters and pagination
 * @access  Public
 * @query   page, limit, categoryId, tagId, authorId, difficultyLevel, isFeatured, isTrending, search, sortBy, sortOrder
 */
router.get(
  '/',
  publicReadLimiter,
  controller.listArticles
);

/**
 * @route   GET /api/v1/news/articles/:slug
 * @desc    Get article detail by slug (public)
 * @access  Public (optional auth for bookmark status)
 * @param   slug - Article slug
 * @note    Automatically tracks article views (with IP deduplication)
 */
router.get(
  '/:slug',
  publicReadLimiter,
  optionalAuth,
  trackArticleAnalytics,
  controller.getArticleBySlug
);

/**
 * @route   GET /api/v1/news/articles/:id/related
 * @desc    Get related articles using advanced scoring algorithm
 * @access  Public
 * @param   id - Article UUID
 * @returns Min 3, max 6 related articles
 * @cache   1 hour TTL
 * @performance <200ms target response time
 */
router.get(
  '/:id/related',
  publicReadLimiter,
  controller.getRelatedArticles
);

// ============================================================================
// AUTHENTICATED USER ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/news/articles/:slug/bookmark
 * @desc    Toggle bookmark for an article
 * @access  Private (requires authentication)
 * @param   slug - Article slug
 */
router.post(
  '/:slug/bookmark',
  publicReadLimiter,
  authenticate,
  controller.toggleBookmark
);

/**
 * @route   DELETE /api/v1/news/articles/:slug/bookmark
 * @desc    Remove bookmark from an article
 * @access  Private (requires authentication)
 * @param   slug - Article slug
 */
router.delete(
  '/:slug/bookmark',
  publicReadLimiter,
  authenticate,
  controller.removeBookmark
);

/**
 * @route   POST /api/v1/news/articles/:slug/view
 * @desc    Track article view (deduplicated by user/IP within 1 hour)
 * @access  Public (optional authentication)
 * @param   slug - Article slug
 */
router.post(
  '/:slug/view',
  publicReadLimiter,
  optionalAuth,
  controller.trackView
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/admin/articles
 * @desc    Create a new article
 * @access  Admin only
 * @body    CreateArticleInput
 */
router.post(
  '/admin',
  adminWriteLimiter,
  authenticate,
  requireAdmin,
  controller.createArticle
);

/**
 * @route   GET /api/v1/admin/articles/:id
 * @desc    Get article by ID (includes all statuses)
 * @access  Admin only
 * @param   id - Article UUID
 */
router.get(
  '/admin/:id',
  publicReadLimiter,
  authenticate,
  requireAdmin,
  controller.getArticleById
);

/**
 * @route   PATCH /api/v1/admin/articles/:id
 * @desc    Update article
 * @access  Admin only
 * @param   id - Article UUID
 * @body    UpdateArticleInput
 */
router.patch(
  '/admin/:id',
  adminWriteLimiter,
  authenticate,
  requireAdmin,
  controller.updateArticle
);

/**
 * @route   DELETE /api/v1/admin/articles/:id
 * @desc    Delete article
 * @access  Admin only
 * @param   id - Article UUID
 */
router.delete(
  '/admin/:id',
  adminWriteLimiter,
  authenticate,
  requireAdmin,
  controller.deleteArticle
);

/**
 * @route   GET /api/v1/admin/articles/scheduled
 * @desc    List upcoming scheduled articles
 * @access  Admin only
 * @query   page, limit, sortBy, sortOrder
 */
router.get(
  '/admin/scheduled',
  publicReadLimiter,
  authenticate,
  requireAdmin,
  controller.listScheduledArticles
);

/**
 * @route   POST /api/v1/admin/articles/:id/schedule
 * @desc    Schedule article for publishing
 * @access  Admin only
 * @param   id - Article UUID
 * @body    ScheduleArticleInput { scheduledAt: ISO 8601 datetime }
 */
router.post(
  '/admin/:id/schedule',
  adminWriteLimiter,
  authenticate,
  requireAdmin,
  controller.scheduleArticle
);

/**
 * @route   DELETE /api/v1/admin/articles/:id/schedule
 * @desc    Cancel scheduled publishing
 * @access  Admin only
 * @param   id - Article UUID
 */
router.delete(
  '/admin/:id/schedule',
  adminWriteLimiter,
  authenticate,
  requireAdmin,
  controller.cancelSchedule
);

export default router;
