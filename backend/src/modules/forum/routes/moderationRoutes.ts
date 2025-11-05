import { Router } from 'express';
import { container } from 'tsyringe';
import { ModerationController } from '../controllers/ModerationController';
import { authenticate, requireModerator, requireAdmin } from '@/middleware/auth.middleware';

/**
 * Moderation Routes
 *
 * All moderation endpoints require authentication.
 * Most require moderator role, some require admin role.
 */

const router = Router();
const moderationController = container.resolve(ModerationController);

// ============================================================================
// TOPIC MODERATION ROUTES
// ============================================================================

/**
 * POST /api/forum/topics/:id/pin
 * Pin or unpin a topic (moderator)
 */
router.post(
  '/topics/:id/pin',
  authenticate,
  requireModerator,
  moderationController.pinTopic
);

/**
 * POST /api/forum/topics/:id/lock
 * Lock or unlock a topic (moderator)
 */
router.post(
  '/topics/:id/lock',
  authenticate,
  requireModerator,
  moderationController.lockTopic
);

/**
 * PUT /api/forum/topics/:id/move
 * Move topic to different category (moderator)
 */
router.put(
  '/topics/:id/move',
  authenticate,
  requireModerator,
  moderationController.moveTopic
);

/**
 * POST /api/forum/topics/:id/merge
 * Merge duplicate topics (moderator)
 */
router.post(
  '/topics/:id/merge',
  authenticate,
  requireModerator,
  moderationController.mergeTopics
);

/**
 * DELETE /api/forum/topics/:id
 * Hard delete topic (admin only)
 */
router.delete(
  '/topics/:id',
  authenticate,
  requireAdmin,
  moderationController.hardDeleteTopic
);

// ============================================================================
// USER MODERATION ROUTES
// ============================================================================

/**
 * POST /api/forum/users/:id/warn
 * Issue warning to user (moderator)
 */
router.post(
  '/users/:id/warn',
  authenticate,
  requireModerator,
  moderationController.warnUser
);

/**
 * POST /api/forum/users/:id/suspend
 * Suspend user temporarily (moderator)
 */
router.post(
  '/users/:id/suspend',
  authenticate,
  requireModerator,
  moderationController.suspendUser
);

/**
 * POST /api/forum/users/:id/ban
 * Ban user permanently (admin only)
 */
router.post(
  '/users/:id/ban',
  authenticate,
  requireAdmin,
  moderationController.banUser
);

// ============================================================================
// MODERATION LOG ROUTES
// ============================================================================

/**
 * GET /api/forum/moderation/logs
 * Get moderation logs (moderator)
 */
router.get(
  '/moderation/logs',
  authenticate,
  requireModerator,
  moderationController.getModerationLogs
);

export default router;
