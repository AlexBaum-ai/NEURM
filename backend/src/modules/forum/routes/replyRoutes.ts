import { Router } from 'express';
import { container } from 'tsyringe';
import { ReplyController } from '../controllers/ReplyController';
import {
  authenticate,
  requireModerator,
  optionalAuth,
} from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * Forum Reply Routes
 * Defines all routes for forum reply API endpoints
 *
 * Public Routes (with optional auth):
 * - GET /api/forum/topics/:topicId/replies - List replies for topic
 * - GET /api/forum/replies/:id - Get single reply
 *
 * Authenticated Routes:
 * - POST /api/forum/topics/:topicId/replies - Create reply
 * - PUT /api/forum/replies/:id - Update reply (author within 15 min or mod)
 * - DELETE /api/forum/replies/:id - Delete reply (author or mod)
 * - POST /api/forum/topics/:topicId/accept-answer - Accept answer (topic author, questions only)
 * - DELETE /api/forum/topics/:topicId/accept-answer - Remove accepted answer
 *
 * Moderator Routes:
 * - GET /api/forum/replies/:id/edit-history - View edit history
 */

const router = Router();
const controller = container.resolve(ReplyController);

// ============================================================================
// RATE LIMITERS
// ============================================================================

// Public read operations: 100 requests per minute
const publicReadLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
});

// Reply creation limiter: 30 replies per hour per user
const replyCreateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'You can only create 30 replies per hour. Please try again later.',
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

// Reply update limiter: 50 updates per hour
const replyUpdateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Too many update requests, please try again later',
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

// Moderator actions limiter: 100 actions per hour
const moderatorLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many moderator actions, please try again later',
});

// ============================================================================
// PUBLIC ROUTES (with optional authentication)
// ============================================================================

/**
 * @route   GET /api/forum/topics/:topicId/replies
 * @desc    Get all replies for a topic with nested structure
 * @access  Public (moderators can see deleted replies)
 * @param   topicId - Topic UUID
 * @query   sort - Sort order (oldest, newest, most_voted) - default: oldest
 * @returns Nested reply tree with up to 3 levels of threading
 * @example GET /api/forum/topics/xxx-xxx-xxx/replies?sort=most_voted
 */
router.get(
  '/topics/:topicId/replies',
  publicReadLimiter,
  optionalAuth,
  controller.getRepliesByTopic
);

/**
 * @route   GET /api/forum/replies/:id
 * @desc    Get single reply by ID
 * @access  Public (moderators can see deleted replies)
 * @param   id - Reply UUID
 * @returns Reply with author info, quoted reply, and child reply count
 * @example GET /api/forum/replies/xxx-xxx-xxx
 */
router.get(
  '/replies/:id',
  publicReadLimiter,
  optionalAuth,
  controller.getReplyById
);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

/**
 * @route   POST /api/forum/topics/:topicId/replies
 * @desc    Create a new reply (threaded, max 3 levels)
 * @access  Private (authenticated users)
 * @param   topicId - Topic UUID
 * @body    content - Reply content (10-10000 characters, markdown supported)
 * @body    parentReplyId - Parent reply UUID for threading (optional, max 3 levels)
 * @body    quotedReplyId - Quoted reply UUID for quote functionality (optional)
 * @returns Created reply with author info
 * @rateLimit 30 replies per hour per user
 * @example POST /api/forum/topics/xxx-xxx-xxx/replies
 * {
 *   "content": "Great answer! I'd like to add that @username you can also...",
 *   "parentReplyId": "yyy-yyy-yyy",
 *   "quotedReplyId": "zzz-zzz-zzz"
 * }
 */
router.post(
  '/topics/:topicId/replies',
  authenticate,
  replyCreateLimiter,
  controller.createReply
);

/**
 * @route   PUT /api/forum/replies/:id
 * @desc    Update reply (author within 15 min or moderator)
 * @access  Private (reply author within 15 min or moderator)
 * @param   id - Reply UUID
 * @body    content - Updated content (10-10000 characters)
 * @body    editReason - Reason for editing (optional, visible to moderators)
 * @returns Updated reply
 * @rateLimit 50 updates per hour
 * @example PUT /api/forum/replies/xxx-xxx-xxx
 * {
 *   "content": "Updated content with correction...",
 *   "editReason": "Fixed typo"
 * }
 */
router.put(
  '/replies/:id',
  authenticate,
  replyUpdateLimiter,
  controller.updateReply
);

/**
 * @route   DELETE /api/forum/replies/:id
 * @desc    Delete reply (soft delete, author or moderator)
 * @access  Private (reply author or moderator)
 * @param   id - Reply UUID
 * @returns Success message
 * @example DELETE /api/forum/replies/xxx-xxx-xxx
 */
router.delete(
  '/replies/:id',
  authenticate,
  controller.deleteReply
);

/**
 * @route   POST /api/forum/topics/:topicId/accept-answer
 * @desc    Mark reply as accepted answer (topic author only, question topics only)
 * @access  Private (topic author)
 * @param   topicId - Topic UUID
 * @body    replyId - Reply UUID to mark as accepted
 * @returns Success message
 * @example POST /api/forum/topics/xxx-xxx-xxx/accept-answer
 * {
 *   "replyId": "yyy-yyy-yyy"
 * }
 */
router.post(
  '/topics/:topicId/accept-answer',
  authenticate,
  controller.acceptAnswer
);

/**
 * @route   DELETE /api/forum/topics/:topicId/accept-answer
 * @desc    Remove accepted answer mark
 * @access  Private (topic author)
 * @param   topicId - Topic UUID
 * @returns Success message
 * @example DELETE /api/forum/topics/xxx-xxx-xxx/accept-answer
 */
router.delete(
  '/topics/:topicId/accept-answer',
  authenticate,
  controller.removeAcceptedAnswer
);

// ============================================================================
// MODERATOR ROUTES
// ============================================================================

/**
 * @route   GET /api/forum/replies/:id/edit-history
 * @desc    Get edit history for a reply (moderators only)
 * @access  Private (moderator or admin)
 * @param   id - Reply UUID
 * @returns Array of edit history records with previous content and edit reasons
 * @example GET /api/forum/replies/xxx-xxx-xxx/edit-history
 */
router.get(
  '/replies/:id/edit-history',
  authenticate,
  requireModerator,
  moderatorLimiter,
  controller.getEditHistory
);

export default router;
