import apiClient from '@/lib/api';
import type {
  NotificationPreferencesResponse,
  UpdatePreferencesInput,
  UpdateDndScheduleInput,
  NotificationPreference,
  DndSchedule,
} from '../types/notifications.types';

/**
 * Get user's notification preferences
 * GET /api/v1/notifications/preferences
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferencesResponse> => {
  return apiClient.get<NotificationPreferencesResponse>('/notifications/preferences');
};

/**
 * Update notification preferences
 * PUT /api/v1/notifications/preferences
 */
export const updateNotificationPreferences = async (
  input: UpdatePreferencesInput
): Promise<{ preferences: NotificationPreference[] }> => {
  return apiClient.put<{ preferences: NotificationPreference[] }>('/notifications/preferences', input);
};

/**
 * Get Do Not Disturb schedule
 * GET /api/v1/notifications/dnd
 */
export const getDndSchedule = async (): Promise<DndSchedule> => {
  return apiClient.get<DndSchedule>('/notifications/dnd');
};

/**
 * Update Do Not Disturb schedule
 * PUT /api/v1/notifications/dnd
 */
export const updateDndSchedule = async (input: UpdateDndScheduleInput): Promise<DndSchedule> => {
  return apiClient.put<DndSchedule>('/notifications/dnd', input);
};

/**
 * Subscribe to push notifications
 * POST /api/v1/notifications/push/subscribe
 */
export const subscribeToPushNotifications = async (subscription: {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}): Promise<void> => {
  return apiClient.post<void>('/notifications/push/subscribe', subscription);
};

/**
 * Unsubscribe from push notifications
 * DELETE /api/v1/notifications/push/unsubscribe
 */
export const unsubscribeFromPushNotifications = async (endpoint: string): Promise<void> => {
  return apiClient.delete<void>('/notifications/push/unsubscribe', {
    data: { endpoint },
  });
};

/**
 * Get push notification subscriptions
 * GET /api/v1/notifications/push/subscriptions
 */
export const getPushSubscriptions = async (): Promise<
  Array<{
    endpoint: string;
    created_at: string;
  }>
> => {
  return apiClient.get<
    Array<{
      endpoint: string;
      created_at: string;
    }>
  >('/notifications/push/subscriptions');
};

/**
 * Send test push notification
 * POST /api/v1/notifications/push/test
 */
export const sendTestPushNotification = async (): Promise<{ success: boolean; message: string }> => {
  return apiClient.post<{ success: boolean; message: string }>('/notifications/push/test');
};
