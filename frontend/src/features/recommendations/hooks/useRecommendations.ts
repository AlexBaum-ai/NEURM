import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationsApi } from '../api/recommendationsApi';
import type {
  RecommendationsQueryParams,
  RecommendationFeedbackPayload,
  RecommendationClickPayload,
  RecommendationType,
} from '../types';

const RECOMMENDATIONS_QUERY_KEY = 'recommendations';

export const useRecommendations = (params?: RecommendationsQueryParams) => {
  return useSuspenseQuery({
    queryKey: [RECOMMENDATIONS_QUERY_KEY, params],
    queryFn: () => recommendationsApi.getRecommendations(params),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useRecommendationFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RecommendationFeedbackPayload) =>
      recommendationsApi.submitFeedback(payload),
    onSuccess: () => {
      // Invalidate recommendations to fetch updated suggestions
      queryClient.invalidateQueries({ queryKey: [RECOMMENDATIONS_QUERY_KEY] });
    },
  });
};

export const useRecommendationClick = () => {
  return useMutation({
    mutationFn: (payload: RecommendationClickPayload) => recommendationsApi.trackClick(payload),
    // No need to update cache for click tracking
  });
};

/**
 * Hook to get recommendations for a specific type
 */
export const useRecommendationsByType = (
  type: RecommendationType,
  limit: number = 5,
  excludeIds?: string[]
) => {
  return useRecommendations({
    types: [type],
    limit,
    excludeIds,
    includeExplanations: true,
  });
};
