export type RecommendationType = 'article' | 'forum_topic' | 'job' | 'user';

export type FeedbackType = 'like' | 'dislike' | 'dismiss' | 'not_interested';

export interface RecommendationExplanation {
  reason: string;
  score: number;
}

export interface BaseRecommendation {
  id: string;
  type: RecommendationType;
  relevanceScore: number;
  explanation?: string;
  explanations?: RecommendationExplanation[];
  createdAt: string;
}

export interface ArticleRecommendation extends BaseRecommendation {
  type: 'article';
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl?: string;
    categoryName: string;
    categorySlug: string;
    publishedAt: string;
    readingTime: number;
    viewCount: number;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string;
    };
  };
}

export interface ForumTopicRecommendation extends BaseRecommendation {
  type: 'forum_topic';
  topic: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
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
  };
}

export interface JobRecommendation extends BaseRecommendation {
  type: 'job';
  job: {
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
  };
}

export interface UserRecommendation extends BaseRecommendation {
  type: 'user';
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    reputation: number;
    isFollowing: boolean;
    commonInterests: string[];
  };
}

export type Recommendation =
  | ArticleRecommendation
  | ForumTopicRecommendation
  | JobRecommendation
  | UserRecommendation;

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  totalCount: number;
}

export interface RecommendationFeedbackPayload {
  itemType: RecommendationType;
  itemId: string;
  feedback: FeedbackType;
}

export interface RecommendationsQueryParams {
  types?: RecommendationType[];
  limit?: number;
  excludeIds?: string[];
  includeExplanations?: boolean;
}

export interface RecommendationClickPayload {
  itemType: RecommendationType;
  itemId: string;
  position: number;
  relevanceScore: number;
}
