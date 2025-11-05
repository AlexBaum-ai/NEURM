import express, { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import { rateLimiterMiddleware } from '@/middleware/rateLimiter.middleware';
import JobController from './jobs.controller';
import ApplicationController from './application.controller';

const router: Router = express.Router();
const jobController = new JobController();
const applicationController = new ApplicationController();

/**
 * Job Routes
 * API endpoints for job postings
 */

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * @route   GET /api/v1/jobs
 * @desc    Get paginated list of job postings with filters
 * @access  Public
 * @query   page, limit, status, jobType, workLocation, experienceLevel, location,
 *          hasVisaSponsorship, salaryMin, salaryMax, primaryLlms, frameworks,
 *          modelStrategy, search, sortBy, sortOrder
 */
router.get(
  '/',
  rateLimiterMiddleware({ points: 100, duration: 60 }), // 100 requests per minute
  asyncHandler(jobController.listJobs)
);

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
 * @route   GET /api/v1/jobs/:id/match
 * @desc    Get match score for a specific job
 * @access  Private (authenticated users only)
 * @param   id - Job UUID
 */
router.get(
  '/:id/match',
  authMiddleware,
  rateLimiterMiddleware({ points: 100, duration: 60 }),
  asyncHandler(jobController.getJobMatch)
);

/**
 * @route   GET /api/v1/jobs/:id
 * @desc    Get job details by ID
 * @access  Public
 * @param   id - Job UUID
 */
router.get(
  '/:id',
  rateLimiterMiddleware({ points: 100, duration: 60 }),
  asyncHandler(jobController.getJobById)
);

/**
 * @route   GET /api/v1/jobs/slug/:slug
 * @desc    Get job details by slug
 * @access  Public
 * @param   slug - Job slug
 */
router.get(
  '/slug/:slug',
  rateLimiterMiddleware({ points: 100, duration: 60 }),
  asyncHandler(jobController.getJobBySlug)
);

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

/**
 * @route   POST /api/v1/jobs
 * @desc    Create a new job posting (company accounts only)
 * @access  Private (company accounts with verified company)
 * @body    CreateJobInput - Job details including title, description, requirements, etc.
 */
router.post(
  '/',
  authMiddleware,
  rateLimiterMiddleware({ points: 10, duration: 3600 }), // 10 job posts per hour
  asyncHandler(jobController.createJob)
);

/**
 * @route   PUT /api/v1/jobs/:id
 * @desc    Update job posting (company only)
 * @access  Private (company owner only)
 * @param   id - Job UUID
 * @body    UpdateJobInput - Updated job fields
 */
router.put(
  '/:id',
  authMiddleware,
  rateLimiterMiddleware({ points: 30, duration: 3600 }), // 30 updates per hour
  asyncHandler(jobController.updateJob)
);

/**
 * @route   DELETE /api/v1/jobs/:id
 * @desc    Soft delete job posting (company only)
 * @access  Private (company owner only)
 * @param   id - Job UUID
 */
router.delete(
  '/:id',
  authMiddleware,
  rateLimiterMiddleware({ points: 20, duration: 3600 }), // 20 deletions per hour
  asyncHandler(jobController.deleteJob)
);

export default router;
