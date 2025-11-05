import { Router } from 'express';
import companyController from './company.controller';
import companyAnalyticsController from './companyAnalytics.controller';
import { authenticate, optionalAuth } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import {
  getCompanyProfileSchema,
  updateCompanyProfileSchema,
  getCompanyJobsSchema,
  followCompanySchema,
  createCompanySchema,
  listCompaniesSchema,
} from './company.validation';
import {
  getAnalyticsQuerySchema,
  exportAnalyticsQuerySchema,
  companyIdParamSchema,
  jobAnalyticsParamSchema,
} from './companyAnalytics.validation';

const router = Router();

/**
 * @route   GET /api/v1/companies
 * @desc    List companies with pagination and filters
 * @access  Public
 */
router.get(
  '/',
  validate(listCompaniesSchema),
  companyController.listCompanies
);

/**
 * @route   POST /api/v1/companies
 * @desc    Create company profile
 * @access  Private (company account owners)
 */
router.post(
  '/',
  authenticate,
  validate(createCompanySchema),
  companyController.createCompany
);

/**
 * @route   GET /api/v1/companies/:id
 * @desc    Get public company profile by ID or slug
 * @access  Public (shows more if authenticated)
 */
router.get(
  '/:id',
  optionalAuth,
  validate(getCompanyProfileSchema),
  companyController.getCompanyProfile
);

/**
 * @route   PUT /api/v1/companies/:id
 * @desc    Update company profile
 * @access  Private (company admin only)
 */
router.put(
  '/:id',
  authenticate,
  validate(updateCompanyProfileSchema),
  companyController.updateCompanyProfile
);

/**
 * @route   GET /api/v1/companies/:id/jobs
 * @desc    Get company's active jobs
 * @access  Public
 */
router.get(
  '/:id/jobs',
  validate(getCompanyJobsSchema),
  companyController.getCompanyJobs
);

/**
 * @route   POST /api/v1/companies/:id/follow
 * @desc    Follow company
 * @access  Private
 */
router.post(
  '/:id/follow',
  authenticate,
  validate(followCompanySchema),
  companyController.followCompany
);

/**
 * @route   DELETE /api/v1/companies/:id/follow
 * @desc    Unfollow company
 * @access  Private
 */
router.delete(
  '/:id/follow',
  authenticate,
  validate(followCompanySchema),
  companyController.unfollowCompany
);

/**
 * @route   GET /api/v1/companies/:companyId/analytics
 * @desc    Get company-wide analytics
 * @access  Private (company owner only)
 */
router.get(
  '/:companyId/analytics',
  authenticate,
  validate({ params: companyIdParamSchema, query: getAnalyticsQuerySchema }),
  companyAnalyticsController.getCompanyAnalytics
);

/**
 * @route   GET /api/v1/companies/:companyId/analytics/jobs/:jobId
 * @desc    Get job-specific analytics
 * @access  Private (company owner only)
 */
router.get(
  '/:companyId/analytics/jobs/:jobId',
  authenticate,
  validate({ params: jobAnalyticsParamSchema, query: getAnalyticsQuerySchema }),
  companyAnalyticsController.getJobAnalytics
);

/**
 * @route   GET /api/v1/companies/:companyId/analytics/export/csv
 * @desc    Export company analytics to CSV
 * @access  Private (company owner only)
 */
router.get(
  '/:companyId/analytics/export/csv',
  authenticate,
  validate({ params: companyIdParamSchema, query: exportAnalyticsQuerySchema }),
  companyAnalyticsController.exportAnalyticsCSV
);

/**
 * @route   GET /api/v1/companies/:companyId/analytics/export/pdf
 * @desc    Export company analytics to PDF
 * @access  Private (company owner only)
 */
router.get(
  '/:companyId/analytics/export/pdf',
  authenticate,
  validate({ params: companyIdParamSchema, query: exportAnalyticsQuerySchema }),
  companyAnalyticsController.exportAnalyticsPDF
);

export default router;
