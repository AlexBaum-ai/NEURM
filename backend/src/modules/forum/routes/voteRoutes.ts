import { Router } from 'express';
import { container } from 'tsyringe';
import { VoteController } from '../controllers/VoteController';
import { authenticate } from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * Forum Vote Routes
 * Defines all routes for forum voting system
 *
 * Vote Features:
 * - Upvote (+1), downvote (-1), or remove vote (0)
 * - One vote per user per item (upsert behavior)
 * - Daily vote limit: 50 per user
 * - Minimum reputation 50 to downvote
 * - Prevents self-voting
 * - Auto-hides posts with score <= -5
 * - Updates author reputation (+10 upvote, -5 downvote)
 *
 * Authenticated Routes:
 * - POST /api/forum/topics/:id/vote - Vote on topic
 * - POST /api/forum/replies/:id/vote - Vote on reply
 * - GET /api/forum/votes/me - Get user's vote history
 */

const router = Router();
const controller = container.resolve(VoteController);

// ============================================================================
// RATE LIMITERS
// ============================================================================

/**
 * Vote limiter: 60 votes per minute (allows rapid voting but prevents abuse)
 * Note: Daily limit of 50 is enforced in business logic
 */
const voteLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: 'Too many vote requests, please slow down',
});

/**
 * Vote history limiter: 30 requests per minute
 */
const voteHistoryLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many requests, please try again later',
});

// ============================================================================
// VOTE ROUTES (all require authentication)
// ============================================================================

/**
 * @route   POST /api/forum/topics/:id/vote
 * @desc    Vote on a topic
 * @access  Private (authenticated users)
 * @param   id - Topic UUID
 * @body    vote - Vote value: 1 (upvote), -1 (downvote), 0 (remove)
 * @returns Vote result with updated counts and score
 * @rateLimit 60 votes per minute per user
 * @dailyLimit 50 votes per day per user (enforced in service)
 *
 * Rules:
 * - Cannot vote on own topics
 * - Cannot vote on locked topics
 * - Downvote requires 50+ reputation
 * - One vote per user per topic (upsert behavior)
 * - Topics with score <= -5 are auto-hidden
 * - Author receives +10 reputation for upvote, -5 for downvote
 *
 * @example POST /api/forum/topics/550e8400-e29b-41d4-a716-446655440000/vote
 * {
 *   "vote": 1
 * }
 *
 * @returns
 * {
 *   "success": true,
 *   "data": {
 *     "success": true,
 *     "voteScore": 15,
 *     "upvoteCount": 18,
 *     "downvoteCount": 3,
 *     "userVote": 1,
 *     "hidden": false
 *   },
 *   "message": "Upvoted topic successfully"
 * }
 */
router.post(
  '/topics/:id/vote',
  authenticate,
  voteLimiter,
  controller.voteOnTopic
);

/**
 * @route   POST /api/forum/replies/:id/vote
 * @desc    Vote on a reply
 * @access  Private (authenticated users)
 * @param   id - Reply UUID
 * @body    vote - Vote value: 1 (upvote), -1 (downvote), 0 (remove)
 * @returns Vote result with updated counts and score
 * @rateLimit 60 votes per minute per user
 * @dailyLimit 50 votes per day per user (enforced in service)
 *
 * Rules:
 * - Cannot vote on own replies
 * - Cannot vote on deleted replies
 * - Cannot vote on replies in locked topics
 * - Downvote requires 50+ reputation
 * - One vote per user per reply (upsert behavior)
 * - Replies with score <= -5 are auto-hidden
 * - Author receives +10 reputation for upvote, -5 for downvote
 *
 * @example POST /api/forum/replies/550e8400-e29b-41d4-a716-446655440000/vote
 * {
 *   "vote": -1
 * }
 *
 * @returns
 * {
 *   "success": true,
 *   "data": {
 *     "success": true,
 *     "voteScore": -2,
 *     "upvoteCount": 5,
 *     "downvoteCount": 7,
 *     "userVote": -1,
 *     "hidden": false
 *   },
 *   "message": "Downvoted reply successfully"
 * }
 */
router.post(
  '/replies/:id/vote',
  authenticate,
  voteLimiter,
  controller.voteOnReply
);

/**
 * @route   GET /api/forum/votes/me
 * @desc    Get current user's vote history
 * @access  Private (authenticated users)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   type - Filter by type: 'topic' or 'reply' (optional)
 * @returns Paginated list of user's votes
 * @rateLimit 30 requests per minute
 *
 * @example GET /api/forum/votes/me?page=1&limit=20&type=topic
 *
 * @returns
 * {
 *   "success": true,
 *   "data": {
 *     "votes": [
 *       {
 *         "id": "topic-uuid",
 *         "type": "topic",
 *         "targetId": "topic-uuid",
 *         "targetTitle": "How to fine-tune GPT-4?",
 *         "value": 1,
 *         "votedAt": "2024-11-05T10:30:00Z"
 *       },
 *       {
 *         "id": "reply-uuid",
 *         "type": "reply",
 *         "targetId": "reply-uuid",
 *         "targetTitle": "Reply in: Best practices for prompt engineering",
 *         "value": -1,
 *         "votedAt": "2024-11-05T09:15:00Z"
 *       }
 *     ],
 *     "pagination": {
 *       "page": 1,
 *       "limit": 20,
 *       "total": 45,
 *       "totalPages": 3
 *     }
 *   }
 * }
 */
router.get(
  '/me',
  authenticate,
  voteHistoryLimiter,
  controller.getUserVotes
);

export default router;
