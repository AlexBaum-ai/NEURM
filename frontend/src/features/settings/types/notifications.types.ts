/**
 * Notification Settings Types
 * Matching backend validation schemas
 */

export type NotificationType =
  // News notifications
  | 'new_article_in_followed_category'
  | 'trending_article'
  // Forum notifications
  | 'topic_reply'
  | 'comment_reply'
  | 'mention'
  | 'upvote'
  | 'downvote'
  | 'accepted_answer'
  // Jobs notifications
  | 'new_job_match'
  | 'application_status_update'
  | 'profile_view'
  // Social notifications
  | 'new_follower'
  | 'badge_earned'
  | 'reputation_milestone'
  | 'message'
  // System notifications
  | 'system_announcement'
  | 'account_update';

export type DeliveryChannel = 'in_app' | 'email' | 'push';

export type NotificationFrequency = 'real_time' | 'hourly_digest' | 'daily_digest' | 'weekly_digest' | 'off';

export interface NotificationPreference {
  notificationType: NotificationType;
  channel: DeliveryChannel;
  frequency: NotificationFrequency;
  enabled: boolean;
}

export interface DndSchedule {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  days: number[]; // 0-6 (Sunday to Saturday)
  enabled: boolean;
  timezone: string;
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreference[];
  dndSchedule: DndSchedule;
  vacationMode: boolean;
}

export interface UpdatePreferencesInput {
  preferences: NotificationPreference[];
}

export interface UpdateDndScheduleInput {
  startTime: string;
  endTime: string;
  days: number[];
  enabled: boolean;
  timezone: string;
}

export interface NotificationTypeConfig {
  type: NotificationType;
  label: string;
  description: string;
  defaultEnabled: boolean;
  defaultChannels: DeliveryChannel[];
  defaultFrequency: NotificationFrequency;
}

export type NotificationSection = 'news' | 'forum' | 'jobs' | 'social' | 'system';

export interface NotificationSectionConfig {
  id: NotificationSection;
  title: string;
  description: string;
  icon: string;
  types: NotificationTypeConfig[];
}
