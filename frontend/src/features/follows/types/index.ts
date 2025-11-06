export type FollowEntityType = 'user' | 'company' | 'category' | 'tag' | 'model';

export interface Follow {
  id: number;
  followerId: number;
  entityType: FollowEntityType;
  entityId: number;
  createdAt: string;
  // Populated entity data
  entity?: User | Company | Category | Tag | Model;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  isFollowing?: boolean;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isFollowing?: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isFollowing?: boolean;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  isFollowing?: boolean;
}

export interface Model {
  id: number;
  name: string;
  slug: string;
  provider: string;
  isFollowing?: boolean;
}

export interface FollowingListResponse {
  following: Follow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FollowersListResponse {
  followers: User[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ActivityFeedItem {
  id: number;
  type: 'article' | 'forum_post' | 'forum_reply' | 'job';
  entityId: number;
  title: string;
  excerpt: string;
  url: string;
  author: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  stats?: {
    views?: number;
    likes?: number;
    replies?: number;
    bookmarks?: number;
  };
}

export interface ActivityFeedResponse {
  items: ActivityFeedItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FollowSuggestion {
  entityType: FollowEntityType;
  entity: User | Company | Category | Tag | Model;
  reason: string; // e.g., "Popular in AI", "Based on your interests"
  score?: number;
}

export interface FollowSuggestionsResponse {
  suggestions: FollowSuggestion[];
  total: number;
}

export interface FollowStatusResponse {
  isFollowing: boolean;
  followId: number | null;
}

export interface FollowActionResponse {
  success: boolean;
  isFollowing: boolean;
  followId?: number;
  followerCount: number;
}

export interface FollowFilters {
  type?: FollowEntityType[];
}
