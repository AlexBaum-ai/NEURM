import Queue from 'bull';
import { unifiedConfig } from '@/config/unifiedConfig';
import logger from '@/utils/logger';

/**
 * Notification Queue
 * Handles async delivery of email and push notifications
 */

// Email notification queue
export const emailNotificationQueue = new Queue('email-notifications', unifiedConfig.redis.url, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// Push notification queue
export const pushNotificationQueue = new Queue('push-notifications', unifiedConfig.redis.url, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

/**
 * Add email notification job to queue
 */
export const queueEmailNotification = async (data: {
  userId: string;
  email: string;
  notificationType: string;
  subject: string;
  htmlContent: string;
}) => {
  try {
    await emailNotificationQueue.add(data, {
      priority: 1,
    });

    logger.info(`Email notification queued for user ${data.userId}`);
  } catch (error) {
    logger.error('Error queueing email notification:', error);
    throw error;
  }
};

/**
 * Add push notification job to queue
 */
export const queuePushNotification = async (data: {
  userId: string;
  subscription: {
    endpoint: string;
    p256dhKey: string;
    authKey: string;
  };
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
  };
}) => {
  try {
    await pushNotificationQueue.add(data, {
      priority: 1,
    });

    logger.info(`Push notification queued for user ${data.userId}`);
  } catch (error) {
    logger.error('Error queueing push notification:', error);
    throw error;
  }
};

// Queue event handlers
emailNotificationQueue.on('completed', (job) => {
  logger.info(`Email notification job ${job.id} completed`);
});

emailNotificationQueue.on('failed', (job, err) => {
  logger.error(`Email notification job ${job.id} failed:`, err);
});

pushNotificationQueue.on('completed', (job) => {
  logger.info(`Push notification job ${job.id} completed`);
});

pushNotificationQueue.on('failed', (job, err) => {
  logger.error(`Push notification job ${job.id} failed:`, err);
});

logger.info('Notification queues initialized');
