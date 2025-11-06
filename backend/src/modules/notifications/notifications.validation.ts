import { z } from 'zod';

/**
 * Notifications Validation Schemas
 * Following Zod best practices for type-safe validation
 */

// ============================================================================
// ENUMS
// ============================================================================

export const NotificationTypeSchema = z.enum([
  // News notifications
  'new_article_in_followed_category',
  'trending_article',

  // Forum notifications
  'topic_reply',
  'comment_reply',
  'mention',
  'upvote',
  'downvote',
  'accepted_answer',

  // Jobs notifications
  'new_job_match',
  'application_status_update',
  'profile_view',

  // Social notifications
  'new_follower',
  'badge_earned',
  'reputation_milestone',
  'message',

  // System notifications
  'system_announcement',
  'account_update',
]);

export const DeliveryChannelSchema = z.enum(['in_app', 'email', 'push']);

export const NotificationFrequencySchema = z.enum([
  'real_time',
  'hourly_digest',
  'daily_digest',
  'weekly_digest',
  'off',
]);

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Create notification request body (internal use)
 * POST /api/v1/notifications
 */
export const createNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  type: NotificationTypeSchema,
  title: z.string().min(1).max(255, 'Title cannot exceed 255 characters'),
  message: z.string().min(1).max(5000, 'Message cannot exceed 5000 characters'),
  actionUrl: z.string().url('Invalid action URL').max(500).optional(),
  referenceId: z.string().uuid().optional(),
  dataJson: z.record(z.any()).optional(),
  deliveryChannels: z.array(DeliveryChannelSchema).default(['in_app']),
});

/**
 * List notifications query parameters
 * GET /api/v1/notifications
 */
export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: NotificationTypeSchema.optional(),
  unreadOnly: z.coerce.boolean().default(false),
  sortBy: z.enum(['createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Notification ID parameter
 * Used in mark as read/delete endpoints
 */
export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

/**
 * Update notification preferences request body
 * PUT /api/v1/notifications/preferences
 */
export const updateNotificationPreferencesSchema = z.object({
  preferences: z.array(
    z.object({
      notificationType: NotificationTypeSchema,
      channel: DeliveryChannelSchema,
      frequency: NotificationFrequencySchema,
      enabled: z.boolean(),
    })
  ),
});

/**
 * Update do-not-disturb schedule request body
 * PUT /api/v1/notifications/dnd
 */
export const updateDndScheduleSchema = z.object({
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:MM)'),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:MM)'),
  days: z.array(z.number().int().min(0).max(6)).default([]),
  enabled: z.boolean(),
  timezone: z.string().max(50).default('UTC'),
});

/**
 * Subscribe to push notifications request body
 * POST /api/v1/notifications/push/subscribe
 */
export const subscribeToPushSchema = z.object({
  endpoint: z.string().url('Invalid endpoint URL'),
  keys: z.object({
    p256dh: z.string().min(1, 'p256dh key is required'),
    auth: z.string().min(1, 'auth key is required'),
  }),
});

/**
 * Unsubscribe from push notifications request body
 * DELETE /api/v1/notifications/push/unsubscribe
 */
export const unsubscribeFromPushSchema = z.object({
  endpoint: z.string().url('Invalid endpoint URL'),
});

/**
 * Test push notification request body
 * POST /api/v1/notifications/push/test
 */
export const testPushNotificationSchema = z.object({
  endpoint: z.string().url('Invalid endpoint URL').optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;
export type UpdateDndScheduleInput = z.infer<typeof updateDndScheduleSchema>;
export type SubscribeToPushInput = z.infer<typeof subscribeToPushSchema>;
export type UnsubscribeFromPushInput = z.infer<typeof unsubscribeFromPushSchema>;
export type TestPushNotificationInput = z.infer<typeof testPushNotificationSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type DeliveryChannel = z.infer<typeof DeliveryChannelSchema>;
export type NotificationFrequency = z.infer<typeof NotificationFrequencySchema>;
