import { Router } from 'express';
import { container } from 'tsyringe';
import { LeaderboardController } from '../controllers/LeaderboardController';
import { authenticateOptional, authenticateRequired } from '@/middleware/auth.middleware';

/**
 * Leaderboard Routes
 * Base path: /api/leaderboards
 */

const router = Router();
const leaderboardController = container.resolve(LeaderboardController);

/**
 * @route   GET /api/leaderboards/weekly
 * @desc    Get weekly leaderboard (top 50 users this week)
 * @access  Public
 */
router.get('/weekly', authenticateOptional, leaderboardController.getWeeklyLeaderboard);

/**
 * @route   GET /api/leaderboards/monthly
 * @desc    Get monthly leaderboard (top 50 users this month)
 * @access  Public
 */
router.get('/monthly', authenticateOptional, leaderboardController.getMonthlyLeaderboard);

/**
 * @route   GET /api/leaderboards/all-time
 * @desc    Get all-time leaderboard (top 100 users ever)
 * @access  Public
 */
router.get('/all-time', authenticateOptional, leaderboardController.getAllTimeLeaderboard);

/**
 * @route   GET /api/leaderboards/hall-of-fame
 * @desc    Get Hall of Fame (archived top monthly contributors)
 * @access  Public
 */
router.get('/hall-of-fame', authenticateOptional, leaderboardController.getHallOfFame);

/**
 * @route   GET /api/leaderboards/me
 * @desc    Get current user's rankings across all periods
 * @access  Private
 */
router.get('/me', authenticateRequired, leaderboardController.getMyRankings);

/**
 * @route   GET /api/leaderboards/:period
 * @desc    Get leaderboard for any period (generic endpoint)
 * @access  Public
 */
router.get('/:period', authenticateOptional, leaderboardController.getLeaderboardByPeriod);

export default router;
