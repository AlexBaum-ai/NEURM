import { Router } from 'express';
import ArticleController from './articles.controller';
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

export default router;
