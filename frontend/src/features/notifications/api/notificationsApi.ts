/**
 * Notifications API Client
 * Handles all notification-related API requests
 */

import apiClient from '@/lib/api';
import type {
  Notification,
  NotificationsResponse,
  UnreadCountResponse,
  MarkReadResponse,
  MarkAllReadResponse,
  DeleteNotificationResponse,
  NotificationFilters,
} from '../types';

/**
 * Fetch user's notifications with optional filters
 */
export const getNotifications = async (
  filters: NotificationFilters = {}
): Promise<NotificationsResponse> => {
  const params = new URLSearchParams();

  if (filters.type) params.append('type', filters.type);
  if (filters.unreadOnly !== undefined) params.append('unreadOnly', String(filters.unreadOnly));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.offset) params.append('offset', String(filters.offset));

  const queryString = params.toString();
  const url = `/notifications${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<NotificationsResponse>(url);
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  return apiClient.get<UnreadCountResponse>('/notifications/unread-count');
};

/**
 * Mark a specific notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<MarkReadResponse> => {
  return apiClient.put<MarkReadResponse>(`/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<MarkAllReadResponse> => {
  return apiClient.put<MarkAllReadResponse>('/notifications/read-all');
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<DeleteNotificationResponse> => {
  return apiClient.delete<DeleteNotificationResponse>(`/notifications/${notificationId}`);
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (
  notificationId: string
): Promise<Notification> => {
  return apiClient.get<Notification>(`/notifications/${notificationId}`);
};
