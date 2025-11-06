import { Router } from 'express';
import { container } from 'tsyringe';
import { ContentModerationController } from '../controllers/contentModerationController';
import { authenticate, requireModerator, requireAdmin } from '@/middleware/auth.middleware';

/**
 * Content Moderation Routes
 *
 * Unified content moderation for all content types:
 * - Articles, Topics, Replies, Jobs
 *
 * All endpoints require authentication + moderator/admin role
 */

const router = Router();
const contentModerationController = container.resolve(ContentModerationController);

// ============================================================================
// CONTENT LISTING ROUTES
// ============================================================================

/**
 * GET /api/admin/content
 * List all content for moderation with filters
 * Requires: Moderator
 */
router.get(
  '/',
  authenticate,
  requireModerator,
  contentModerationController.listContent
);

/**
 * GET /api/admin/content/reported
 * List reported content queue
 * Requires: Moderator
 */
router.get(
  '/reported',
  authenticate,
  requireModerator,
  contentModerationController.listReportedContent
);

// ============================================================================
// CONTENT ACTION ROUTES
// ============================================================================

/**
 * PUT /api/admin/content/:type/:id/approve
 * Approve content
 * Requires: Moderator
 */
router.put(
  '/:type/:id/approve',
  authenticate,
  requireModerator,
  contentModerationController.approveContent
);

/**
 * PUT /api/admin/content/:type/:id/reject
 * Reject content with reason
 * Requires: Moderator
 */
router.put(
  '/:type/:id/reject',
  authenticate,
  requireModerator,
  contentModerationController.rejectContent
);

/**
 * PUT /api/admin/content/:type/:id/hide
 * Hide content from public view
 * Requires: Moderator
 */
router.put(
  '/:type/:id/hide',
  authenticate,
  requireModerator,
  contentModerationController.hideContent
);

/**
 * DELETE /api/admin/content/:type/:id
 * Delete content (soft delete by moderator, hard delete by admin)
 * Requires: Moderator (soft delete), Admin (hard delete)
 */
router.delete(
  '/:type/:id',
  authenticate,
  requireModerator,
  contentModerationController.deleteContent
);

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * POST /api/admin/content/bulk
 * Perform bulk action on multiple content items
 * Requires: Moderator
 */
router.post(
  '/bulk',
  authenticate,
  requireModerator,
  contentModerationController.bulkAction
);

export default router;
