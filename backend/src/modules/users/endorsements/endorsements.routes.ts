import { Router } from 'express';
import EndorsementsController from './endorsements.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/async.middleware';

/**
 * Endorsements routes
 * Mounted at /api/v1/profiles/:username/skills/:skillId
 */
const router = Router({ mergeParams: true });
const endorsementsController = new EndorsementsController();

/**
 * @route   POST /api/v1/profiles/:username/skills/:skillId/endorse
 * @desc    Endorse a user's skill
 * @access  Private (authenticated users only)
 */
router.post(
  '/endorse',
  authMiddleware,
  asyncHandler(endorsementsController.createEndorsement)
);

/**
 * @route   DELETE /api/v1/profiles/:username/skills/:skillId/endorse
 * @desc    Remove endorsement from a user's skill
 * @access  Private (authenticated users only)
 */
router.delete(
  '/endorse',
  authMiddleware,
  asyncHandler(endorsementsController.removeEndorsement)
);

/**
 * @route   GET /api/v1/profiles/:username/skills/:skillId/endorsements
 * @desc    Get all endorsements for a skill
 * @access  Public
 */
router.get(
  '/endorsements',
  asyncHandler(endorsementsController.getEndorsements)
);

export default router;
