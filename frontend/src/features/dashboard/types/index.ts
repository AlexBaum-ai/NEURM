export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export type WidgetType =
  | 'top-stories'
  | 'trending-discussions'
  | 'job-matches'
  | 'stats'
  | 'following-activity'
  | 'trending-tags'
  | 'events'
  | 'recommendations';

export interface DashboardConfig {
  widgets: DashboardWidget[];
  activeTab: 'for-you' | 'news' | 'forum' | 'jobs';
}

export interface UserStats {
  reputation: number;
  articlesRead: number;
  savedJobs: number;
  applications: number;
  topicsCreated: number;
  repliesPosted: number;
}

export interface TopStory {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl?: string;
  categoryName: string;
  categorySlug: string;
  publishedAt: string;
  viewCount: number;
  readingTime: number;
}

export interface TrendingDiscussion {
  id: string;
  title: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  replyCount: number;
  viewCount: number;
  voteCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface JobMatch {
  id: string;
  title: string;
  slug: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  remoteType: 'remote' | 'hybrid' | 'onsite';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  matchScore: number;
  postedAt: string;
}

export interface FollowingActivity {
  id: string;
  type: 'article' | 'topic' | 'reply' | 'badge';
  entityId: string;
  title: string;
  url: string;
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  timestamp: string;
}

export interface TrendingTag {
  id: string;
  name: string;
  slug: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DashboardData {
  topStories: TopStory[];
  trendingDiscussions: TrendingDiscussion[];
  jobMatches: JobMatch[];
  stats: UserStats;
  followingActivity: FollowingActivity[];
  trendingTags: TrendingTag[];
}

export interface UpdateConfigPayload {
  widgets: DashboardWidget[];
  activeTab?: 'for-you' | 'news' | 'forum' | 'jobs';
}
