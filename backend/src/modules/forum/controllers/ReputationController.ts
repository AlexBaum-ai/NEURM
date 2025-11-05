import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import * as Sentry from '@sentry/node';
import { ReputationService } from '../services/reputationService';
import { BaseController } from '@/utils/baseController';
import { getUserReputationSchema } from '../validators/reputationValidators';

/**
 * ReputationController
 *
 * Handles HTTP requests for reputation system:
 * - GET /api/users/:userId/reputation - Get user reputation and breakdown
 *
 * All endpoints include:
 * - Request validation (Zod schemas)
 * - Error handling with Sentry
 * - Proper HTTP status codes
 */

@injectable()
export class ReputationController extends BaseController {
  constructor(private reputationService: ReputationService) {
    super();
  }

  /**
   * GET /api/users/:userId/reputation
   *
   * Get user reputation with complete details including:
   * - Total reputation and level
   * - Progress towards next level
   * - Breakdown by activity type
   * - Recent reputation history
   * - Reputation-based permissions
   *
   * @route GET /api/users/:userId/reputation
   * @access Public
   * @rateLimit 100 requests per 15 minutes
   */
  getUserReputation = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const validation = getUserReputationSchema.safeParse({
        params: req.params,
      });

      if (!validation.success) {
        this.badRequest(res, 'Invalid request parameters', validation.error.errors);
        return;
      }

      const { userId } = validation.data.params;

      // Get reputation data
      const reputation = await this.reputationService.getUserReputation(userId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'User reputation retrieved',
        level: 'info',
        data: {
          userId,
          totalReputation: reputation.totalReputation,
          level: reputation.level,
        },
      });

      this.ok(res, reputation);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          controller: 'ReputationController',
          operation: 'getUserReputation',
        },
        extra: {
          params: req.params,
        },
      });

      if (error instanceof Error && error.message.includes('not found')) {
        this.notFound(res, error.message);
      } else {
        this.fail(res, 'Failed to retrieve user reputation');
      }
    }
  };
}
