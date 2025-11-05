import express, { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import { rateLimiterMiddleware } from '@/middleware/rateLimiter.middleware';
import ApplicationController from './application.controller';

const router: Router = express.Router();
const applicationController = new ApplicationController();

/**
 * Application Routes
 * API endpoints for job applications (Easy Apply system)
 */

// ============================================================================
// APPLICATION ROUTES (All require authentication)
// ============================================================================

/**
 * @route   POST /api/v1/jobs/:id/apply
 * @desc    Apply to a job (Easy Apply)
 * @access  Private (authenticated users only)
 * @param   id - Job UUID
 * @body    ApplyToJobInput - coverLetter, screeningAnswers, source
 */
router.post(
  '/:id/apply',
  authMiddleware,
  rateLimiterMiddleware({ points: 20, duration: 3600 }), // 20 applications per hour
  asyncHandler(applicationController.applyToJob)
);

/**
 * @route   GET /api/v1/applications
 * @desc    Get user's applications
 * @access  Private (authenticated users only)
 * @query   status, sortBy, sortOrder
 */
router.get(
  '/',
  authMiddleware,
  rateLimiterMiddleware({ points: 60, duration: 60 }), // 60 requests per minute
  asyncHandler(applicationController.getUserApplications)
);

/**
 * @route   GET /api/v1/applications/stats
 * @desc    Get application statistics
 * @access  Private (authenticated users only)
 */
router.get(
  '/stats',
  authMiddleware,
  rateLimiterMiddleware({ points: 30, duration: 60 }), // 30 requests per minute
  asyncHandler(applicationController.getApplicationStats)
);

/**
 * @route   GET /api/v1/applications/export
 * @desc    Export applications as CSV
 * @access  Private (authenticated users only)
 * @query   status, filter
 */
router.get(
  '/export',
  authMiddleware,
  rateLimiterMiddleware({ points: 10, duration: 60 }), // 10 exports per minute
  asyncHandler(applicationController.exportApplications)
);

/**
 * @route   GET /api/v1/applications/:id
 * @desc    Get application details
 * @access  Private (owner or company only)
 * @param   id - Application UUID
 */
router.get(
  '/:id',
  authMiddleware,
  rateLimiterMiddleware({ points: 60, duration: 60 }), // 60 requests per minute
  asyncHandler(applicationController.getApplicationById)
);

/**
 * @route   GET /api/v1/applications/:id/history
 * @desc    Get application status history
 * @access  Private (owner or company only)
 * @param   id - Application UUID
 */
router.get(
  '/:id/history',
  authMiddleware,
  rateLimiterMiddleware({ points: 60, duration: 60 }), // 60 requests per minute
  asyncHandler(applicationController.getApplicationHistory)
);

/**
 * @route   PUT /api/v1/applications/:id/withdraw
 * @desc    Withdraw application
 * @access  Private (application owner only)
 * @param   id - Application UUID
 */
router.put(
  '/:id/withdraw',
  authMiddleware,
  rateLimiterMiddleware({ points: 20, duration: 3600 }), // 20 withdrawals per hour
  asyncHandler(applicationController.withdrawApplication)
);

/**
 * @route   PUT /api/v1/applications/:id/status
 * @desc    Update application status (company side)
 * @access  Private (company owner only)
 * @param   id - Application UUID
 * @body    UpdateApplicationStatusInput - status
 */
router.put(
  '/:id/status',
  authMiddleware,
  rateLimiterMiddleware({ points: 60, duration: 60 }), // 60 status updates per minute
  asyncHandler(applicationController.updateApplicationStatus)
);

export default router;
