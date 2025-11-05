import { Router } from 'express';
import categoryRoutes from './categoryRoutes';
import topicRoutes from './topicRoutes';
import replyRoutes from './replyRoutes';
import voteRoutes from './voteRoutes';
import moderationRoutes from './moderationRoutes';
import searchRoutes from './searchRoutes';

/**
 * Forum Routes Index
 *
 * Mounts all forum-related routes under /api/forum
 *
 * Routes:
 * - /api/forum/categories - Category management (SPRINT-4-001)
 * - /api/forum/topics - Topic management (SPRINT-4-003)
 * - /api/forum (reply routes) - Reply management (SPRINT-4-006)
 * - /api/forum/votes - Vote management (SPRINT-4-008)
 *   - POST /api/forum/topics/:id/vote - Vote on topic
 *   - POST /api/forum/replies/:id/vote - Vote on reply
 *   - GET /api/forum/votes/me - Get user's votes
 * - /api/forum/* - Moderation operations (SPRINT-5-001)
 *   - POST /api/forum/topics/:id/pin - Pin/unpin topic
 *   - POST /api/forum/topics/:id/lock - Lock/unlock topic
 *   - PUT /api/forum/topics/:id/move - Move topic to category
 *   - POST /api/forum/topics/:id/merge - Merge topics
 *   - DELETE /api/forum/topics/:id - Hard delete topic (admin)
 *   - POST /api/forum/users/:id/warn - Warn user
 *   - POST /api/forum/users/:id/suspend - Suspend user
 *   - POST /api/forum/users/:id/ban - Ban user (admin)
 *   - GET /api/forum/moderation/logs - View moderation logs
 * - /api/forum/search - Search functionality (SPRINT-5-005)
 *   - GET /api/forum/search - Search topics and replies
 *   - GET /api/forum/search/suggest - Autocomplete suggestions
 *   - GET /api/forum/search/popular - Popular queries
 *   - GET /api/forum/search/history - Search history
 *   - POST /api/forum/search/saved - Saved searches
 */

const router = Router();

// Mount category routes
router.use('/categories', categoryRoutes);

// Mount topic routes
router.use('/topics', topicRoutes);

// Mount reply routes (topics/:topicId/replies and replies/:id)
router.use('/', replyRoutes);

// Mount vote routes
router.use('/votes', voteRoutes);

// Mount moderation routes (SPRINT-5-001)
router.use('/', moderationRoutes);

// Mount search routes (SPRINT-5-005)
router.use('/search', searchRoutes);

// Mount report routes (SPRINT-5-003)
import reportRoutes from './reportRoutes';
router.use('/reports', reportRoutes);

// TODO: Mount other forum routes when implemented
// router.use('/tags', tagRoutes);

export default router;
