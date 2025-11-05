import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../api/newsApi';

/**
 * Hook for searching tags (for autocomplete)
 */
export const useTags = (search?: string) => {
  return useQuery({
    queryKey: ['tags', search],
    queryFn: () => newsApi.searchTags(search),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: search !== undefined && search.length >= 2, // Only search if 2+ characters
  });
};
