import { Router } from 'express';
import ArticleRevisionController from './articleRevisions.controller';
import {
  authenticate,
} from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * Article Revision Routes
 * Defines all routes for article revision API endpoints
 */

const router = Router();
const controller = new ArticleRevisionController();

// Rate limiters
const revisionReadLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many revision requests, please try again later',
});

const revisionWriteLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute (restore is a write operation)
  message: 'Too many restore requests, please try again later',
});

// ============================================================================
// REVISION ROUTES (Admin or Author only)
// ============================================================================

/**
 * @route   GET /api/v1/articles/:id/revisions
 * @desc    Get all revisions for an article
 * @access  Admin or article author
 * @param   id - Article UUID
 * @query   limit, offset
 * @returns List of revisions (max 20 per article)
 */
router.get(
  '/:id/revisions',
  revisionReadLimiter,
  authenticate,
  controller.listRevisions
);

/**
 * @route   GET /api/v1/articles/:id/revisions/:revisionId
 * @desc    Get a specific revision by ID
 * @access  Admin or article author
 * @param   id - Article UUID
 * @param   revisionId - Revision UUID
 * @returns Full revision details
 */
router.get(
  '/:id/revisions/:revisionId',
  revisionReadLimiter,
  authenticate,
  controller.getRevision
);

/**
 * @route   GET /api/v1/articles/:id/revisions/compare/:fromRevision/:toRevision
 * @desc    Compare two revisions and show differences
 * @access  Admin or article author
 * @param   id - Article UUID
 * @param   fromRevision - Revision number (earlier)
 * @param   toRevision - Revision number (later)
 * @returns Diff showing changes between revisions
 */
router.get(
  '/:id/revisions/compare/:fromRevision/:toRevision',
  revisionReadLimiter,
  authenticate,
  controller.compareRevisions
);

/**
 * @route   POST /api/v1/articles/:id/revisions/:revisionId/restore
 * @desc    Restore an article to a specific revision
 * @access  Admin or article author
 * @param   id - Article UUID
 * @param   revisionId - Revision UUID
 * @body    changeSummary (optional)
 * @note    Creates a new revision to track the restore action
 */
router.post(
  '/:id/revisions/:revisionId/restore',
  revisionWriteLimiter,
  authenticate,
  controller.restoreRevision
);

export default router;
