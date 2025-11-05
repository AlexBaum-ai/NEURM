/**
 * Analytics types for article tracking
 */

export interface ArticleAnalytics {
  articleId: string;
  viewDuration: number; // seconds
  scrollDepth: number; // 0-100
  readingProgress: number; // 0-100
  completedReading: boolean;
  engagementScore: number; // calculated metric
}

export interface AnalyticsTrackingData {
  viewDuration: number;
  scrollDepth: number;
  readingProgress: number;
  completedReading: boolean;
  timestamp: string;
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
    totalViews: number;
    averageViewDuration: number;
    averageScrollDepth: number;
    completionRate: number;
  };
}

export interface PopularArticlesResponse {
  success: boolean;
  data: Array<{
    id: string;
    slug: string;
    title: string;
    viewCount: number;
    averageViewDuration: number;
    completionRate: number;
  }>;
}

export interface StoredAnalyticsState {
  articleId: string;
  startTime: number;
  lastActiveTime: number;
  totalActiveTime: number;
  maxScrollDepth: number;
  sessionId: string;
}
