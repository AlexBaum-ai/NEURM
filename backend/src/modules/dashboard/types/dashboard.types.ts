/**
 * Dashboard Types
 *
 * Type definitions for the personalized dashboard system
 */

export type WidgetType =
  | 'top_stories_today'
  | 'trending_discussions'
  | 'job_matches'
  | 'your_stats'
  | 'following_activity'
  | 'trending_tags';

export type QuickActionType = 'new_post' | 'search_jobs' | 'browse_forum';

export interface WidgetConfig {
  id: WidgetType;
  enabled: boolean;
  order: number;
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
}

export interface TopStory {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  coverImageUrl: string | null;
  viewCount: number;
  createdAt: Date;
  author: {
    username: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    } | null;
  };
  category: {
    name: string;
    slug: string;
  };
}

export interface TrendingDiscussion {
  id: string;
  title: string;
  slug: string;
  type: string;
  viewCount: number;
  replyCount: number;
  upvoteCount: number;
  createdAt: Date;
  author: {
    username: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    } | null;
  };
  category: {
    name: string;
    slug: string;
  };
}

export interface JobMatch {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  workLocation: string;
  jobType: string;
  experienceLevel: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  createdAt: Date;
  company: {
    name: string;
    slug: string;
    logoUrl: string | null;
    location: string | null;
  };
  matchScore?: number;
}

export interface UserStats {
  forumReputation: number;
  articlesRead: number;
  jobsSaved: number;
  applicationsSent: number;
  topicsCreated: number;
  repliesPosted: number;
  upvotesReceived: number;
}

export interface FollowingActivity {
  id: string;
  type: 'article' | 'topic' | 'job';
  title: string;
  excerpt?: string;
  url: string;
  createdAt: Date;
  author?: {
    username: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    } | null;
  };
  company?: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  category?: {
    name: string;
    slug: string;
  };
}

export interface TrendingTag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  type: 'news' | 'forum';
}

export interface UserActivity {
  id: string;
  type: 'topic_created' | 'reply_posted' | 'application_sent' | 'article_bookmarked';
  title: string;
  url: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface ForYouItem {
  id: string;
  type: 'article' | 'topic' | 'job';
  title: string;
  excerpt: string;
  url: string;
  reason: string; // Why this is recommended
  relevanceScore: number;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface QuickAction {
  id: QuickActionType;
  label: string;
  icon: string;
  url: string;
  description: string;
}

export interface DashboardData {
  widgets: {
    topStoriesToday?: TopStory[];
    trendingDiscussions?: TrendingDiscussion[];
    jobMatches?: JobMatch[];
    yourStats?: UserStats;
    followingActivity?: FollowingActivity[];
    trendingTags?: TrendingTag[];
  };
  forYouFeed: ForYouItem[];
  recentActivity: UserActivity[];
  quickActions: QuickAction[];
  config: DashboardConfig;
}

export interface GetDashboardOptions {
  userId: string;
  includeWidgets?: WidgetType[];
  limit?: number;
}

export interface UpdateDashboardConfigInput {
  widgets: WidgetConfig[];
}
