import { apiClient } from '@/lib/apiClient';
import type {
  RecommendationsResponse,
  RecommendationFeedbackPayload,
  RecommendationsQueryParams,
  RecommendationClickPayload,
} from '../types';

const BASE_URL = '/api/v1/recommendations';

export const recommendationsApi = {
  /**
   * Get personalized recommendations
   */
  getRecommendations: async (params?: RecommendationsQueryParams): Promise<RecommendationsResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.types && params.types.length > 0) {
      queryParams.append('types', params.types.join(','));
    }

    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    if (params?.excludeIds && params.excludeIds.length > 0) {
      queryParams.append('excludeIds', params.excludeIds.join(','));
    }

    if (params?.includeExplanations !== undefined) {
      queryParams.append('includeExplanations', params.includeExplanations.toString());
    }

    const url = queryParams.toString() ? `${BASE_URL}?${queryParams}` : BASE_URL;

    const response = await apiClient.get<RecommendationsResponse>(url);
    return response.data;
  },

  /**
   * Submit feedback for a recommendation
   */
  submitFeedback: async (payload: RecommendationFeedbackPayload): Promise<void> => {
    await apiClient.post(`${BASE_URL}/feedback`, payload);
  },

  /**
   * Track recommendation click (for effectiveness measurement)
   */
  trackClick: async (payload: RecommendationClickPayload): Promise<void> => {
    // Fire and forget - don't block user interaction
    try {
      await apiClient.post(`${BASE_URL}/clicks`, payload);
    } catch (error) {
      // Silently fail - click tracking shouldn't impact UX
      console.warn('Failed to track recommendation click:', error);
    }
  },
};
