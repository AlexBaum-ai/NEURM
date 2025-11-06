import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { ActivitiesController } from './activities.controller';
import { authenticate, optionalAuth } from '@/middleware/auth.middleware';

export function createActivitiesRoutes(prisma: PrismaClient, redis: Redis): Router {
  const router = Router();
  const controller = new ActivitiesController(prisma, redis);

  // Get user activity feed (public with optional auth for privacy filtering)
  router.get('/users/:username/activity', optionalAuth, controller.getUserActivity);

  // Get following feed (requires auth)
  router.get('/following/feed', authenticate, controller.getFollowingFeed);

  // Create activity (internal use, requires auth)
  // This endpoint is typically not exposed publicly but used by other modules
  router.post('/activities', authenticate, controller.createActivity);

  return router;
}
