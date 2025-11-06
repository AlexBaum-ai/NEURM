import type { NotificationSectionConfig } from '../types/notifications.types';

/**
 * Notification type configurations organized by section
 */
export const NOTIFICATION_SECTIONS: NotificationSectionConfig[] = [
  {
    id: 'news',
    title: 'News',
    description: 'Articles, updates, and trending content',
    icon: '📰',
    types: [
      {
        type: 'new_article_in_followed_category',
        label: 'New articles in followed categories',
        description: 'Get notified when articles are published in categories you follow',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email'],
        defaultFrequency: 'daily_digest',
      },
      {
        type: 'trending_article',
        label: 'Trending articles',
        description: 'Popular articles gaining traction in the community',
        defaultEnabled: true,
        defaultChannels: ['in_app'],
        defaultFrequency: 'daily_digest',
      },
    ],
  },
  {
    id: 'forum',
    title: 'Forum',
    description: 'Discussions, replies, and community interactions',
    icon: '💬',
    types: [
      {
        type: 'topic_reply',
        label: 'Replies to your topics',
        description: 'Someone replied to a topic you created',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email', 'push'],
        defaultFrequency: 'real_time',
      },
      {
        type: 'comment_reply',
        label: 'Replies to your comments',
        description: 'Someone replied to your comment or reply',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email'],
        defaultFrequency: 'real_time',
      },
      {
        type: 'mention',
        label: 'Mentions',
        description: 'Someone mentioned you in a post or comment',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email', 'push'],
        defaultFrequency: 'real_time',
      },
      {
        type: 'upvote',
        label: 'Upvotes',
        description: 'Your content received an upvote',
        defaultEnabled: true,
        defaultChannels: ['in_app'],
        defaultFrequency: 'daily_digest',
      },
      {
        type: 'downvote',
        label: 'Downvotes',
        description: 'Your content received a downvote',
        defaultEnabled: false,
        defaultChannels: ['in_app'],
        defaultFrequency: 'off',
      },
      {
        type: 'accepted_answer',
        label: 'Accepted answers',
        description: 'Your answer was marked as accepted',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email', 'push'],
        defaultFrequency: 'real_time',
      },
    ],
  },
  {
    id: 'jobs',
    title: 'Jobs',
    description: 'Job matches, applications, and profile activity',
    icon: '💼',
    types: [
      {
        type: 'new_job_match',
        label: 'New job matches',
        description: 'Jobs that match your profile and preferences',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email'],
        defaultFrequency: 'daily_digest',
      },
      {
        type: 'application_status_update',
        label: 'Application status updates',
        description: 'Updates on your job applications',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email', 'push'],
        defaultFrequency: 'real_time',
      },
      {
        type: 'profile_view',
        label: 'Profile views',
        description: 'Someone viewed your profile',
        defaultEnabled: true,
        defaultChannels: ['in_app'],
        defaultFrequency: 'weekly_digest',
      },
    ],
  },
  {
    id: 'social',
    title: 'Social',
    description: 'Followers, messages, and achievements',
    icon: '👥',
    types: [
      {
        type: 'new_follower',
        label: 'New followers',
        description: 'Someone started following you',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email'],
        defaultFrequency: 'real_time',
      },
      {
        type: 'message',
        label: 'Direct messages',
        description: 'You received a new direct message',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email', 'push'],
        defaultFrequency: 'real_time',
      },
      {
        type: 'badge_earned',
        label: 'Badges earned',
        description: 'You earned a new badge',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email'],
        defaultFrequency: 'real_time',
      },
      {
        type: 'reputation_milestone',
        label: 'Reputation milestones',
        description: 'You reached a reputation milestone',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email'],
        defaultFrequency: 'real_time',
      },
    ],
  },
  {
    id: 'system',
    title: 'System',
    description: 'Platform updates and account notifications',
    icon: '⚙️',
    types: [
      {
        type: 'system_announcement',
        label: 'System announcements',
        description: 'Important platform updates and announcements',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email'],
        defaultFrequency: 'real_time',
      },
      {
        type: 'account_update',
        label: 'Account updates',
        description: 'Security and account-related notifications',
        defaultEnabled: true,
        defaultChannels: ['in_app', 'email'],
        defaultFrequency: 'real_time',
      },
    ],
  },
];

/**
 * Frequency options for notification delivery
 */
export const FREQUENCY_OPTIONS = [
  {
    value: 'real_time' as const,
    label: 'Real-time',
    description: 'Receive notifications immediately',
  },
  {
    value: 'hourly_digest' as const,
    label: 'Hourly',
    description: 'Bundled once per hour',
  },
  {
    value: 'daily_digest' as const,
    label: 'Daily',
    description: 'Once per day digest',
  },
  {
    value: 'weekly_digest' as const,
    label: 'Weekly',
    description: 'Weekly summary',
  },
  {
    value: 'off' as const,
    label: 'Off',
    description: 'Disable this notification',
  },
];

/**
 * Days of the week for DND schedule
 */
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];
