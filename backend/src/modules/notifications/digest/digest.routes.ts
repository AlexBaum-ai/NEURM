import { Router } from 'express';
import DigestController from './digest.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateRequest } from '@/middleware/validation.middleware';
import {
  updateDigestPreferencesSchema,
  previewDigestSchema,
  trackOpenSchema,
  trackClickSchema,
  unsubscribeSchema,
} from './digest.validation';
import { createRateLimiter } from '@/middleware/rateLimit.middleware';

const router = Router();
const controller = new DigestController();

// Rate limiters
const readLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

const writeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 updates per window
});

const trackingLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 tracking events per minute
});

// ============================================================================
// DIGEST PREFERENCES
// ============================================================================

/**
 * @route   GET /api/v1/notifications/digest/preferences
 * @desc    Get user's digest preferences
 * @access  Private
 */
router.get(
  '/preferences',
  authenticate,
  readLimiter,
  controller.getPreferences
);

/**
 * @route   PUT /api/v1/notifications/digest/preferences
 * @desc    Update digest preferences
 * @access  Private
 */
router.put(
  '/preferences',
  authenticate,
  writeLimiter,
  validateRequest(updateDigestPreferencesSchema),
  controller.updatePreferences
);

// ============================================================================
// DIGEST PREVIEW
// ============================================================================

/**
 * @route   GET /api/v1/notifications/digest/preview
 * @desc    Preview digest content
 * @access  Private
 */
router.get(
  '/preview',
  authenticate,
  readLimiter,
  validateRequest(previewDigestSchema),
  controller.previewDigest
);

// ============================================================================
// TRACKING (Public endpoints - no auth required)
// ============================================================================

/**
 * @route   GET /api/v1/notifications/digest/track/open/:trackingToken
 * @desc    Track email open (1x1 pixel)
 * @access  Public
 */
router.get(
  '/track/open/:trackingToken',
  trackingLimiter,
  validateRequest(trackOpenSchema),
  controller.trackOpen
);

/**
 * @route   GET /api/v1/notifications/digest/track/click/:trackingToken
 * @desc    Track link click and redirect
 * @access  Public
 */
router.get(
  '/track/click/:trackingToken',
  trackingLimiter,
  validateRequest(trackClickSchema),
  controller.trackClick
);

/**
 * @route   GET /api/v1/notifications/digest/unsubscribe
 * @desc    Unsubscribe from digests
 * @access  Public
 */
router.get(
  '/unsubscribe',
  trackingLimiter,
  validateRequest(unsubscribeSchema),
  controller.unsubscribe
);

export default router;
