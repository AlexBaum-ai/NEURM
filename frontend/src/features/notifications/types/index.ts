/**
 * Notification Types
 * Defines all notification-related types and interfaces
 */

export type NotificationType =
  | 'news'
  | 'forum'
  | 'jobs'
  | 'social';

export type NotificationSubtype =
  // News
  | 'new_articles_in_followed_categories'
  | 'trending_article'
  // Forum
  | 'topic_reply'
  | 'mention'
  | 'upvote'
  | 'accepted_answer'
  // Jobs
  | 'new_job_match'
  | 'application_status_update'
  | 'profile_view'
  // Social
  | 'new_follower'
  | 'direct_message'
  | 'badge_earned'
  | 'reputation_milestone';

export type DeliveryChannel = 'in_app' | 'email' | 'push';

export type NotificationFrequency =
  | 'real_time'
  | 'hourly_digest'
  | 'daily_digest'
  | 'weekly_digest';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  subtype: NotificationSubtype;
  title: string;
  message: string;
  dataJson?: Record<string, unknown>;
  deliveryChannels: DeliveryChannel[];
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  notificationType: NotificationType;
  subtype?: NotificationSubtype;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  frequency: NotificationFrequency;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkReadResponse {
  success: boolean;
  notification?: Notification;
}

export interface MarkAllReadResponse {
  success: boolean;
  count: number;
}

export interface DeleteNotificationResponse {
  success: boolean;
}
