/**
 * Analytics API service
 * Handles article analytics tracking and retrieval
 */

import { apiClient } from '@/lib/api';
import type { AnalyticsResponse, PopularArticlesResponse, AnalyticsTrackingData } from '../types/analytics';

export const analyticsApi = {
  /**
   * Track article view with engagement metrics
   * POST /api/v1/analytics/articles/:id/view
   */
  trackArticleView: async (
    articleId: string,
    data: AnalyticsTrackingData
  ): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(
      `/analytics/articles/${articleId}/view`,
      data
    );
  },

  /**
   * Get analytics data for a specific article
   * GET /api/v1/analytics/articles/:id
   */
  getArticleAnalytics: async (articleId: string): Promise<AnalyticsResponse> => {
    return apiClient.get<AnalyticsResponse>(`/analytics/articles/${articleId}`);
  },

  /**
   * Get popular articles based on analytics
   * GET /api/v1/analytics/articles/popular
   */
  getPopularArticles: async (limit: number = 10): Promise<PopularArticlesResponse> => {
    return apiClient.get<PopularArticlesResponse>(
      `/analytics/articles/popular?limit=${limit}`
    );
  },

  /**
   * Get trending articles based on recent analytics
   * GET /api/v1/analytics/articles/trending
   */
  getTrendingArticles: async (limit: number = 10): Promise<PopularArticlesResponse> => {
    return apiClient.get<PopularArticlesResponse>(
      `/analytics/articles/trending?limit=${limit}`
    );
  },
};
