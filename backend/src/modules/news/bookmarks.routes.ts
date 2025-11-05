import { Router } from 'express';
import BookmarkController from './bookmarks.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { authenticate } from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * Bookmark routes
 * All bookmark endpoints require authentication
 */
const router = Router();

// Initialize controller
const bookmarkController = new BookmarkController();

// ============================================================================
// BOOKMARK ROUTES (Article-specific)
// ============================================================================
// NOTE: All bookmark routes require authentication
// Auth middleware is applied per-route to avoid affecting other news routes

/**
 * POST /api/v1/news/articles/:slug/bookmark
 * Create a bookmark for an article
 * Rate limit: 30 requests per 15 minutes
 */
router.post(
  '/articles/:slug/bookmark',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  asyncHandler(bookmarkController.createBookmark)
);

/**
 * DELETE /api/v1/news/articles/:slug/bookmark
 * Remove a bookmark
 * Rate limit: 60 requests per 15 minutes
 */
router.delete(
  '/articles/:slug/bookmark',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 60 }),
  asyncHandler(bookmarkController.deleteBookmark)
);

export default router;
