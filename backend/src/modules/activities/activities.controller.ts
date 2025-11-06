import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import * as Sentry from '@sentry/node';
import { BaseController } from '@/utils/BaseController';
import { ActivitiesService } from './activities.service';
import {
  createActivitySchema,
  getUserActivitySchema,
  getFollowingFeedSchema,
} from './activities.validation';

export class ActivitiesController extends BaseController {
  private activitiesService: ActivitiesService;

  constructor(prisma: PrismaClient, redis: Redis) {
    super();
    this.activitiesService = new ActivitiesService(prisma, redis);
  }

  /**
   * POST /api/activities
   * Create a new activity (typically called internally, not exposed publicly)
   */
  createActivity = async (req: Request, res: Response, next: NextFunction) => {
    const span = Sentry.startSpan(
      { name: 'ActivitiesController.createActivity' },
      async () => {
        try {
          // Validate request body
          const validatedData = createActivitySchema.parse(req.body);

          // Get authenticated user ID
          const userId = (req as any).user?.id;
          if (!userId) {
            return this.unauthorized(res, 'Authentication required');
          }

          // Create activity
          const activity = await this.activitiesService.createActivity(
            userId,
            validatedData
          );

          return this.created(res, activity, 'Activity created successfully');
        } catch (error: any) {
          if (error.name === 'ZodError') {
            return this.badRequest(res, 'Validation error', error.errors);
          }

          Sentry.captureException(error);
          return this.internalError(res, 'Failed to create activity');
        }
      }
    );
  };

  /**
   * GET /api/users/:username/activity
   * Get activity feed for a specific user
   */
  getUserActivity = async (req: Request, res: Response, next: NextFunction) => {
    const span = Sentry.startSpan(
      { name: 'ActivitiesController.getUserActivity' },
      async () => {
        try {
          // Validate params and query
          const validatedInput = getUserActivitySchema.parse({
            username: req.params.username,
            type: req.query.type,
            limit: req.query.limit,
            offset: req.query.offset,
          });

          // Get viewer ID if authenticated
          const viewerId = (req as any).user?.id;

          // Get activities
          const result = await this.activitiesService.getUserActivities(
            validatedInput,
            viewerId
          );

          return this.success(res, result);
        } catch (error: any) {
          if (error.name === 'ZodError') {
            return this.badRequest(res, 'Validation error', error.errors);
          }

          if (error.message === 'User not found') {
            return this.notFound(res, 'User not found');
          }

          Sentry.captureException(error);
          return this.internalError(res, 'Failed to fetch user activities');
        }
      }
    );
  };

  /**
   * GET /api/following/feed
   * Get activity feed from followed users
   */
  getFollowingFeed = async (req: Request, res: Response, next: NextFunction) => {
    const span = Sentry.startSpan(
      { name: 'ActivitiesController.getFollowingFeed' },
      async () => {
        try {
          // Validate query
          const validatedInput = getFollowingFeedSchema.parse({
            type: req.query.type,
            limit: req.query.limit,
            offset: req.query.offset,
          });

          // Get authenticated user ID
          const userId = (req as any).user?.id;
          if (!userId) {
            return this.unauthorized(res, 'Authentication required');
          }

          // Get following feed
          const result = await this.activitiesService.getFollowingFeed(
            userId,
            validatedInput
          );

          return this.success(res, result);
        } catch (error: any) {
          if (error.name === 'ZodError') {
            return this.badRequest(res, 'Validation error', error.errors);
          }

          Sentry.captureException(error);
          return this.internalError(res, 'Failed to fetch following feed');
        }
      }
    );
  };
}
