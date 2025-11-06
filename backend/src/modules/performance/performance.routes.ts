import { Router } from 'express';
import performanceController from './performance.controller';
import { authMiddleware, requireRole } from '@/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import rateLimiter from '@/middleware/rateLimiter.middleware';

const router = Router();

/**
 * Performance Monitoring Routes
 * All routes require admin authentication
 */

// Health check - public endpoint
router.get('/health', performanceController.healthCheck.bind(performanceController));

// Admin-only performance monitoring endpoints
router.use(authMiddleware, requireRole([UserRole.admin, UserRole.moderator]));

// Get performance metrics
router.get(
  '/metrics',
  rateLimiter({ maxRequests: 60, windowMs: 60000 }),
  performanceController.getMetrics.bind(performanceController)
);

// Get performance dashboard
router.get(
  '/dashboard',
  rateLimiter({ maxRequests: 30, windowMs: 60000 }),
  performanceController.getDashboard.bind(performanceController)
);

// Get slow queries
router.get(
  '/slow-queries',
  rateLimiter({ maxRequests: 20, windowMs: 60000 }),
  performanceController.getSlowQueries.bind(performanceController)
);

// Get cache statistics
router.get(
  '/cache-stats',
  rateLimiter({ maxRequests: 60, windowMs: 60000 }),
  performanceController.getCacheStats.bind(performanceController)
);

// Get database statistics
router.get(
  '/database-stats',
  rateLimiter({ maxRequests: 30, windowMs: 60000 }),
  performanceController.getDatabaseStats.bind(performanceController)
);

// Get missing indexes recommendations
router.get(
  '/missing-indexes',
  rateLimiter({ maxRequests: 10, windowMs: 60000 }),
  performanceController.getMissingIndexes.bind(performanceController)
);

// Get request rates
router.get(
  '/request-rates',
  rateLimiter({ maxRequests: 60, windowMs: 60000 }),
  performanceController.getRequestRates.bind(performanceController)
);

// Get resource usage
router.get(
  '/resources',
  rateLimiter({ maxRequests: 60, windowMs: 60000 }),
  performanceController.getResourceUsage.bind(performanceController)
);

// Cache management - admin only
router.delete(
  '/cache/:pattern',
  requireRole([UserRole.admin]),
  rateLimiter({ maxRequests: 10, windowMs: 60000 }),
  performanceController.invalidateCache.bind(performanceController)
);

router.delete(
  '/cache/tag/:tag',
  requireRole([UserRole.admin]),
  rateLimiter({ maxRequests: 10, windowMs: 60000 }),
  performanceController.invalidateCacheByTag.bind(performanceController)
);

// Development/testing endpoints - admin only, not in production
if (process.env.NODE_ENV !== 'production') {
  router.post(
    '/gc',
    requireRole([UserRole.admin]),
    performanceController.triggerGarbageCollection.bind(performanceController)
  );

  router.post(
    '/reset',
    requireRole([UserRole.admin]),
    performanceController.resetMetrics.bind(performanceController)
  );
}

export default router;
