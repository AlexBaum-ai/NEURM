import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import * as Sentry from '@sentry/node';
import { BaseController } from '@/utils/BaseController';
import { FollowsService } from './follows.service';
import {
  createFollowSchema,
  unfollowSchema,
  getFollowingSchema,
  getFollowersSchema,
  getFeedSchema,
  isFollowingSchema,
} from './follows.validation';

export class FollowsController extends BaseController {
  private followsService: FollowsService;

  constructor(prisma: PrismaClient, redis: Redis) {
    super();
    this.followsService = new FollowsService(prisma, redis);
  }

  /**
   * POST /api/follows
   * Create a follow relationship
   */
  createFollow = async (req: Request, res: Response, next: NextFunction) => {
    const span = Sentry.startSpan(
      { name: 'FollowsController.createFollow' },
      async () => {
        try {
          // Validate request body
          const validatedData = createFollowSchema.parse(req.body);

          // Get authenticated user ID
          const userId = (req as any).user?.id;
          if (!userId) {
            return this.unauthorized(res, 'Authentication required');
          }

          // Create follow
          const follow = await this.followsService.createFollow(
            userId,
            validatedData
          );

          return this.created(res, follow, 'Follow created successfully');
        } catch (error: any) {
          if (error.name === 'ZodError') {
            return this.badRequest(res, 'Validation error', error.errors);
          }

          if (error.message.includes('Cannot follow yourself')) {
            return this.badRequest(res, error.message);
          }

          if (error.message.includes('Already following')) {
            return this.conflict(res, error.message);
          }

          if (error.message.includes('not found')) {
            return this.notFound(res, error.message);
          }

          Sentry.captureException(error);
          return this.internalError(res, 'Failed to create follow');
        }
      }
    );
  };

  /**
   * DELETE /api/follows/:id
   * Unfollow an entity
   */
  unfollow = async (req: Request, res: Response, next: NextFunction) => {
    const span = Sentry.startSpan(
      { name: 'FollowsController.unfollow' },
      async () => {
        try {
          // Validate params
          const validatedParams = unfollowSchema.parse({
            id: req.params.id,
          });

          // Get authenticated user ID
          const userId = (req as any).user?.id;
          if (!userId) {
            return this.unauthorized(res, 'Authentication required');
          }

          // Unfollow
          const result = await this.followsService.unfollow(
            userId,
            validatedParams.id
          );

          return this.success(res, result);
        } catch (error: any) {
          if (error.name === 'ZodError') {
            return this.badRequest(res, 'Validation error', error.errors);
          }

          if (error.message.includes('not found')) {
            return this.notFound(res, error.message);
          }

          if (error.message.includes('Unauthorized')) {
            return this.forbidden(res, error.message);
          }

          Sentry.captureException(error);
          return this.internalError(res, 'Failed to unfollow');
        }
      }
    );
  };

  /**
   * GET /api/users/:id/following
   * Get entities a user is following
   */
  getFollowing = async (req: Request, res: Response, next: NextFunction) => {
    const span = Sentry.startSpan(
      { name: 'FollowsController.getFollowing' },
      async () => {
        try {
          // Validate params and query
          const validatedData = getFollowingSchema.parse({
            userId: req.params.id,
            type: req.query.type,
            limit: req.query.limit,
            offset: req.query.offset,
          });

          // Get following list
          const result = await this.followsService.getFollowing(validatedData);

          return this.success(res, result);
        } catch (error: any) {
          if (error.name === 'ZodError') {
            return this.badRequest(res, 'Validation error', error.errors);
          }

          if (error.message.includes('not found')) {
            return this.notFound(res, error.message);
          }

          Sentry.captureException(error);
          return this.internalError(res, 'Failed to get following list');
        }
      }
    );
  };

  /**
   * GET /api/users/:id/followers
   * Get followers of a user
   */
  getFollowers = async (req: Request, res: Response, next: NextFunction) => {
    const span = Sentry.startSpan(
      { name: 'FollowsController.getFollowers' },
      async () => {
        try {
          // Validate params and query
          const validatedData = getFollowersSchema.parse({
            followableType: 'user',
            followableId: req.params.id,
            limit: req.query.limit,
            offset: req.query.offset,
          });

          // Get followers
          const result = await this.followsService.getFollowers(validatedData);

          return this.success(res, result);
        } catch (error: any) {
          if (error.name === 'ZodError') {
            return this.badRequest(res, 'Validation error', error.errors);
          }

          if (error.message.includes('not found')) {
            return this.notFound(res, error.message);
          }

          Sentry.captureException(error);
          return this.internalError(res, 'Failed to get followers');
        }
      }
    );
  };

  /**
   * GET /api/following/feed
   * Get activity feed from followed entities
   */
  getFeed = async (req: Request, res: Response, next: NextFunction) => {
    const span = Sentry.startSpan(
      { name: 'FollowsController.getFeed' },
      async () => {
        try {
          // Get authenticated user ID
          const userId = (req as any).user?.id;
          if (!userId) {
            return this.unauthorized(res, 'Authentication required');
          }

          // Validate query params
          const validatedQuery = getFeedSchema.parse(req.query);

          // Get feed
          const result = await this.followsService.getFollowingFeed(
            userId,
            validatedQuery
          );

          return this.success(res, result);
        } catch (error: any) {
          if (error.name === 'ZodError') {
            return this.badRequest(res, 'Validation error', error.errors);
          }

          Sentry.captureException(error);
          return this.internalError(res, 'Failed to get following feed');
        }
      }
    );
  };

  /**
   * GET /api/follows/check
   * Check if user is following an entity
   */
  checkFollowing = async (req: Request, res: Response, next: NextFunction) => {
    const span = Sentry.startSpan(
      { name: 'FollowsController.checkFollowing' },
      async () => {
        try {
          // Get authenticated user ID
          const userId = (req as any).user?.id;
          if (!userId) {
            return this.unauthorized(res, 'Authentication required');
          }

          // Validate query params
          const validatedQuery = isFollowingSchema.parse(req.query);

          // Check if following
          const isFollowing = await this.followsService.isFollowing(
            userId,
            validatedQuery.followableType,
            validatedQuery.followableId
          );

          return this.success(res, { isFollowing });
        } catch (error: any) {
          if (error.name === 'ZodError') {
            return this.badRequest(res, 'Validation error', error.errors);
          }

          Sentry.captureException(error);
          return this.internalError(res, 'Failed to check following status');
        }
      }
    );
  };

  /**
   * GET /api/:type/:id/followers
   * Get followers of any entity type
   */
  getEntityFollowers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const span = Sentry.startSpan(
      { name: 'FollowsController.getEntityFollowers' },
      async () => {
        try {
          // Map route type to followable type
          const typeMapping: Record<string, string> = {
            companies: 'company',
            tags: 'tag',
            categories: 'category',
            models: 'model',
          };

          const followableType = typeMapping[req.params.type];
          if (!followableType) {
            return this.badRequest(res, 'Invalid entity type');
          }

          // Validate params and query
          const validatedData = getFollowersSchema.parse({
            followableType,
            followableId: req.params.id,
            limit: req.query.limit,
            offset: req.query.offset,
          });

          // Get followers
          const result = await this.followsService.getFollowers(validatedData);

          return this.success(res, result);
        } catch (error: any) {
          if (error.name === 'ZodError') {
            return this.badRequest(res, 'Validation error', error.errors);
          }

          if (error.message.includes('not found')) {
            return this.notFound(res, error.message);
          }

          Sentry.captureException(error);
          return this.internalError(res, 'Failed to get followers');
        }
      }
    );
  };
}
