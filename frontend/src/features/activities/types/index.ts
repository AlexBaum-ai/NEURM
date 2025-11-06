/**
 * Activity types that match backend ActivityType enum
 */
export type ActivityType =
  | 'posted_article'
  | 'created_topic'
  | 'replied'
  | 'upvoted'
  | 'bookmarked'
  | 'applied_job'
  | 'earned_badge'
  | 'followed_user';

/**
 * Activity target types that match backend ActivityTargetType enum
 */
export type ActivityTargetType = 'article' | 'topic' | 'reply' | 'job' | 'badge' | 'user';

/**
 * Privacy visibility levels
 */
export type PrivacyVisibility = 'public' | 'community' | 'recruiters' | 'private';

/**
 * Time grouping for activities
 */
export type TimeGroup = 'Today' | 'This Week' | 'Earlier';

/**
 * Activity item with user and target information
 */
export interface Activity {
  id: string;
  userId: number;
  activityType: ActivityType;
  targetType: ActivityTargetType;
  targetId: string;
  privacy: PrivacyVisibility;
  metadata?: Record<string, any>;
  createdAt: string;
  // Populated user data
  user?: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

/**
 * Grouped activities by time period
 */
export interface ActivityGroup {
  timeGroup: TimeGroup;
  activities: Activity[];
}

/**
 * API response for user activities
 */
export interface UserActivitiesResponse {
  activities: Activity[];
  groups: ActivityGroup[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * API response for following feed
 */
export interface FollowingFeedResponse {
  activities: Activity[];
  groups: ActivityGroup[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Query parameters for user activities
 */
export interface GetUserActivitiesParams {
  username: string;
  type?: ActivityType;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for following feed
 */
export interface GetFollowingFeedParams {
  type?: ActivityType;
  limit?: number;
  offset?: number;
}
