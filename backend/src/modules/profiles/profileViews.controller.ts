import { Request, Response } from 'express';
import { ZodError } from 'zod';
import ProfileViewsService from './profileViews.service';
import {
  trackProfileViewSchema,
  getMyProfileViewersSchema,
  getProfileViewCountSchema,
} from './profileViews.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * ProfileViewsController
 * Handles HTTP requests for profile view tracking endpoints
 */
export class ProfileViewsController {
  private service: ProfileViewsService;

  constructor(service?: ProfileViewsService) {
    this.service = service || new ProfileViewsService();
  }

  /**
   * POST /api/v1/profiles/:username/view
   * Track a profile view
   */
  trackProfileView = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request
      const validationResult = trackProfileViewSchema.safeParse({
        params: req.params,
        body: req.body || {},
      });

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const { username } = validationResult.data.params;
      const { anonymous } = validationResult.data.body;

      logger.info(`Tracking profile view`, {
        username,
        viewerId: userId,
        anonymous,
      });

      const result = await this.service.trackProfileView(username, userId, anonymous);

      res.status(200).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/profiles/me/views
   * Get who viewed my profile (premium only)
   */
  getMyProfileViewers = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request
      const validationResult = getMyProfileViewersSchema.safeParse({
        query: req.query,
      });

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { page, limit } = validationResult.data.query;

      logger.info(`Fetching profile viewers for user ${userId}`, {
        userId,
        page,
        limit,
      });

      const result = await this.service.getMyProfileViewers(userId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/profiles/:username/view-count
   * Get profile view count (public)
   */
  getProfileViewCount = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const validationResult = getProfileViewCountSchema.safeParse({
        params: req.params,
      });

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { username } = validationResult.data.params;

      logger.info(`Fetching profile view count for username: ${username}`);

      const result = await this.service.getProfileViewCount(username);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw error;
    }
  };
}

export default ProfileViewsController;
