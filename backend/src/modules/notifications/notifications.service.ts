import { NotificationType, DeliveryChannel, NotificationFrequency } from '@prisma/client';
import NotificationRepository from './notifications.repository';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { CreateNotificationInput, ListNotificationsQuery } from './notifications.validation';

/**
 * NotificationService
 * Business logic for notifications including smart bundling, DND checking, and delivery
 */
export class NotificationService {
  private repository: NotificationRepository;

  constructor(repository?: NotificationRepository) {
    this.repository = repository || new NotificationRepository();
  }

  // ============================================================================
  // NOTIFICATION OPERATIONS
  // ============================================================================

  /**
   * Create a notification with smart bundling
   * If a similar notification exists within the bundling window, increment the count
   */
  async createNotification(data: CreateNotificationInput) {
    try {
      // Check if user is in Do Not Disturb mode
      const isDnd = await this.isUserInDndMode(data.userId);

      if (isDnd && !this.isSystemCriticalNotification(data.type)) {
        logger.info(`Skipping notification for user ${data.userId} - in DND mode`);
        return null;
      }

      // Check user preferences
      const shouldDeliver = await this.shouldDeliverNotification(
        data.userId,
        data.type,
        data.deliveryChannels || ['in_app']
      );

      if (!shouldDeliver.in_app && !shouldDeliver.email && !shouldDeliver.push) {
        logger.info(`Skipping notification for user ${data.userId} - all channels disabled`);
        return null;
      }

      // Filter delivery channels based on preferences
      const enabledChannels = data.deliveryChannels?.filter(
        (channel) => shouldDeliver[channel]
      ) || [];

      // Generate bundle key for smart bundling
      const bundleKey = this.generateBundleKey(data.type, data.referenceId);

      // Check if we should bundle with an existing notification
      const existingNotification = await this.repository.findRecentByBundleKey(
        data.userId,
        bundleKey,
        60 // Bundle within 1 hour
      );

      if (existingNotification && this.isBundleable(data.type)) {
        // Update existing notification's bundle count
        const updatedNotification = await this.repository.updateBundleCount(
          existingNotification.id,
          existingNotification.bundleCount + 1
        );

        logger.info(
          `Bundled notification for user ${data.userId}, type ${data.type}, count: ${updatedNotification.bundleCount}`
        );

        // Trigger delivery for bundled notification
        await this.deliverNotification(updatedNotification);

        return updatedNotification;
      }

      // Create new notification
      const notification = await this.repository.createNotification({
        ...data,
        bundleKey,
        deliveryChannels: enabledChannels.length > 0 ? enabledChannels : ['in_app'],
      });

      logger.info(`Created notification ${notification.id} for user ${data.userId}`);

      // Trigger delivery
      await this.deliverNotification(notification);

      return notification;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'createNotification' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * List notifications for a user
   */
  async listNotifications(userId: string, query: ListNotificationsQuery) {
    try {
      return await this.repository.listNotifications(userId, query);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'listNotifications' },
        extra: { userId, query },
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    try {
      return await this.repository.markAsRead(id, userId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new NotFoundError('Notification not found');
      }

      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'markAsRead' },
        extra: { id, userId },
      });
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    try {
      const count = await this.repository.markAllAsRead(userId);
      logger.info(`Marked ${count} notifications as read for user ${userId}`);
      return count;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'markAllAsRead' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string, userId: string) {
    try {
      return await this.repository.deleteNotification(id, userId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new NotFoundError('Notification not found');
      }

      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'deleteNotification' },
        extra: { id, userId },
      });
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    try {
      return await this.repository.getUnreadCount(userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'getUnreadCount' },
        extra: { userId },
      });
      throw error;
    }
  }

  // ============================================================================
  // NOTIFICATION PREFERENCE OPERATIONS
  // ============================================================================

  /**
   * Get user's notification preferences
   */
  async getPreferences(userId: string) {
    try {
      return await this.repository.getPreferences(userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'getPreferences' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Array<{
      notificationType: NotificationType;
      channel: DeliveryChannel;
      frequency: NotificationFrequency;
      enabled: boolean;
    }>
  ) {
    try {
      const prefsWithUserId = preferences.map((pref) => ({
        userId,
        ...pref,
      }));

      await this.repository.batchUpsertPreferences(prefsWithUserId);

      logger.info(`Updated ${preferences.length} notification preferences for user ${userId}`);

      return await this.repository.getPreferences(userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'updatePreferences' },
        extra: { userId, count: preferences.length },
      });
      throw error;
    }
  }

  // ============================================================================
  // DO NOT DISTURB OPERATIONS
  // ============================================================================

  /**
   * Get user's DND schedule
   */
  async getDndSchedule(userId: string) {
    try {
      return await this.repository.getDndSchedule(userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'getDndSchedule' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Update DND schedule
   */
  async updateDndSchedule(
    userId: string,
    data: {
      startTime: string;
      endTime: string;
      days: number[];
      enabled: boolean;
      timezone: string;
    }
  ) {
    try {
      const schedule = await this.repository.upsertDndSchedule({
        userId,
        ...data,
      });

      logger.info(`Updated DND schedule for user ${userId}`);

      return schedule;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'updateDndSchedule' },
        extra: { userId, data },
      });
      throw error;
    }
  }

  /**
   * Check if user is in Do Not Disturb mode
   */
  async isUserInDndMode(userId: string): Promise<boolean> {
    try {
      const schedule = await this.repository.getDndSchedule(userId);

      if (!schedule || !schedule.enabled) {
        return false;
      }

      const now = new Date();
      const userTimezone = schedule.timezone || 'UTC';

      // Convert current time to user's timezone
      const currentTime = now.toLocaleTimeString('en-US', {
        timeZone: userTimezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

      // Check if current day is in the DND days array
      if (schedule.days.length > 0 && !schedule.days.includes(currentDay)) {
        return false;
      }

      // Check if current time is within DND hours
      const isInDndTime = this.isTimeInRange(currentTime, schedule.startTime, schedule.endTime);

      return isInDndTime;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'isUserInDndMode' },
        extra: { userId },
      });
      // On error, don't block notifications
      return false;
    }
  }

  // ============================================================================
  // PUSH SUBSCRIPTION OPERATIONS
  // ============================================================================

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(
    userId: string,
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    },
    userAgent?: string
  ) {
    try {
      // Check if subscription already exists
      const existing = await this.repository.findPushSubscriptionByEndpoint(subscription.endpoint);

      if (existing) {
        // Update last used timestamp
        return await this.repository.updatePushSubscriptionLastUsed(existing.id);
      }

      // Create new subscription
      const pushSubscription = await this.repository.createPushSubscription({
        userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        userAgent,
      });

      logger.info(`Created push subscription for user ${userId}`);

      return pushSubscription;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'subscribeToPush' },
        extra: { userId, endpoint: subscription.endpoint },
      });
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(endpoint: string) {
    try {
      return await this.repository.deletePushSubscriptionByEndpoint(endpoint);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new NotFoundError('Push subscription not found');
      }

      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'unsubscribeFromPush' },
        extra: { endpoint },
      });
      throw error;
    }
  }

  /**
   * Get user's push subscriptions
   */
  async getPushSubscriptions(userId: string) {
    try {
      return await this.repository.getPushSubscriptions(userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'NotificationService', method: 'getPushSubscriptions' },
        extra: { userId },
      });
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Generate bundle key for notification bundling
   */
  private generateBundleKey(type: NotificationType, referenceId?: string): string {
    if (referenceId) {
      return `${type}:${referenceId}`;
    }
    return type;
  }

  /**
   * Check if notification type is bundleable
   */
  private isBundleable(type: NotificationType): boolean {
    const bundleableTypes: NotificationType[] = [
      'topic_reply',
      'comment_reply',
      'upvote',
      'new_follower',
      'profile_view',
    ];

    return bundleableTypes.includes(type);
  }

  /**
   * Check if notification is system critical (bypasses DND)
   */
  private isSystemCriticalNotification(type: NotificationType): boolean {
    const criticalTypes: NotificationType[] = ['system_announcement', 'account_update'];

    return criticalTypes.includes(type);
  }

  /**
   * Check if notification should be delivered based on user preferences
   */
  private async shouldDeliverNotification(
    userId: string,
    type: NotificationType,
    channels: DeliveryChannel[]
  ): Promise<{ in_app: boolean; email: boolean; push: boolean }> {
    try {
      const preferences = await this.repository.getPreferences(userId);

      const result = {
        in_app: true, // In-app is always enabled by default
        email: false,
        push: false,
      };

      for (const channel of channels) {
        const pref = preferences.find(
          (p) => p.notificationType === type && p.channel === channel
        );

        if (pref) {
          if (channel === 'in_app') {
            result.in_app = pref.enabled;
          } else if (channel === 'email') {
            // Check frequency for email
            result.email = pref.enabled && pref.frequency !== 'off';
          } else if (channel === 'push') {
            result.push = pref.enabled;
          }
        } else {
          // No preference set, use defaults
          if (channel === 'email') {
            result.email = true; // Email enabled by default
          } else if (channel === 'push') {
            result.push = true; // Push enabled by default
          }
        }
      }

      return result;
    } catch (error) {
      logger.error('Error checking notification preferences:', error);
      // On error, deliver to in-app only
      return { in_app: true, email: false, push: false };
    }
  }

  /**
   * Check if time is within range (handles overnight ranges)
   */
  private isTimeInRange(current: string, start: string, end: string): boolean {
    const currentMinutes = this.timeToMinutes(current);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes <= endMinutes) {
      // Normal range (e.g., 09:00 - 17:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range (e.g., 22:00 - 08:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Deliver notification through enabled channels
   * This method enqueues jobs for email and push delivery
   */
  private async deliverNotification(notification: any): Promise<void> {
    try {
      const channels = notification.deliveryChannels || ['in_app'];

      // In-app notification is already stored in DB, no additional action needed

      // Enqueue email delivery job
      if (channels.includes('email')) {
        // TODO: Add to email queue
        logger.info(`Enqueuing email delivery for notification ${notification.id}`);
      }

      // Enqueue push notification job
      if (channels.includes('push')) {
        // TODO: Add to push queue
        logger.info(`Enqueuing push delivery for notification ${notification.id}`);
      }
    } catch (error) {
      logger.error('Error delivering notification:', error);
      // Don't throw - delivery failures shouldn't break notification creation
    }
  }
}

export default NotificationService;
