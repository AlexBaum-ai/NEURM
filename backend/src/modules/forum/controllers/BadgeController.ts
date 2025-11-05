import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import * as Sentry from '@sentry/node';
import { BadgeService } from '../services/badgeService';
import { BaseController } from '@/utils/baseController';
import {
  getBadgesSchema,
  getBadgeByIdSchema,
  getBadgeHoldersSchema,
  getUserBadgesSchema,
  getUserBadgeProgressSchema,
  checkUserBadgesSchema,
} from '../validators/badgeValidators';
import { BadgeCategory, BadgeType } from '@prisma/client';

/**
 * BadgeController
 *
 * Handles HTTP requests for the badge system:
 * - GET /api/badges - Get all badges
 * - GET /api/badges/:badgeId - Get badge by ID
 * - GET /api/badges/:badgeId/holders - Get users who earned badge
 * - GET /api/users/:userId/badges - Get user's earned badges
 * - GET /api/users/:userId/badges/progress - Get badge progress for user
 * - POST /api/users/:userId/badges/check - Manually trigger badge check
 *
 * All endpoints include:
 * - Request validation (Zod schemas)
 * - Error handling with Sentry
 * - Proper HTTP status codes
 */

@injectable()
export class BadgeController extends BaseController {
  constructor(private badgeService: BadgeService) {
    super();
  }

  /**
   * GET /api/badges
   *
   * Get all badges with optional filtering by category or type
   *
   * Query params:
   * - category?: skill | activity | special
   * - type?: bronze | silver | gold | platinum
   *
   * @route GET /api/badges
   * @access Public
   * @rateLimit 100 requests per 15 minutes
   */
  getAllBadges = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = getBadgesSchema.safeParse({
        query: req.query,
      });

      if (!validation.success) {
        this.badRequest(res, 'Invalid query parameters', validation.error.errors);
        return;
      }

      const { category } = validation.data.query || {};

      let badges;
      if (category) {
        badges = await this.badgeService.getBadgesByCategory(category as BadgeCategory);
      } else {
        badges = await this.badgeService.getAllBadges();
      }

      // Filter by type if specified
      if (validation.data.query?.type) {
        const type = validation.data.query.type as BadgeType;
        badges = badges.filter((badge) => badge.badgeType === type);
      }

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Badges retrieved',
        level: 'info',
        data: {
          count: badges.length,
          category,
        },
      });

      this.ok(res, {
        badges,
        total: badges.length,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          controller: 'BadgeController',
          operation: 'getAllBadges',
        },
        extra: {
          query: req.query,
        },
      });

      this.fail(res, 'Failed to retrieve badges');
    }
  };

  /**
   * GET /api/badges/:badgeId
   *
   * Get single badge by ID with details
   *
   * @route GET /api/badges/:badgeId
   * @access Public
   * @rateLimit 100 requests per 15 minutes
   */
  getBadgeById = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = getBadgeByIdSchema.safeParse({
        params: req.params,
      });

      if (!validation.success) {
        this.badRequest(res, 'Invalid badge ID', validation.error.errors);
        return;
      }

      const { badgeId } = validation.data.params;

      const badge = await this.badgeService.getBadgeById(badgeId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Badge retrieved',
        level: 'info',
        data: {
          badgeId,
          badgeName: badge.name,
        },
      });

      this.ok(res, badge);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          controller: 'BadgeController',
          operation: 'getBadgeById',
        },
        extra: {
          params: req.params,
        },
      });

      if (error instanceof Error && error.message.includes('not found')) {
        this.notFound(res, error.message);
      } else {
        this.fail(res, 'Failed to retrieve badge');
      }
    }
  };

  /**
   * GET /api/badges/:badgeId/holders
   *
   * Get users who have earned a specific badge
   *
   * Query params:
   * - limit?: number (default: 50, max: 100)
   *
   * @route GET /api/badges/:badgeId/holders
   * @access Public
   * @rateLimit 100 requests per 15 minutes
   */
  getBadgeHolders = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = getBadgeHoldersSchema.safeParse({
        params: req.params,
        query: req.query,
      });

      if (!validation.success) {
        this.badRequest(res, 'Invalid request parameters', validation.error.errors);
        return;
      }

      const { badgeId } = validation.data.params;
      const limit = validation.data.query?.limit || 50;

      const holders = await this.badgeService.getBadgeHolders(badgeId, limit);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Badge holders retrieved',
        level: 'info',
        data: {
          badgeId,
          count: holders.length,
        },
      });

      this.ok(res, {
        holders,
        total: holders.length,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          controller: 'BadgeController',
          operation: 'getBadgeHolders',
        },
        extra: {
          params: req.params,
          query: req.query,
        },
      });

      if (error instanceof Error && error.message.includes('not found')) {
        this.notFound(res, error.message);
      } else {
        this.fail(res, 'Failed to retrieve badge holders');
      }
    }
  };

  /**
   * GET /api/users/:userId/badges
   *
   * Get all badges earned by a user
   *
   * Query params:
   * - includeProgress?: boolean (default: false)
   *
   * @route GET /api/users/:userId/badges
   * @access Public
   * @rateLimit 100 requests per 15 minutes
   */
  getUserBadges = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = getUserBadgesSchema.safeParse({
        params: req.params,
        query: req.query,
      });

      if (!validation.success) {
        this.badRequest(res, 'Invalid request parameters', validation.error.errors);
        return;
      }

      const { userId } = validation.data.params;
      const includeProgress = validation.data.query?.includeProgress || false;

      let result;
      if (includeProgress) {
        // Get all badges with user's progress and earned status
        const badges = await this.badgeService.getAllBadgesWithUserProgress(userId);
        result = {
          badges,
          earnedCount: badges.filter((b) => b.isEarned).length,
          totalCount: badges.length,
        };
      } else {
        // Get only earned badges
        const earnedBadges = await this.badgeService.getUserBadges(userId);
        result = {
          badges: earnedBadges,
          earnedCount: earnedBadges.length,
        };
      }

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'User badges retrieved',
        level: 'info',
        data: {
          userId,
          earnedCount: result.earnedCount,
        },
      });

      this.ok(res, result);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          controller: 'BadgeController',
          operation: 'getUserBadges',
        },
        extra: {
          params: req.params,
          query: req.query,
        },
      });

      if (error instanceof Error && error.message.includes('not found')) {
        this.notFound(res, error.message);
      } else {
        this.fail(res, 'Failed to retrieve user badges');
      }
    }
  };

  /**
   * GET /api/users/:userId/badges/progress
   *
   * Get badge progress for all badges for a user
   * Shows current progress towards earning each badge
   *
   * @route GET /api/users/:userId/badges/progress
   * @access Public
   * @rateLimit 100 requests per 15 minutes
   */
  getUserBadgeProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = getUserBadgeProgressSchema.safeParse({
        params: req.params,
      });

      if (!validation.success) {
        this.badRequest(res, 'Invalid user ID', validation.error.errors);
        return;
      }

      const { userId } = validation.data.params;

      const progress = await this.badgeService.getBadgeProgressForUser(userId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Badge progress retrieved',
        level: 'info',
        data: {
          userId,
          badgeCount: progress.length,
        },
      });

      this.ok(res, {
        progress,
        total: progress.length,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          controller: 'BadgeController',
          operation: 'getUserBadgeProgress',
        },
        extra: {
          params: req.params,
        },
      });

      this.fail(res, 'Failed to retrieve badge progress');
    }
  };

  /**
   * POST /api/users/:userId/badges/check
   *
   * Manually trigger badge check and award badges
   * This is typically called after significant user actions
   * or by background jobs
   *
   * @route POST /api/users/:userId/badges/check
   * @access Private (System/Admin only)
   * @rateLimit 10 requests per 15 minutes
   */
  checkUserBadges = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = checkUserBadgesSchema.safeParse({
        params: req.params,
      });

      if (!validation.success) {
        this.badRequest(res, 'Invalid user ID', validation.error.errors);
        return;
      }

      const { userId } = validation.data.params;

      const awardedBadgeIds = await this.badgeService.checkAndAwardBadges(userId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Badge check completed',
        level: 'info',
        data: {
          userId,
          awardedCount: awardedBadgeIds.length,
        },
      });

      this.ok(res, {
        message: 'Badge check completed',
        awardedBadgeIds,
        awardedCount: awardedBadgeIds.length,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          controller: 'BadgeController',
          operation: 'checkUserBadges',
        },
        extra: {
          params: req.params,
        },
      });

      this.fail(res, 'Failed to check badges');
    }
  };
}
