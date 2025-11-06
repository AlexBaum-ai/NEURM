import { Router } from 'express';
import modelController from './models.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/asyncHandler.middleware';

const router = Router();

/**
 * Public routes
 */

// GET /api/v1/models - Get all models (supports ?provider=openai and ?category=best_overall)
router.get('/', asyncHandler(modelController.getAllModels));

// GET /api/v1/models/popular - Get popular models
router.get('/popular', asyncHandler(modelController.getPopularModels));

// GET /api/v1/models/compare?ids=1,2,3 - Compare multiple models
router.get('/compare', asyncHandler(modelController.compareModels));

// GET /api/v1/models/:slug - Get model details
router.get('/:slug', asyncHandler(modelController.getModelBySlug));

// GET /api/v1/models/:slug/versions - Get model version history
router.get('/:slug/versions', asyncHandler(modelController.getModelVersions));

// GET /api/v1/models/:slug/benchmarks - Get model benchmark scores
router.get('/:slug/benchmarks', asyncHandler(modelController.getModelBenchmarks));

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

/**
 * Admin routes (require authentication + admin role)
 * Note: Add admin middleware when available
 */

// POST /api/v1/models/:slug/versions - Create new model version (admin)
router.post(
  '/:slug/versions',
  authenticate,
  // TODO: Add admin middleware
  asyncHandler(modelController.createModelVersion)
);

// PUT /api/v1/models/:slug - Update model information (admin)
router.put(
  '/:slug',
  authenticate,
  // TODO: Add admin middleware
  asyncHandler(modelController.updateModel)
);

export default router;
