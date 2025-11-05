import { Router } from 'express';
import { container } from 'tsyringe';
import { PollController } from '../controllers/PollController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { roleMiddleware } from '../../../middleware/role.middleware';

const router = Router();
const pollController = container.resolve(PollController);

/**
 * Poll Routes
 *
 * Base path: /api/forum/polls
 *
 * Public routes:
 * - GET /api/forum/polls/:id - Get poll results by ID
 * - GET /api/forum/polls/topic/:topicId - Get poll by topic ID
 *
 * Authenticated routes:
 * - POST /api/forum/polls - Create new poll
 * - POST /api/forum/polls/:id/vote - Cast vote on poll
 *
 * Admin/Moderator routes:
 * - DELETE /api/forum/polls/:id - Delete poll
 */

// Public routes - anyone can view poll results
router.get('/:id', pollController.getPollById);
router.get('/:id/results', pollController.getPollResults);
router.get('/topic/:topicId', pollController.getPollByTopicId);

// Authenticated routes - must be logged in
router.post('/', authMiddleware, pollController.createPoll);
router.post('/:id/vote', authMiddleware, pollController.castVote);

// Admin/Moderator routes - requires admin or moderator role
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'moderator']),
  pollController.deletePoll
);

export default router;
