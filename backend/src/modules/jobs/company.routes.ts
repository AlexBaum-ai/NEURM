import { Router } from 'express';
import companyController from './company.controller';
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

export default router;
