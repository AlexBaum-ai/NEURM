import { Router } from 'express';
import { container } from 'tsyringe';
import { TopicController } from '../controllers/TopicController';
import {
  authenticate,
  requireModerator,
  optionalAuth,
} from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * Forum Topic Routes
 * Defines all routes for forum topic API endpoints
 *
 * Public Routes (with optional auth):
 * - GET /api/forum/topics - List topics with filters
 * - GET /api/forum/topics/:id - Get single topic
 *
 * Authenticated Routes:
 * - POST /api/forum/topics - Create topic
 * - PUT /api/forum/topics/:id - Update topic (author or mod)
 * - DELETE /api/forum/topics/:id - Delete topic (author or mod)
 *
 * Moderator Routes:
 * - POST /api/forum/topics/:id/pin - Pin/unpin topic
 * - POST /api/forum/topics/:id/lock - Lock/unlock topic
 */

const router = Router();
const controller = container.resolve(TopicController);

// ============================================================================
// RATE LIMITERS
// ============================================================================

// Public read operations: 100 requests per minute
const publicReadLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
});

// Topic creation limiter: 10 topics per hour per user
const topicCreateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'You can only create 10 topics per hour. Please try again later.',
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

// Topic update limiter: 30 updates per hour
const topicUpdateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many update requests, please try again later',
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

// Moderator actions limiter: 50 actions per hour
const moderatorLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Too many moderator actions, please try again later',
});

// ============================================================================
// PUBLIC ROUTES (with optional authentication)
// ============================================================================

/**
 * @route   GET /api/forum/topics/unanswered
 * @desc    Get unanswered questions with filters and pagination
 * @access  Public
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   categoryId - Filter by category UUID
 * @query   tag - Filter by tag slug
 * @query   dateFrom - Filter by date from (ISO 8601 format)
 * @query   dateTo - Filter by date to (ISO 8601 format)
 * @query   sortBy - Sort field (createdAt, viewCount, voteScore)
 * @query   sortOrder - Sort order (asc, desc)
 * @returns Paginated list of unanswered questions with total count
 * @example GET /api/forum/topics/unanswered?categoryId=xxx&sortBy=viewCount&page=1&limit=20
 */
router.get(
  '/unanswered',
  publicReadLimiter,
  controller.getUnansweredQuestions
);

/**
 * @route   GET /api/forum/topics
 * @desc    List topics with filters and pagination
 * @access  Public (authentication optional for drafts)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   categoryId - Filter by category UUID
 * @query   type - Filter by topic type (discussion, question, showcase, tutorial, announcement, paper)
 * @query   status - Filter by status (open, closed, resolved, archived)
 * @query   authorId - Filter by author UUID
 * @query   tag - Filter by tag slug
 * @query   search - Search in title and content
 * @query   sortBy - Sort field (createdAt, updatedAt, viewCount, replyCount, voteScore)
 * @query   sortOrder - Sort order (asc, desc)
 * @query   includeDrafts - Include draft topics (requires auth, only own drafts)
 * @returns Paginated list of topics with metadata
 * @example GET /api/forum/topics?categoryId=xxx&type=question&page=1&limit=20
 */
router.get(
  '/',
  publicReadLimiter,
  optionalAuth,
  controller.listTopics
);

/**
 * @route   GET /api/forum/topics/:id
 * @desc    Get single topic by ID with all details
 * @access  Public (authentication required for drafts)
 * @param   id - Topic UUID
 * @returns Complete topic with author, category, tags, attachments, poll, and reply count
 * @example GET /api/forum/topics/550e8400-e29b-41d4-a716-446655440000
 */
router.get(
  '/:id',
  publicReadLimiter,
  optionalAuth,
  controller.getTopicById
);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

/**
 * @route   POST /api/forum/topics
 * @desc    Create a new topic
 * @access  Private (authenticated users)
 * @body    title - Topic title (5-255 characters)
 * @body    content - Topic content (10-50000 characters, markdown supported)
 * @body    categoryId - Category UUID
 * @body    type - Topic type (discussion, question, showcase, tutorial, announcement, paper)
 * @body    isDraft - Save as draft (default: false)
 * @body    tags - Array of tag names (max 5, optional)
 * @body    attachments - Array of attachment objects (max 5, 5MB each, optional)
 * @body    poll - Poll object (optional)
 * @returns Created topic with all relations
 * @rateLimit 10 topics per hour per user
 * @example POST /api/forum/topics
 * {
 *   "title": "How to fine-tune GPT-4?",
 *   "content": "I'm trying to fine-tune GPT-4 for my use case...",
 *   "categoryId": "xxx-xxx-xxx",
 *   "type": "question",
 *   "tags": ["fine-tuning", "gpt-4"],
 *   "isDraft": false
 * }
 */
router.post(
  '/',
  authenticate,
  topicCreateLimiter,
  controller.createTopic
);

/**
 * @route   PUT /api/forum/topics/:id
 * @desc    Update topic (author or moderator only)
 * @access  Private (topic author or moderator)
 * @param   id - Topic UUID
 * @body    title - Updated title (optional)
 * @body    content - Updated content (optional)
 * @body    categoryId - Updated category (optional)
 * @body    type - Updated type (optional)
 * @body    isDraft - Updated draft status (optional)
 * @body    tags - Updated tags array (optional)
 * @returns Updated topic
 * @example PUT /api/forum/topics/xxx-xxx-xxx
 * {
 *   "content": "Updated content with more details..."
 * }
 */
router.put(
  '/:id',
  authenticate,
  topicUpdateLimiter,
  controller.updateTopic
);

/**
 * @route   DELETE /api/forum/topics/:id
 * @desc    Delete topic (soft delete, author or moderator only)
 * @access  Private (topic author or moderator)
 * @param   id - Topic UUID
 * @returns Success message
 * @example DELETE /api/forum/topics/xxx-xxx-xxx
 */
router.delete(
  '/:id',
  authenticate,
  controller.deleteTopic
);

// ============================================================================
// MODERATOR ROUTES
// ============================================================================

/**
 * @route   POST /api/forum/topics/:id/pin
 * @desc    Pin or unpin topic (moderator only)
 * @access  Private (moderator or admin)
 * @param   id - Topic UUID
 * @body    isPinned - Pin status (true/false)
 * @returns Updated topic
 * @example POST /api/forum/topics/xxx-xxx-xxx/pin
 * {
 *   "isPinned": true
 * }
 */
router.post(
  '/:id/pin',
  authenticate,
  requireModerator,
  moderatorLimiter,
  controller.pinTopic
);

/**
 * @route   POST /api/forum/topics/:id/lock
 * @desc    Lock or unlock topic (moderator only)
 * @access  Private (moderator or admin)
 * @param   id - Topic UUID
 * @body    isLocked - Lock status (true/false)
 * @returns Updated topic
 * @example POST /api/forum/topics/xxx-xxx-xxx/lock
 * {
 *   "isLocked": true
 * }
 */
router.post(
  '/:id/lock',
  authenticate,
  requireModerator,
  moderatorLimiter,
  controller.lockTopic
);

export default router;
