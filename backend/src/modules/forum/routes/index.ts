import { Router } from 'express';
import categoryRoutes from './categoryRoutes';
import topicRoutes from './topicRoutes';
import replyRoutes from './replyRoutes';
import voteRoutes from './voteRoutes';

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

// TODO: Mount other forum routes when implemented
// router.use('/tags', tagRoutes);

export default router;
