import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import recommendationsController from './recommendations.controller';
import { rateLimiterMiddleware } from '@/middleware/rateLimiter.middleware';

/**
 * Recommendation Routes
 *
 * All endpoints require authentication.
 * Rate limiting applied to prevent abuse.
 */

const router = Router();

/**
 * GET /api/recommendations
 * Get personalized recommendations for authenticated user
 *
 * Query Parameters:
 * - types: Comma-separated list of types (article, forum_topic, job, user)
 * - limit: Number of recommendations (1-100, default 20)
 * - excludeIds: Comma-separated list of IDs to exclude
 * - includeExplanations: Boolean (default true)
 *
 * Rate Limit: 30 requests per 5 minutes
 */
router.get(
  '/',
  authMiddleware,
  rateLimiterMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30,
    message: 'Too many recommendation requests, please try again later.',
  }),
  recommendationsController.getRecommendations
);

/**
 * POST /api/recommendations/feedback
 * Submit feedback on a recommendation
 *
 * Body:
 * - itemType: 'article' | 'forum_topic' | 'job' | 'user'
 * - itemId: UUID
 * - feedback: 'like' | 'dislike' | 'dismiss' | 'not_interested'
 *
 * Rate Limit: 60 requests per 5 minutes
 */
router.post(
  '/feedback',
  authMiddleware,
  rateLimiterMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 60,
    message: 'Too many feedback submissions, please try again later.',
  }),
  recommendationsController.submitFeedback
);

export default router;
