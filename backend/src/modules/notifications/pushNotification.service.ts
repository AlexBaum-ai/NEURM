import webpush from 'web-push';
import { unifiedConfig } from '@/config/unifiedConfig';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

/**
 * Push Notification Service
 * Handles web push notifications using VAPID protocol
 */

// Configure web-push with VAPID keys
// In production, these should be set in environment variables
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:noreply@neurmatic.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  logger.info('Web push configured with VAPID keys');
} else {
  logger.warn('VAPID keys not configured - push notifications will not work');
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actionUrl?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dhKey: string;
  authKey: string;
}

/**
 * Send push notification
 */
export const sendPushNotification = async (
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<boolean> => {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      logger.warn('Cannot send push notification - VAPID keys not configured');
      return false;
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dhKey,
        auth: subscription.authKey,
      },
    };

    const notificationPayload = JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        data: {
          ...payload.data,
          url: payload.actionUrl,
        },
      },
    });

    await webpush.sendNotification(pushSubscription, notificationPayload);

    logger.info(`Push notification sent to ${subscription.endpoint.substring(0, 50)}...`);
    return true;
  } catch (error: any) {
    // Handle subscription errors
    if (error.statusCode === 410 || error.statusCode === 404) {
      logger.info(`Push subscription expired or invalid: ${subscription.endpoint.substring(0, 50)}...`);
      // Subscription should be removed from database
      return false;
    }

    Sentry.captureException(error, {
      tags: { service: 'PushNotificationService', method: 'sendPushNotification' },
      extra: { endpoint: subscription.endpoint, payload },
    });

    logger.error('Error sending push notification:', error);
    return false;
  }
};

/**
 * Send push notification to multiple subscriptions
 */
export const sendPushToMultiple = async (
  subscriptions: PushSubscriptionData[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> => {
  const results = await Promise.allSettled(
    subscriptions.map((subscription) => sendPushNotification(subscription, payload))
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - sent;

  logger.info(`Push notifications sent: ${sent} successful, ${failed} failed`);

  return { sent, failed };
};

/**
 * Generate VAPID keys (utility function for setup)
 * Run this once to generate keys and add to environment variables
 */
export const generateVapidKeys = (): { publicKey: string; privateKey: string } => {
  const keys = webpush.generateVAPIDKeys();
  return {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  };
};
