import { Router } from 'express';
import ProfilesController from './profiles.controller';
import { authenticate, optionalAuth } from '@/middleware/auth.middleware';
import { profileUpdateLimiter, apiLimiter } from '@/middleware/rateLimiter.middleware';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Profiles routes
 * All routes are prefixed with /api/v1/profiles
 */
const router = Router();
const profilesController = new ProfilesController();

/**
 * @route   PUT /api/v1/profiles/candidate
 * @desc    Update candidate profile (job preferences + basic profile fields)
 * @access  Private (requires authentication)
 * @rate    10 requests per hour
 */
router.put(
  '/candidate',
  authenticate,
  profileUpdateLimiter,
  asyncHandler(profilesController.updateCandidateProfile)
);

/**
 * @route   GET /api/v1/profiles/:username
 * @desc    Get public candidate profile by username
 * @access  Public (optional authentication for privacy settings)
 * @note    Respects privacy settings and recruiter visibility
 */
router.get(
  '/:username',
  optionalAuth,
  apiLimiter,
  asyncHandler(profilesController.getCandidateProfile)
);

/**
 * @route   GET /api/v1/profiles/:username/portfolio
 * @desc    Get portfolio projects for a user
 * @access  Public (optional authentication for privacy settings)
 * @note    Respects privacy settings
 */
router.get(
  '/:username/portfolio',
  optionalAuth,
  apiLimiter,
  asyncHandler(profilesController.getPortfolio)
);

export default router;
