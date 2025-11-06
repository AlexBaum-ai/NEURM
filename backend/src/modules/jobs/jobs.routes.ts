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
 * @route   GET /api/v1/jobs/saved
 * @desc    Get user's saved jobs
 * @access  Private (authenticated users only)
 * @query   page, limit, sortBy, sortOrder
 */
router.get(
  '/saved',
  authMiddleware,
  rateLimiterMiddleware({ points: 100, duration: 60 }),
  asyncHandler(jobController.getSavedJobs)
);

/**
 * @route   GET /api/v1/jobs/alerts
 * @desc    Get user's job alerts
 * @access  Private (authenticated users only)
 * @query   active
 */
router.get(
  '/alerts',
  authMiddleware,
  rateLimiterMiddleware({ points: 100, duration: 60 }),
  asyncHandler(jobController.getJobAlerts)
);

/**
 * @route   POST /api/v1/jobs/alerts
 * @desc    Create a new job alert
 * @access  Private (authenticated users only)
 * @body    CreateJobAlertInput - name, criteria
 */
router.post(
  '/alerts',
  authMiddleware,
  rateLimiterMiddleware({ points: 20, duration: 3600 }), // 20 alerts per hour
  asyncHandler(jobController.createJobAlert)
);

/**
 * @route   POST /api/v1/jobs/alerts/track-click
 * @desc    Track alert click (when user clicks job from alert email)
 * @access  Public
 * @body    TrackAlertClickInput - alertId, jobId
 */
router.post(
  '/alerts/track-click',
  rateLimiterMiddleware({ points: 100, duration: 60 }),
  asyncHandler(jobController.trackAlertClick)
);

/**
 * @route   GET /api/v1/jobs/alerts/:id
 * @desc    Get specific job alert
 * @access  Private (authenticated users only)
 * @param   id - Alert UUID
 */
router.get(
  '/alerts/:id',
  authMiddleware,
  rateLimiterMiddleware({ points: 100, duration: 60 }),
  asyncHandler(jobController.getJobAlert)
);

/**
 * @route   PATCH /api/v1/jobs/alerts/:id
 * @desc    Update job alert
 * @access  Private (authenticated users only)
 * @param   id - Alert UUID
 * @body    UpdateJobAlertInput - name, criteria, active
 */
router.patch(
  '/alerts/:id',
  authMiddleware,
  rateLimiterMiddleware({ points: 30, duration: 3600 }),
  asyncHandler(jobController.updateJobAlert)
);

/**
 * @route   DELETE /api/v1/jobs/alerts/:id
 * @desc    Delete job alert
 * @access  Private (authenticated users only)
 * @param   id - Alert UUID
 */
router.delete(
  '/alerts/:id',
  authMiddleware,
  rateLimiterMiddleware({ points: 20, duration: 3600 }),
  asyncHandler(jobController.deleteJobAlert)
);

/**
 * @route   POST /api/v1/jobs/alerts/:id/test
 * @desc    Send test alert email with matching jobs
 * @access  Private (authenticated users only)
 * @param   id - Alert UUID
 */
router.post(
  '/alerts/:id/test',
  authMiddleware,
  rateLimiterMiddleware({ points: 5, duration: 3600 }), // 5 tests per hour
  asyncHandler(jobController.testJobAlert)
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
 * @route   POST /api/v1/jobs/:id/save
 * @desc    Save/bookmark a job
 * @access  Private (authenticated users only)
 * @param   id - Job UUID
 * @body    SaveJobInput - notes (optional)
 */
router.post(
  '/:id/save',
  authMiddleware,
  rateLimiterMiddleware({ points: 50, duration: 3600 }), // 50 saves per hour
  asyncHandler(jobController.saveJob)
);

/**
 * @route   DELETE /api/v1/jobs/:id/save
 * @desc    Remove saved/bookmarked job
 * @access  Private (authenticated users only)
 * @param   id - Job UUID
 */
router.delete(
  '/:id/save',
  authMiddleware,
  rateLimiterMiddleware({ points: 50, duration: 3600 }),
  asyncHandler(jobController.unsaveJob)
);

/**
 * @route   PATCH /api/v1/jobs/:id/save
 * @desc    Update saved job notes
 * @access  Private (authenticated users only)
 * @param   id - Job UUID
 * @body    UpdateSavedJobInput - notes (optional)
 */
router.patch(
  '/:id/save',
  authMiddleware,
  rateLimiterMiddleware({ points: 50, duration: 3600 }),
  asyncHandler(jobController.updateSavedJob)
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
 * @route   GET /api/v1/jobs/slug/:slug/match
 * @desc    Get match score for a specific job by slug
 * @access  Private (authenticated users only)
 * @param   slug - Job slug
 */
router.get(
  '/slug/:slug/match',
  authMiddleware,
  rateLimiterMiddleware({ points: 100, duration: 60 }),
  asyncHandler(jobController.getJobMatchBySlug)
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
