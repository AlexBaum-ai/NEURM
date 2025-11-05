import { Router } from 'express';
import CategoryController from './categories.controller';
import TagController from './tags.controller';
import bookmarkRoutes from './bookmarks.routes';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * News routes
 * Handles categories, tags, and bookmarks endpoints
 */
const router = Router();

// Initialize controllers
const categoryController = new CategoryController();
const tagController = new TagController();

// ============================================================================
// BOOKMARK ROUTES (Article-specific bookmarking)
// ============================================================================
// Mount bookmark routes (they have their own auth middleware)
// These handle routes like /api/v1/news/articles/:slug/bookmark
router.use('/', bookmarkRoutes);

// ============================================================================
// CATEGORY ROUTES
// ============================================================================

/**
 * GET /api/v1/news/categories
 * Get all categories as hierarchical tree
 * Query params: ?includeInactive=true (default: false)
 */
router.get('/categories', asyncHandler(categoryController.getAllCategories));

/**
 * GET /api/v1/news/categories/with-counts
 * Get all categories with article counts (flat list)
 */
router.get('/categories/with-counts', asyncHandler(categoryController.getCategoriesWithCounts));

/**
 * GET /api/v1/news/categories/:slug
 * Get category by slug with hierarchy and children
 */
router.get('/categories/:slug', asyncHandler(categoryController.getCategoryBySlug));

// ============================================================================
// TAG ROUTES
// ============================================================================

/**
 * GET /api/v1/news/tags
 * Get all tags with usage counts
 * Query params:
 * - search: search query (optional)
 * - limit: number of results (default: 50, max: 100)
 * - sortBy: name | usageCount | createdAt (default: usageCount)
 * - sortOrder: asc | desc (default: desc)
 */
router.get('/tags', asyncHandler(tagController.getAllTags));

/**
 * GET /api/v1/news/tags/search
 * Search tags for autocomplete (limit 10)
 * Query param: ?query=text
 */
router.get('/tags/search', asyncHandler(tagController.searchTags));

/**
 * GET /api/v1/news/tags/popular
 * Get popular tags by usage count
 * Query param: ?limit=20 (default: 20, max: 100)
 */
router.get('/tags/popular', asyncHandler(tagController.getPopularTags));

/**
 * GET /api/v1/news/tags/:slug
 * Get tag by slug with usage count
 */
router.get('/tags/:slug', asyncHandler(tagController.getTagBySlug));

export default router;
