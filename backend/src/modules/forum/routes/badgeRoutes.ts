import { Router } from 'express';
import { container } from 'tsyringe';
import { BadgeController } from '../controllers/BadgeController';

/**
 * Badge Routes
 *
 * Defines routes for badge system:
 * - GET /api/badges - Get all badges
 * - GET /api/badges/:badgeId - Get badge by ID
 * - GET /api/badges/:badgeId/holders - Get users who earned badge
 * - GET /api/users/:userId/badges - Get user's earned badges
 * - GET /api/users/:userId/badges/progress - Get badge progress
 * - POST /api/users/:userId/badges/check - Check and award badges
 */

const router = Router();
const badgeController = container.resolve(BadgeController);

/**
 * @route GET /api/badges
 * @desc Get all badges with optional filtering
 * @access Public
 */
router.get('/', badgeController.getAllBadges);

/**
 * @route GET /api/badges/:badgeId
 * @desc Get single badge by ID
 * @access Public
 */
router.get('/:badgeId', badgeController.getBadgeById);

/**
 * @route GET /api/badges/:badgeId/holders
 * @desc Get users who have earned a specific badge
 * @access Public
 */
router.get('/:badgeId/holders', badgeController.getBadgeHolders);

export default router;
