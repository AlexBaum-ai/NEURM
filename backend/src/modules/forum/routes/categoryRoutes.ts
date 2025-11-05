import { Router } from 'express';
import { container } from 'tsyringe';
import { ForumCategoryController } from '../controllers/ForumCategoryController';
import {
  authenticate,
  requireAdmin,
  requireModerator,
} from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * Forum Category Routes
 * Defines all routes for forum category API endpoints
 *
 * Public Routes:
 * - GET /api/forum/categories - Get category tree
 * - GET /api/forum/categories/:slug - Get category by slug
 * - GET /api/forum/categories/:id/moderators - Get category moderators
 *
 * Admin Routes:
 * - POST /api/forum/categories - Create category
 * - PUT /api/forum/categories/:id - Update category
 * - DELETE /api/forum/categories/:id - Delete category
 * - PUT /api/forum/categories/reorder - Reorder categories
 * - POST /api/forum/categories/:id/moderators - Assign moderator
 * - DELETE /api/forum/categories/:id/moderators/:userId - Remove moderator
 */

const router = Router();
const controller = container.resolve(ForumCategoryController);

// ============================================================================
// RATE LIMITERS
// ============================================================================

// Public read operations: 60 requests per minute
const publicReadLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Too many requests, please try again later',
});

// Admin write operations: 20 requests per minute
const adminWriteLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: 'Too many admin operations, please try again later',
});

// Category creation limiter: 10 creates per hour (prevent spam)
const categoryCreateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many categories created, please try again later',
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * @route   GET /api/forum/categories
 * @desc    Get all categories in hierarchical tree structure
 * @access  Public
 * @query   includeInactive - Include inactive categories (admin only)
 * @returns Hierarchical category tree with moderators and statistics
 * @example GET /api/forum/categories
 * @example GET /api/forum/categories?includeInactive=true
 */
router.get(
  '/',
  publicReadLimiter,
  controller.getCategoryTree
);

/**
 * @route   GET /api/forum/categories/:slug
 * @desc    Get category by slug with details
 * @access  Public
 * @param   slug - Category slug
 * @returns Category details including children, parent, moderators, and stats
 * @example GET /api/forum/categories/general-discussion
 */
router.get(
  '/:slug',
  publicReadLimiter,
  controller.getCategoryBySlug
);

/**
 * @route   GET /api/forum/categories/:id/moderators
 * @desc    Get all moderators for a category
 * @access  Public
 * @param   id - Category UUID
 * @returns List of moderators with user details
 * @example GET /api/forum/categories/123e4567-e89b-12d3-a456-426614174000/moderators
 */
router.get(
  '/:id/moderators',
  publicReadLimiter,
  controller.getCategoryModerators
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * @route   POST /api/forum/categories
 * @desc    Create new forum category
 * @access  Admin only
 * @body    CreateCategoryInput
 * @returns Created category
 * @example
 * POST /api/forum/categories
 * {
 *   "name": "General Discussion",
 *   "slug": "general-discussion",
 *   "description": "Discuss anything LLM-related",
 *   "icon": "💬",
 *   "guidelines": "Be respectful and on-topic",
 *   "visibility": "public",
 *   "displayOrder": 0
 * }
 */
router.post(
  '/',
  categoryCreateLimiter,
  authenticate,
  requireAdmin,
  controller.createCategory
);

/**
 * @route   PUT /api/forum/categories/:id
 * @desc    Update category
 * @access  Admin only
 * @param   id - Category UUID
 * @body    UpdateCategoryInput
 * @returns Updated category
 * @example
 * PUT /api/forum/categories/123e4567-e89b-12d3-a456-426614174000
 * {
 *   "name": "Updated Name",
 *   "description": "Updated description"
 * }
 */
router.put(
  '/:id',
  adminWriteLimiter,
  authenticate,
  requireAdmin,
  controller.updateCategory
);

/**
 * @route   DELETE /api/forum/categories/:id
 * @desc    Soft delete category (set isActive to false)
 * @access  Admin only
 * @param   id - Category UUID
 * @returns 204 No Content
 * @note    Cannot delete categories with topics or active subcategories
 * @example DELETE /api/forum/categories/123e4567-e89b-12d3-a456-426614174000
 */
router.delete(
  '/:id',
  adminWriteLimiter,
  authenticate,
  requireAdmin,
  controller.deleteCategory
);

/**
 * @route   PUT /api/forum/categories/reorder
 * @desc    Reorder categories (drag-drop support)
 * @access  Admin only
 * @body    ReorderCategoriesInput
 * @returns Success message
 * @example
 * PUT /api/forum/categories/reorder
 * {
 *   "categories": [
 *     { "id": "uuid-1", "displayOrder": 0 },
 *     { "id": "uuid-2", "displayOrder": 1 },
 *     { "id": "uuid-3", "displayOrder": 2 }
 *   ]
 * }
 */
router.put(
  '/reorder',
  adminWriteLimiter,
  authenticate,
  requireAdmin,
  controller.reorderCategories
);

/**
 * @route   POST /api/forum/categories/:id/moderators
 * @desc    Assign moderator to category
 * @access  Admin only
 * @param   id - Category UUID
 * @body    AssignModeratorInput { userId: string }
 * @returns Success message
 * @example
 * POST /api/forum/categories/123e4567-e89b-12d3-a456-426614174000/moderators
 * {
 *   "userId": "user-uuid"
 * }
 */
router.post(
  '/:id/moderators',
  adminWriteLimiter,
  authenticate,
  requireAdmin,
  controller.assignModerator
);

/**
 * @route   DELETE /api/forum/categories/:id/moderators/:userId
 * @desc    Remove moderator from category
 * @access  Admin only
 * @param   id - Category UUID
 * @param   userId - User UUID to remove as moderator
 * @returns 204 No Content
 * @example DELETE /api/forum/categories/category-uuid/moderators/user-uuid
 */
router.delete(
  '/:id/moderators/:userId',
  adminWriteLimiter,
  authenticate,
  requireAdmin,
  controller.removeModerator
);

export default router;
