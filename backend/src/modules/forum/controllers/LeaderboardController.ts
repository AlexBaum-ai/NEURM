import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import * as Sentry from '@sentry/node';
import { LeaderboardService } from '../services/leaderboardService';
import { LeaderboardPeriod } from '../repositories/LeaderboardRepository';
import { BaseController } from '@/common/BaseController';

/**
 * LeaderboardController
 *
 * Handles HTTP requests for leaderboard endpoints:
 * - GET /api/leaderboards/weekly
 * - GET /api/leaderboards/monthly
 * - GET /api/leaderboards/all-time
 * - GET /api/leaderboards/hall-of-fame
 * - GET /api/leaderboards/me
 */

@injectable()
export class LeaderboardController extends BaseController {
  constructor(private leaderboardService: LeaderboardService) {
    super();
  }

  /**
   * GET /api/leaderboards/weekly
   * Get weekly leaderboard (top 50 users this week)
   */
  getWeeklyLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaderboard = await this.leaderboardService.getLeaderboard('weekly');

      this.ok(res, {
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          controller: 'LeaderboardController',
          action: 'getWeeklyLeaderboard',
        },
      });
      this.fail(res, 'Failed to fetch weekly leaderboard');
    }
  };

  /**
   * GET /api/leaderboards/monthly
   * Get monthly leaderboard (top 50 users this month)
   */
  getMonthlyLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaderboard = await this.leaderboardService.getLeaderboard('monthly');

      this.ok(res, {
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          controller: 'LeaderboardController',
          action: 'getMonthlyLeaderboard',
        },
      });
      this.fail(res, 'Failed to fetch monthly leaderboard');
    }
  };

  /**
   * GET /api/leaderboards/all-time
   * Get all-time leaderboard (top 100 users ever)
   */
  getAllTimeLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const leaderboard = await this.leaderboardService.getLeaderboard('all-time');

      this.ok(res, {
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          controller: 'LeaderboardController',
          action: 'getAllTimeLeaderboard',
        },
      });
      this.fail(res, 'Failed to fetch all-time leaderboard');
    }
  };

  /**
   * GET /api/leaderboards/hall-of-fame
   * Get Hall of Fame (archived top monthly contributors)
   */
  getHallOfFame = async (req: Request, res: Response): Promise<void> => {
    try {
      const hallOfFame = await this.leaderboardService.getHallOfFame();

      this.ok(res, {
        success: true,
        data: hallOfFame,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          controller: 'LeaderboardController',
          action: 'getHallOfFame',
        },
      });
      this.fail(res, 'Failed to fetch Hall of Fame');
    }
  };

  /**
   * GET /api/leaderboards/me
   * Get current user's rankings across all periods
   */
  getMyRankings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        this.unauthorized(res, 'Authentication required');
        return;
      }

      const rankings = await this.leaderboardService.getUserRankings(userId);

      this.ok(res, {
        success: true,
        data: rankings,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          controller: 'LeaderboardController',
          action: 'getMyRankings',
        },
        extra: {
          userId: req.user?.id,
        },
      });
      this.fail(res, 'Failed to fetch user rankings');
    }
  };

  /**
   * GET /api/leaderboards/:period
   * Generic endpoint to get any leaderboard period
   */
  getLeaderboardByPeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period } = req.params;

      // Validate period
      const validPeriods: LeaderboardPeriod[] = ['weekly', 'monthly', 'all-time'];
      if (!validPeriods.includes(period as LeaderboardPeriod)) {
        this.badRequest(res, 'Invalid period. Must be: weekly, monthly, or all-time');
        return;
      }

      const leaderboard = await this.leaderboardService.getLeaderboard(
        period as LeaderboardPeriod
      );

      this.ok(res, {
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          controller: 'LeaderboardController',
          action: 'getLeaderboardByPeriod',
        },
        extra: {
          period: req.params.period,
        },
      });
      this.fail(res, 'Failed to fetch leaderboard');
    }
  };
}
