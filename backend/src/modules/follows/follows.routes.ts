import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { FollowsController } from './follows.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { rateLimitMiddleware } from '@/middleware/rateLimit.middleware';

export function createFollowsRoutes(prisma: PrismaClient, redis: Redis): Router {
  const router = Router();
  const controller = new FollowsController(prisma, redis);

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * POST /api/follows
   * Create a follow relationship
   * Rate limit: 30 requests per minute
   */
  router.post(
    '/',
    rateLimitMiddleware({ windowMs: 60 * 1000, max: 30 }),
    controller.createFollow
  );

  /**
   * DELETE /api/follows/:id
   * Unfollow an entity
   * Rate limit: 30 requests per minute
   */
  router.delete(
    '/:id',
    rateLimitMiddleware({ windowMs: 60 * 1000, max: 30 }),
    controller.unfollow
  );

  /**
   * GET /api/follows/check
   * Check if user is following an entity
   * Rate limit: 100 requests per minute
   */
  router.get(
    '/check',
    rateLimitMiddleware({ windowMs: 60 * 1000, max: 100 }),
    controller.checkFollowing
  );

  /**
   * GET /api/following/feed
   * Get activity feed from followed entities
   * Rate limit: 30 requests per minute
   */
  router.get(
    '/feed',
    rateLimitMiddleware({ windowMs: 60 * 1000, max: 30 }),
    controller.getFeed
  );

  return router;
}

// User-specific routes (for main router integration)
export function createUserFollowsRoutes(prisma: PrismaClient, redis: Redis): Router {
  const router = Router();
  const controller = new FollowsController(prisma, redis);

  /**
   * GET /api/users/:id/following
   * Get entities a user is following
   * Rate limit: 60 requests per minute
   */
  router.get(
    '/:id/following',
    rateLimitMiddleware({ windowMs: 60 * 1000, max: 60 }),
    controller.getFollowing
  );

  /**
   * GET /api/users/:id/followers
   * Get followers of a user
   * Rate limit: 60 requests per minute
   */
  router.get(
    '/:id/followers',
    rateLimitMiddleware({ windowMs: 60 * 1000, max: 60 }),
    controller.getFollowers
  );

  return router;
}

// Entity-specific routes (for main router integration)
export function createEntityFollowsRoutes(prisma: PrismaClient, redis: Redis): Router {
  const router = Router();
  const controller = new FollowsController(prisma, redis);

  /**
   * GET /api/:type/:id/followers
   * Get followers of any entity (companies, tags, categories, models)
   * Rate limit: 60 requests per minute
   */
  router.get(
    '/:type/:id/followers',
    rateLimitMiddleware({ windowMs: 60 * 1000, max: 60 }),
    controller.getEntityFollowers
  );

  return router;
}
