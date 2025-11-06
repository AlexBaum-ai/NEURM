import { Router } from 'express';
import { UseCaseController } from './useCase.controller';
import {
  authenticate,
  requireAdmin,
  requireAuth,
} from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * UseCase Routes
 * Defines all routes for use case API endpoints
 */

const router = Router();
const controller = new UseCaseController();

// Rate limiters
const publicReadLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later',
});

const submissionLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour
  message: 'Too many use case submissions, please try again later',
});

const adminWriteLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many requests, please try again later',
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/use-cases
 * @desc    List published use cases with filters and pagination
 * @access  Public
 * @query   category, industry, implementationType, companySize, featured, hasCode, hasRoiData, techStack, search, sort, page, limit
 */
router.get(
  '/',
  publicReadLimiter,
  controller.listUseCases
);

/**
 * @route   GET /api/v1/use-cases/featured
 * @desc    Get featured use cases
 * @access  Public
 * @query   limit (optional, default: 5, max: 20)
 */
router.get(
  '/featured',
  publicReadLimiter,
  controller.getFeaturedUseCases
);

/**
 * @route   GET /api/v1/use-cases/:slug
 * @desc    Get use case detail by slug (public)
 * @access  Public
 * @param   slug - Use case slug
 * @note    Automatically tracks view count
 */
router.get(
  '/:slug',
  publicReadLimiter,
  controller.getUseCaseBySlug
);

// ============================================================================
// AUTHENTICATED USER ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/use-cases/submit
 * @desc    Submit a new use case
 * @access  Authenticated users
 * @body    title, summary, content, techStack, category, industry, implementationType, companySize?, companyId?, modelIds?
 * @note    Use cases start in "pending" status and require admin approval
 */
router.post(
  '/submit',
  authenticate,
  requireAuth,
  submissionLimiter,
  controller.submitUseCase
);

/**
 * @route   GET /api/v1/use-cases/my-submissions
 * @desc    List current user's submitted use cases
 * @access  Authenticated users
 * @query   status, page, limit, sort
 */
router.get(
  '/my-submissions',
  authenticate,
  requireAuth,
  publicReadLimiter,
  controller.listMyUseCases
);

/**
 * @route   GET /api/v1/use-cases/id/:id
 * @desc    Get use case by ID (with permissions check)
 * @access  Authenticated users (author or admin only for non-published)
 * @param   id - Use case UUID
 */
router.get(
  '/id/:id',
  authenticate,
  requireAuth,
  publicReadLimiter,
  controller.getUseCaseById
);

/**
 * @route   PUT /api/v1/use-cases/:id
 * @desc    Update use case
 * @access  Author or admin
 * @param   id - Use case UUID
 * @body    title?, summary?, content?, techStack?, category?, industry?, implementationType?, etc.
 * @note    Authors can only update pending or rejected use cases
 */
router.put(
  '/:id',
  authenticate,
  requireAuth,
  adminWriteLimiter,
  controller.updateUseCase
);

/**
 * @route   DELETE /api/v1/use-cases/:id
 * @desc    Delete use case
 * @access  Author or admin
 * @param   id - Use case UUID
 */
router.delete(
  '/:id',
  authenticate,
  requireAuth,
  adminWriteLimiter,
  controller.deleteUseCase
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/admin/use-cases
 * @desc    List all use cases for admin review (all statuses)
 * @access  Admin
 * @query   status, category, industry, authorId, page, limit
 */
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  publicReadLimiter,
  controller.listAllUseCases
);

/**
 * @route   PUT /api/v1/admin/use-cases/:id/review
 * @desc    Review use case (approve, publish, or reject)
 * @access  Admin
 * @param   id - Use case UUID
 * @body    status (approved|published|rejected), rejectionReason?, featured?
 */
router.put(
  '/admin/:id/review',
  authenticate,
  requireAdmin,
  adminWriteLimiter,
  controller.reviewUseCase
);

export default router;
