import { Router } from 'express';
import { container } from 'tsyringe';
import { ReputationController } from '../controllers/ReputationController';
import { createRateLimiter } from '@/middleware/rateLimiter';

/**
 * Reputation Routes
 *
 * Endpoints for reputation system:
 * - GET /api/users/:userId/reputation - Get user reputation
 *
 * Rate Limits:
 * - Read operations: 100 requests per 15 minutes
 */

const router = Router();
const reputationController = container.resolve(ReputationController);

// Rate limiters
const readLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
});

/**
 * @route   GET /api/users/:userId/reputation
 * @desc    Get user reputation with breakdown and history
 * @access  Public
 */
router.get(
  '/users/:userId/reputation',
  readLimiter,
  reputationController.getUserReputation.bind(reputationController)
);

export default router;
