import { Router } from 'express';
import PromptController from './prompts.controller';
import { authenticate, optionalAuth } from '@/middleware/auth.middleware';
import {
  apiLimiter,
  contentCreationLimiter,
  voteLimiter,
} from '@/middleware/rateLimiter.middleware';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Prompt routes
 * All routes are prefixed with /api/v1/prompts
 */
const router = Router();
const promptController = new PromptController();

/**
 * @route   GET /api/v1/prompts
 * @desc    List prompts with filters and pagination
 * @access  Public (optional authentication for user-specific data like votes)
 * @query   page, limit, category, useCase, model, search, sort, minRating, tags
 */
router.get(
  '/',
  optionalAuth,
  apiLimiter,
  asyncHandler(promptController.listPrompts)
);

/**
 * @route   GET /api/v1/prompts/:id
 * @desc    Get prompt details by ID
 * @access  Public (optional authentication for user-specific data)
 */
router.get(
  '/:id',
  optionalAuth,
  apiLimiter,
  asyncHandler(promptController.getPromptById)
);

/**
 * @route   POST /api/v1/prompts
 * @desc    Create new prompt
 * @access  Private (requires authentication)
 * @rate    10 requests per hour
 */
router.post(
  '/',
  authenticate,
  contentCreationLimiter,
  asyncHandler(promptController.createPrompt)
);

/**
 * @route   PUT /api/v1/prompts/:id
 * @desc    Update prompt (author only)
 * @access  Private (requires authentication)
 * @rate    10 requests per hour
 */
router.put(
  '/:id',
  authenticate,
  contentCreationLimiter,
  asyncHandler(promptController.updatePrompt)
);

/**
 * @route   DELETE /api/v1/prompts/:id
 * @desc    Delete prompt (author only)
 * @access  Private (requires authentication)
 * @rate    10 requests per hour
 */
router.delete(
  '/:id',
  authenticate,
  contentCreationLimiter,
  asyncHandler(promptController.deletePrompt)
);

/**
 * @route   POST /api/v1/prompts/:id/fork
 * @desc    Fork prompt (create variation)
 * @access  Private (requires authentication)
 * @rate    10 requests per hour
 */
router.post(
  '/:id/fork',
  authenticate,
  contentCreationLimiter,
  asyncHandler(promptController.forkPrompt)
);

/**
 * @route   POST /api/v1/prompts/:id/rate
 * @desc    Rate prompt (1-5 stars)
 * @access  Private (requires authentication)
 * @rate    30 votes per hour
 */
router.post(
  '/:id/rate',
  authenticate,
  voteLimiter,
  asyncHandler(promptController.ratePrompt)
);

/**
 * @route   POST /api/v1/prompts/:id/vote
 * @desc    Vote on prompt (upvote/downvote)
 * @access  Private (requires authentication)
 * @rate    30 votes per hour
 */
router.post(
  '/:id/vote',
  authenticate,
  voteLimiter,
  asyncHandler(promptController.votePrompt)
);

export default router;
