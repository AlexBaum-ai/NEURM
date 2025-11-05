import { Router } from 'express';
import companyAnalyticsController from './companyAnalytics.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { validateRequest } from '@/middleware/validation.middleware';
import {
  getAnalyticsQuerySchema,
  exportAnalyticsQuerySchema,
  companyIdParamSchema,
  jobAnalyticsParamSchema,
} from './companyAnalytics.validation';

const router = Router();

/**
 * @route GET /api/v1/companies/:companyId/analytics
 * @desc Get company-wide analytics
 * @access Private (company owner only)
 */
router.get(
  '/:companyId/analytics',
  authMiddleware,
  validateRequest({
    params: companyIdParamSchema,
    query: getAnalyticsQuerySchema,
  }),
  companyAnalyticsController.getCompanyAnalytics
);

/**
 * @route GET /api/v1/companies/:companyId/analytics/jobs/:jobId
 * @desc Get job-specific analytics
 * @access Private (company owner only)
 */
router.get(
  '/:companyId/analytics/jobs/:jobId',
  authMiddleware,
  validateRequest({
    params: jobAnalyticsParamSchema,
    query: getAnalyticsQuerySchema,
  }),
  companyAnalyticsController.getJobAnalytics
);

/**
 * @route GET /api/v1/companies/:companyId/analytics/export/csv
 * @desc Export company analytics to CSV
 * @access Private (company owner only)
 */
router.get(
  '/:companyId/analytics/export/csv',
  authMiddleware,
  validateRequest({
    params: companyIdParamSchema,
    query: exportAnalyticsQuerySchema,
  }),
  companyAnalyticsController.exportAnalyticsCSV
);

/**
 * @route GET /api/v1/companies/:companyId/analytics/export/pdf
 * @desc Export company analytics to PDF
 * @access Private (company owner only)
 */
router.get(
  '/:companyId/analytics/export/pdf',
  authMiddleware,
  validateRequest({
    params: companyIdParamSchema,
    query: exportAnalyticsQuerySchema,
  }),
  companyAnalyticsController.exportAnalyticsPDF
);

export default router;
