import { Router } from 'express';
import { container } from 'tsyringe';
import { BadgeController } from '../controllers/BadgeController';

/**
 * User Badge Routes
 *
 * Defines routes for user-specific badge operations:
 * - GET /api/users/:userId/badges - Get user's earned badges
 * - GET /api/users/:userId/badges/progress - Get badge progress
 * - POST /api/users/:userId/badges/check - Check and award badges
 *
 * Note: These routes are mounted at /api/users in the main app
 */

const router = Router({ mergeParams: true }); // mergeParams to access :userId from parent router
const badgeController = container.resolve(BadgeController);

/**
 * @route GET /api/users/:userId/badges
 * @desc Get all badges earned by a user
 * @access Public
 */
router.get('/', badgeController.getUserBadges);

/**
 * @route GET /api/users/:userId/badges/progress
 * @desc Get badge progress for all badges for a user
 * @access Public
 */
router.get('/progress', badgeController.getUserBadgeProgress);

/**
 * @route POST /api/users/:userId/badges/check
 * @desc Manually trigger badge check and award badges
 * @access Private (System/Admin only)
 * @note This should be protected by authentication middleware
 */
router.post('/check', badgeController.checkUserBadges);

export default router;
