import { Router } from 'express';
import modelController from './models.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/asyncHandler.middleware';

const router = Router();

/**
 * Public routes
 */

// GET /api/v1/models - Get all models
router.get('/', asyncHandler(modelController.getAllModels));

// GET /api/v1/models/popular - Get popular models
router.get('/popular', asyncHandler(modelController.getPopularModels));

// GET /api/v1/models/:slug - Get model details
router.get('/:slug', asyncHandler(modelController.getModelBySlug));

// GET /api/v1/models/:slug/news - Get related articles
router.get('/:slug/news', asyncHandler(modelController.getModelNews));

// GET /api/v1/models/:slug/discussions - Get related forum discussions
router.get('/:slug/discussions', asyncHandler(modelController.getModelDiscussions));

// GET /api/v1/models/:slug/jobs - Get related jobs
router.get('/:slug/jobs', asyncHandler(modelController.getModelJobs));

/**
 * Protected routes (require authentication)
 */

// POST /api/v1/models/:slug/follow - Follow/unfollow model (toggle)
router.post(
  '/:slug/follow',
  authenticate,
  asyncHandler(modelController.followModel)
);

// GET /api/v1/models/:slug/follow-status - Check follow status
router.get(
  '/:slug/follow-status',
  authenticate,
  asyncHandler(modelController.getFollowStatus)
);

export default router;
