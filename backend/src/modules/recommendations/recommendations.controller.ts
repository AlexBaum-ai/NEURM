import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { BaseController } from '@/utils/baseController';
import recommendationsService from './recommendations.service';
import {
  getRecommendationsSchema,
  recommendationFeedbackSchema,
} from './recommendations.validation';

/**
 * RecommendationsController
 *
 * Handles HTTP requests for AI recommendation engine:
 * - GET /api/recommendations - Get personalized recommendations
 * - POST /api/recommendations/feedback - Submit feedback
 */

export class RecommendationsController extends BaseController {
  /**
   * GET /api/recommendations
   * Get personalized recommendations for authenticated user
   */
  public getRecommendations = this.asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const userId = req.user!.id;
        const query = getRecommendationsSchema.parse(req.query);

        const recommendations = await recommendationsService.getRecommendations({
          userId,
          types: query.types,
          limit: query.limit,
          excludeIds: query.excludeIds,
          includeExplanations: query.includeExplanations,
        });

        return this.success(res, {
          recommendations,
          meta: {
            count: recommendations.length,
            limit: query.limit,
            cached: false, // Service handles caching internally
          },
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return this.handleZodError(res, error);
        }

        this.captureException(error as Error, {
          userId: req.user?.id,
          query: req.query,
        });

        return this.error(
          res,
          'Failed to generate recommendations',
          500
        );
      }
    }
  );

  /**
   * POST /api/recommendations/feedback
   * Submit feedback on a recommendation
   */
  public submitFeedback = this.asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const userId = req.user!.id;
        const data = recommendationFeedbackSchema.parse(req.body);

        const feedback = await recommendationsService.submitFeedback(
          userId,
          data.itemType,
          data.itemId,
          data.feedback
        );

        return this.success(
          res,
          {
            feedback,
            message: 'Feedback submitted successfully. Your recommendations will be updated.',
          },
          201
        );
      } catch (error) {
        if (error instanceof ZodError) {
          return this.handleZodError(res, error);
        }

        this.captureException(error as Error, {
          userId: req.user?.id,
          body: req.body,
        });

        return this.error(
          res,
          'Failed to submit feedback',
          500
        );
      }
    }
  );
}

export default new RecommendationsController();
