/**
 * Notification Helper Utilities
 * Icon mapping, link generation, and formatting helpers
 */

import type { Notification, NotificationType, NotificationSubtype } from '../types';
import {
  BellIcon,
  ChatBubbleIcon,
  EnvelopeClosedIcon,
  FileTextIcon,
  HeartIcon,
  PersonIcon,
  RocketIcon,
  StarIcon,
  CheckCircledIcon,
} from '@radix-ui/react-icons';

/**
 * Get icon component for notification type
 */
export const getNotificationIcon = (type: NotificationType, subtype?: NotificationSubtype) => {
  // Forum notifications
  if (type === 'forum') {
    switch (subtype) {
      case 'mention':
        return PersonIcon;
      case 'upvote':
        return HeartIcon;
      case 'accepted_answer':
        return CheckCircledIcon;
      case 'topic_reply':
      default:
        return ChatBubbleIcon;
    }
  }

  // News notifications
  if (type === 'news') {
    return FileTextIcon;
  }

  // Jobs notifications
  if (type === 'jobs') {
    switch (subtype) {
      case 'profile_view':
        return PersonIcon;
      case 'application_status_update':
        return CheckCircledIcon;
      case 'new_job_match':
      default:
        return RocketIcon;
    }
  }

  // Social notifications
  if (type === 'social') {
    switch (subtype) {
      case 'direct_message':
        return EnvelopeClosedIcon;
      case 'badge_earned':
        return StarIcon;
      case 'new_follower':
      default:
        return PersonIcon;
    }
  }

  // Default
  return BellIcon;
};

/**
 * Get icon color for notification type
 */
export const getNotificationIconColor = (type: NotificationType): string => {
  switch (type) {
    case 'news':
      return 'text-blue-500';
    case 'forum':
      return 'text-purple-500';
    case 'jobs':
      return 'text-green-500';
    case 'social':
      return 'text-pink-500';
    default:
      return 'text-gray-500';
  }
};

/**
 * Generate navigation link from notification data
 */
export const getNotificationLink = (notification: Notification): string | null => {
  const data = notification.dataJson;

  if (!data) return null;

  switch (notification.type) {
    case 'news':
      if (data.articleSlug) {
        return `/news/${data.articleSlug}`;
      }
      if (data.categorySlug) {
        return `/news?category=${data.categorySlug}`;
      }
      return '/news';

    case 'forum':
      if (notification.subtype === 'topic_reply' || notification.subtype === 'mention') {
        if (data.topicSlug && data.topicId) {
          return `/forum/t/${data.topicSlug}/${data.topicId}${data.replyId ? `#reply-${data.replyId}` : ''}`;
        }
      }
      if (notification.subtype === 'upvote' && data.topicSlug && data.topicId) {
        return `/forum/t/${data.topicSlug}/${data.topicId}`;
      }
      return '/forum';

    case 'jobs':
      if (notification.subtype === 'new_job_match' && data.jobSlug) {
        return `/jobs/${data.jobSlug}`;
      }
      if (notification.subtype === 'application_status_update') {
        return '/applications';
      }
      if (notification.subtype === 'profile_view') {
        return '/profile/views';
      }
      return '/jobs';

    case 'social':
      if (notification.subtype === 'direct_message') {
        return data.conversationId ? `/messages/${data.conversationId}` : '/messages';
      }
      if (notification.subtype === 'new_follower' && data.username) {
        return `/profile/${data.username}`;
      }
      if (notification.subtype === 'badge_earned') {
        return '/badges';
      }
      return '/';

    default:
      return null;
  }
};

/**
 * Format relative time for notifications
 */
export const formatNotificationTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Format as date for older notifications
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Group notifications by time period
 */
export type TimeGroup = 'today' | 'this_week' | 'earlier';

export interface GroupedNotifications {
  today: Notification[];
  this_week: Notification[];
  earlier: Notification[];
}

export const groupNotificationsByTime = (
  notifications: Notification[]
): GroupedNotifications => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const grouped: GroupedNotifications = {
    today: [],
    this_week: [],
    earlier: [],
  };

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.createdAt);

    if (notifDate >= todayStart) {
      grouped.today.push(notification);
    } else if (notifDate >= weekStart) {
      grouped.this_week.push(notification);
    } else {
      grouped.earlier.push(notification);
    }
  });

  return grouped;
};

/**
 * Get notification type label
 */
export const getNotificationTypeLabel = (type: NotificationType): string => {
  switch (type) {
    case 'news':
      return 'News';
    case 'forum':
      return 'Forum';
    case 'jobs':
      return 'Jobs';
    case 'social':
      return 'Social';
    default:
      return 'All';
  }
};
