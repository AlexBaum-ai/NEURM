import { Router } from 'express';
import NotificationController from './notifications.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { authenticate } from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * Notification routes
 * All endpoints require authentication except internal notification creation
 */
const router = Router();

// Initialize controller
const notificationController = new NotificationController();

// ============================================================================
// NOTIFICATION ROUTES
// ============================================================================

/**
 * POST /api/v1/notifications
 * Create a notification (internal use - should be protected with API key in production)
 * Rate limit: 1000 requests per 15 minutes (high limit for internal use)
 */
router.post(
  '/',
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 1000 }),
  asyncHandler(notificationController.createNotification)
);

/**
 * GET /api/v1/notifications
 * Get user's notifications with pagination
 * Rate limit: 100 requests per 15 minutes
 */
router.get(
  '/',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  asyncHandler(notificationController.listNotifications)
);

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count
 * Rate limit: 200 requests per 15 minutes (frequent polling)
 */
router.get(
  '/unread-count',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }),
  asyncHandler(notificationController.getUnreadCount)
);

/**
 * PUT /api/v1/notifications/read-all
 * Mark all notifications as read
 * Rate limit: 10 requests per 15 minutes
 */
router.put(
  '/read-all',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  asyncHandler(notificationController.markAllAsRead)
);

/**
 * PUT /api/v1/notifications/:id/read
 * Mark specific notification as read
 * Rate limit: 100 requests per 15 minutes
 */
router.put(
  '/:id/read',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  asyncHandler(notificationController.markAsRead)
);

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 * Rate limit: 50 requests per 15 minutes
 */
router.delete(
  '/:id',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  asyncHandler(notificationController.deleteNotification)
);

// ============================================================================
// PREFERENCE ROUTES
// ============================================================================

/**
 * GET /api/v1/notifications/preferences
 * Get notification preferences
 * Rate limit: 30 requests per 15 minutes
 */
router.get(
  '/preferences',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  asyncHandler(notificationController.getPreferences)
);

/**
 * PUT /api/v1/notifications/preferences
 * Update notification preferences
 * Rate limit: 10 requests per 15 minutes
 */
router.put(
  '/preferences',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  asyncHandler(notificationController.updatePreferences)
);

// ============================================================================
// DO NOT DISTURB ROUTES
// ============================================================================

/**
 * GET /api/v1/notifications/dnd
 * Get Do Not Disturb schedule
 * Rate limit: 30 requests per 15 minutes
 */
router.get(
  '/dnd',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  asyncHandler(notificationController.getDndSchedule)
);

/**
 * PUT /api/v1/notifications/dnd
 * Update Do Not Disturb schedule
 * Rate limit: 10 requests per 15 minutes
 */
router.put(
  '/dnd',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  asyncHandler(notificationController.updateDndSchedule)
);

// ============================================================================
// PUSH NOTIFICATION ROUTES
// ============================================================================

/**
 * POST /api/v1/notifications/push/subscribe
 * Subscribe to push notifications
 * Rate limit: 10 requests per 15 minutes
 */
router.post(
  '/push/subscribe',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  asyncHandler(notificationController.subscribeToPush)
);

/**
 * DELETE /api/v1/notifications/push/unsubscribe
 * Unsubscribe from push notifications
 * Rate limit: 10 requests per 15 minutes
 */
router.delete(
  '/push/unsubscribe',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  asyncHandler(notificationController.unsubscribeFromPush)
);

/**
 * GET /api/v1/notifications/push/subscriptions
 * Get user's push subscriptions
 * Rate limit: 30 requests per 15 minutes
 */
router.get(
  '/push/subscriptions',
  authenticate,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  asyncHandler(notificationController.getPushSubscriptions)
);

export default router;
