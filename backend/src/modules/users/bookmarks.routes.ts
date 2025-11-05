import { Router } from 'express';
import BookmarkController from '../news/bookmarks.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { authenticate } from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * User bookmark routes
 * All routes require authentication
 * Mounted at /api/v1/users/me
 */
const router = Router();

// Initialize controller
const bookmarkController = new BookmarkController();

// Apply authentication middleware to all routes
router.use(authenticate);

// ============================================================================
// USER BOOKMARK ROUTES
// ============================================================================

/**
 * GET /api/v1/users/me/bookmarks
 * List user's bookmarks
 * Query params: ?collectionId=uuid&page=1&limit=20&sortBy=createdAt&sortOrder=desc&search=query
 * Rate limit: 60 requests per 15 minutes
 */
router.get(
  '/bookmarks',
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 60 }),
  asyncHandler(bookmarkController.listUserBookmarks)
);

/**
 * PATCH /api/v1/users/me/bookmarks/:id
 * Update bookmark (collection or notes)
 * Rate limit: 30 requests per 15 minutes
 */
router.patch(
  '/bookmarks/:id',
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  asyncHandler(bookmarkController.updateBookmark)
);

// ============================================================================
// BOOKMARK COLLECTION ROUTES
// ============================================================================

/**
 * GET /api/v1/users/me/bookmark-collections
 * List user's bookmark collections
 * Rate limit: 60 requests per 15 minutes
 */
router.get(
  '/bookmark-collections',
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 60 }),
  asyncHandler(bookmarkController.listUserCollections)
);

/**
 * POST /api/v1/users/me/bookmark-collections
 * Create a bookmark collection
 * Rate limit: 20 requests per hour
 */
router.post(
  '/bookmark-collections',
  createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20 }),
  asyncHandler(bookmarkController.createBookmarkCollection)
);

/**
 * GET /api/v1/users/me/bookmark-collections/:id
 * Get collection by ID
 * Rate limit: 60 requests per 15 minutes
 */
router.get(
  '/bookmark-collections/:id',
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 60 }),
  asyncHandler(bookmarkController.getCollectionById)
);

/**
 * PATCH /api/v1/users/me/bookmark-collections/:id
 * Update bookmark collection
 * Rate limit: 30 requests per 15 minutes
 */
router.patch(
  '/bookmark-collections/:id',
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  asyncHandler(bookmarkController.updateBookmarkCollection)
);

/**
 * DELETE /api/v1/users/me/bookmark-collections/:id
 * Delete bookmark collection (cannot delete default "Read Later" collection)
 * Rate limit: 30 requests per 15 minutes
 */
router.delete(
  '/bookmark-collections/:id',
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  asyncHandler(bookmarkController.deleteBookmarkCollection)
);

export default router;
