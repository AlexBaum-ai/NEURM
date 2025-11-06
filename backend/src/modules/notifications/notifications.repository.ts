import {
  PrismaClient,
  Notification,
  NotificationPreference,
  DoNotDisturbSchedule,
  PushSubscription,
  Prisma,
  NotificationType,
  DeliveryChannel,
  NotificationFrequency,
} from '@prisma/client';
import * as Sentry from '@sentry/node';

/**
 * NotificationRepository
 * Data access layer for notifications, preferences, DND schedules, and push subscriptions
 */
export class NotificationRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  // ============================================================================
  // NOTIFICATION OPERATIONS
  // ============================================================================

  /**
   * Create a notification
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    referenceId?: string;
    dataJson?: Prisma.JsonValue;
    deliveryChannels?: DeliveryChannel[];
    bundleKey?: string;
    bundleCount?: number;
  }): Promise<Notification> {
    try {
      return await this.prisma.notification.create({
        data,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'createNotification' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Find recent notification by bundle key
   * Used for smart bundling (e.g., "3 people replied to your topic")
   */
  async findRecentByBundleKey(
    userId: string,
    bundleKey: string,
    withinMinutes: number = 60
  ): Promise<Notification | null> {
    try {
      const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);

      return await this.prisma.notification.findFirst({
        where: {
          userId,
          bundleKey,
          createdAt: {
            gte: cutoffTime,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'findRecentByBundleKey' },
        extra: { userId, bundleKey, withinMinutes },
      });
      throw error;
    }
  }

  /**
   * Update notification bundle count
   */
  async updateBundleCount(id: string, bundleCount: number): Promise<Notification> {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { bundleCount },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'updateBundleCount' },
        extra: { id, bundleCount },
      });
      throw error;
    }
  }

  /**
   * List notifications for a user with pagination
   */
  async listNotifications(
    userId: string,
    options: {
      page: number;
      limit: number;
      type?: NotificationType;
      unreadOnly?: boolean;
      sortBy?: 'createdAt';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const { page, limit, type, unreadOnly, sortBy = 'createdAt', sortOrder = 'desc' } = options;

      const where: Prisma.NotificationWhereInput = {
        userId,
        ...(type && { type }),
        ...(unreadOnly && { isRead: false }),
      };

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.notification.count({ where }),
      ]);

      return { notifications, total };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'listNotifications' },
        extra: { userId, options },
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    try {
      return await this.prisma.notification.update({
        where: { id, userId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'markAsRead' },
        extra: { id, userId },
      });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'markAllAsRead' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string, userId: string): Promise<Notification> {
    try {
      return await this.prisma.notification.delete({
        where: { id, userId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'deleteNotification' },
        extra: { id, userId },
      });
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'getUnreadCount' },
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
  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      return await this.prisma.notificationPreference.findMany({
        where: { userId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'getPreferences' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get specific notification preference
   */
  async getPreference(
    userId: string,
    notificationType: NotificationType,
    channel: DeliveryChannel
  ): Promise<NotificationPreference | null> {
    try {
      return await this.prisma.notificationPreference.findUnique({
        where: {
          userId_notificationType_channel: {
            userId,
            notificationType,
            channel,
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'getPreference' },
        extra: { userId, notificationType, channel },
      });
      throw error;
    }
  }

  /**
   * Upsert notification preference
   */
  async upsertPreference(data: {
    userId: string;
    notificationType: NotificationType;
    channel: DeliveryChannel;
    frequency: NotificationFrequency;
    enabled: boolean;
  }): Promise<NotificationPreference> {
    try {
      return await this.prisma.notificationPreference.upsert({
        where: {
          userId_notificationType_channel: {
            userId: data.userId,
            notificationType: data.notificationType,
            channel: data.channel,
          },
        },
        create: data,
        update: {
          frequency: data.frequency,
          enabled: data.enabled,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'upsertPreference' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Batch upsert notification preferences
   */
  async batchUpsertPreferences(
    preferences: Array<{
      userId: string;
      notificationType: NotificationType;
      channel: DeliveryChannel;
      frequency: NotificationFrequency;
      enabled: boolean;
    }>
  ): Promise<void> {
    try {
      await Promise.all(preferences.map((pref) => this.upsertPreference(pref)));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'batchUpsertPreferences' },
        extra: { count: preferences.length },
      });
      throw error;
    }
  }

  // ============================================================================
  // DO NOT DISTURB SCHEDULE OPERATIONS
  // ============================================================================

  /**
   * Get user's DND schedule
   */
  async getDndSchedule(userId: string): Promise<DoNotDisturbSchedule | null> {
    try {
      return await this.prisma.doNotDisturbSchedule.findUnique({
        where: { userId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'getDndSchedule' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Upsert DND schedule
   */
  async upsertDndSchedule(data: {
    userId: string;
    startTime: string;
    endTime: string;
    days: number[];
    enabled: boolean;
    timezone: string;
  }): Promise<DoNotDisturbSchedule> {
    try {
      return await this.prisma.doNotDisturbSchedule.upsert({
        where: { userId: data.userId },
        create: data,
        update: {
          startTime: data.startTime,
          endTime: data.endTime,
          days: data.days,
          enabled: data.enabled,
          timezone: data.timezone,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'upsertDndSchedule' },
        extra: { data },
      });
      throw error;
    }
  }

  // ============================================================================
  // PUSH SUBSCRIPTION OPERATIONS
  // ============================================================================

  /**
   * Get user's push subscriptions
   */
  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    try {
      return await this.prisma.pushSubscription.findMany({
        where: { userId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'getPushSubscriptions' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Find push subscription by endpoint
   */
  async findPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    try {
      return await this.prisma.pushSubscription.findUnique({
        where: { endpoint },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'findPushSubscriptionByEndpoint' },
        extra: { endpoint },
      });
      throw error;
    }
  }

  /**
   * Create push subscription
   */
  async createPushSubscription(data: {
    userId: string;
    endpoint: string;
    p256dhKey: string;
    authKey: string;
    userAgent?: string;
  }): Promise<PushSubscription> {
    try {
      return await this.prisma.pushSubscription.create({
        data,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'createPushSubscription' },
        extra: { userId: data.userId, endpoint: data.endpoint },
      });
      throw error;
    }
  }

  /**
   * Update push subscription last used timestamp
   */
  async updatePushSubscriptionLastUsed(id: string): Promise<PushSubscription> {
    try {
      return await this.prisma.pushSubscription.update({
        where: { id },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'updatePushSubscriptionLastUsed' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Delete push subscription by endpoint
   */
  async deletePushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription> {
    try {
      return await this.prisma.pushSubscription.delete({
        where: { endpoint },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'deletePushSubscriptionByEndpoint' },
        extra: { endpoint },
      });
      throw error;
    }
  }

  /**
   * Delete expired push subscriptions (not used in last 90 days)
   */
  async deleteExpiredPushSubscriptions(): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const result = await this.prisma.pushSubscription.deleteMany({
        where: {
          lastUsedAt: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'NotificationRepository', method: 'deleteExpiredPushSubscriptions' },
      });
      throw error;
    }
  }
}

export default NotificationRepository;
