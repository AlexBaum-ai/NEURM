import { Router } from 'express';
import { container } from 'tsyringe';
import { ReportController } from '../controllers/ReportController';
import {
  authenticate,
  requireModerator,
} from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * Forum Report Routes
 * Defines all routes for content reporting API endpoints
 *
 * Authenticated Routes:
 * - POST /api/forum/reports - Create report (any authenticated user)
 *
 * Moderator Routes:
 * - GET /api/forum/reports - List reports (moderation queue)
 * - GET /api/forum/reports/statistics - Get report statistics
 * - GET /api/forum/reports/:id - Get report details
 * - PUT /api/forum/reports/:id/resolve - Resolve report
 */

const router = Router();
const controller = container.resolve(ReportController);

// ============================================================================
// RATE LIMITERS
// ============================================================================

// Report creation limiter: 10 reports per hour per user
// This prevents abuse of the reporting system
const reportCreateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'You can only create 10 reports per hour. Please try again later.',
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

// Moderator actions limiter: 100 actions per hour
const moderatorLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
});

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

/**
 * @route   POST /api/forum/reports
 * @desc    Create a new report
 * @access  Private (authenticated users)
 * @body    reportableType - Type of content being reported (Topic or Reply)
 * @body    reportableId - UUID of the content being reported
 * @body    reason - Report reason (spam, harassment, off_topic, misinformation, copyright)
 * @body    description - Optional detailed description (10-1000 characters)
 * @returns Created report with reporter info
 * @rateLimit 10 reports per hour per user
 * @example POST /api/forum/reports
 * {
 *   "reportableType": "Topic",
 *   "reportableId": "550e8400-e29b-41d4-a716-446655440000",
 *   "reason": "spam",
 *   "description": "This topic contains spam links to external sites"
 * }
 */
router.post(
  '/',
  authenticate,
  reportCreateLimiter,
  controller.createReport
);

// ============================================================================
// MODERATOR ROUTES
// ============================================================================

/**
 * @route   GET /api/forum/reports/statistics
 * @desc    Get report statistics (total, pending, resolved, by reason)
 * @access  Private (moderator or admin)
 * @returns Report statistics object
 * @example GET /api/forum/reports/statistics
 * Response:
 * {
 *   "statistics": {
 *     "total": 150,
 *     "pending": 12,
 *     "reviewing": 3,
 *     "resolved": 135,
 *     "byReason": [
 *       { "reason": "spam", "count": 50 },
 *       { "reason": "harassment", "count": 30 },
 *       ...
 *     ]
 *   }
 * }
 */
router.get(
  '/statistics',
  authenticate,
  requireModerator,
  moderatorLimiter,
  controller.getStatistics
);

/**
 * @route   GET /api/forum/reports
 * @desc    List all reports (moderation queue)
 * @access  Private (moderator or admin)
 * @query   status - Filter by status (pending, reviewing, resolved_violation, resolved_no_action, dismissed)
 * @query   reason - Filter by reason (spam, harassment, off_topic, misinformation, copyright)
 * @query   reportableType - Filter by content type (Topic, Reply)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   sortBy - Sort field (createdAt, status, reason)
 * @query   sortOrder - Sort order (asc, desc)
 * @returns Paginated list of reports with content previews
 * @example GET /api/forum/reports?status=pending&page=1&limit=20
 */
router.get(
  '/',
  authenticate,
  requireModerator,
  moderatorLimiter,
  controller.listReports
);

/**
 * @route   GET /api/forum/reports/:id
 * @desc    Get single report with full details
 * @access  Private (moderator or admin)
 * @param   id - Report UUID
 * @returns Complete report with reported content and related reports
 * @example GET /api/forum/reports/550e8400-e29b-41d4-a716-446655440000
 * Response includes:
 * - report: Full report details
 * - content: Complete reported content (topic or reply)
 * - relatedReports: Other reports for the same content
 * - totalReports: Total number of reports for this content
 */
router.get(
  '/:id',
  authenticate,
  requireModerator,
  moderatorLimiter,
  controller.getReportById
);

/**
 * @route   PUT /api/forum/reports/:id/resolve
 * @desc    Resolve a report
 * @access  Private (moderator or admin)
 * @param   id - Report UUID
 * @body    status - Resolution status (resolved_violation, resolved_no_action, dismissed)
 * @body    resolutionNote - Optional note explaining the resolution (5-500 characters)
 * @returns Updated report
 * @example PUT /api/forum/reports/xxx-xxx-xxx/resolve
 * {
 *   "status": "resolved_violation",
 *   "resolutionNote": "Content removed for violating spam policy"
 * }
 */
router.put(
  '/:id/resolve',
  authenticate,
  requireModerator,
  moderatorLimiter,
  controller.resolveReport
);

export default router;
