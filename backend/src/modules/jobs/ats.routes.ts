import { Router } from 'express';
import atsController from './ats.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import {
  getCompanyApplicationsSchema,
  getApplicationDetailSchema,
  updateApplicationStatusSchema,
  addNoteSchema,
  rateApplicationSchema,
  shareApplicationSchema,
  getApplicationActivitySchema,
  bulkUpdateStatusSchema,
  bulkArchiveSchema,
} from './ats.validation';

const router = Router();

/**
 * All ATS routes require authentication
 * They will be mounted under /api/v1/companies/applications
 */

/**
 * @route   GET /api/v1/companies/applications
 * @desc    Get all applications for company's jobs
 * @access  Private (company owners)
 * @filters jobId, status, date_range, match_score, rating
 * @sort    date_applied, match_score, rating
 */
router.get(
  '/',
  authenticate,
  validate(getCompanyApplicationsSchema),
  atsController.getCompanyApplications
);

/**
 * @route   GET /api/v1/companies/applications/:id
 * @desc    Get application detail with full candidate profile
 * @access  Private (company owners)
 * @includes Forum reputation, badges, match score, notes, ratings, activity
 */
router.get(
  '/:id',
  authenticate,
  validate(getApplicationDetailSchema),
  atsController.getApplicationDetail
);

/**
 * @route   PUT /api/v1/companies/applications/:id/status
 * @desc    Update application status
 * @access  Private (company owners)
 * @body    { status: ApplicationStatus, notes?: string }
 */
router.put(
  '/:id/status',
  authenticate,
  validate(updateApplicationStatusSchema),
  atsController.updateApplicationStatus
);

/**
 * @route   POST /api/v1/companies/applications/:id/notes
 * @desc    Add note to application
 * @access  Private (company owners)
 * @body    { note: string, isInternal?: boolean }
 */
router.post(
  '/:id/notes',
  authenticate,
  validate(addNoteSchema),
  atsController.addNote
);

/**
 * @route   PUT /api/v1/companies/applications/:id/rating
 * @desc    Rate application (1-5 stars)
 * @access  Private (company owners)
 * @body    { rating: number }
 */
router.put(
  '/:id/rating',
  authenticate,
  validate(rateApplicationSchema),
  atsController.rateApplication
);

/**
 * @route   POST /api/v1/companies/applications/:id/share
 * @desc    Share application with team member
 * @access  Private (company owners)
 * @body    { sharedWith: string, message?: string }
 */
router.post(
  '/:id/share',
  authenticate,
  validate(shareApplicationSchema),
  atsController.shareApplication
);

/**
 * @route   GET /api/v1/companies/applications/:id/activity
 * @desc    Get application activity log
 * @access  Private (company owners)
 */
router.get(
  '/:id/activity',
  authenticate,
  validate(getApplicationActivitySchema),
  atsController.getApplicationActivity
);

/**
 * @route   POST /api/v1/companies/applications/bulk/status
 * @desc    Bulk update application status
 * @access  Private (company owners)
 * @body    { applicationIds: string[], status: ApplicationStatus }
 */
router.post(
  '/bulk/status',
  authenticate,
  validate(bulkUpdateStatusSchema),
  atsController.bulkUpdateStatus
);

/**
 * @route   POST /api/v1/companies/applications/bulk/archive
 * @desc    Bulk archive applications
 * @access  Private (company owners)
 * @body    { applicationIds: string[] }
 */
router.post(
  '/bulk/archive',
  authenticate,
  validate(bulkArchiveSchema),
  atsController.bulkArchive
);

export default router;
