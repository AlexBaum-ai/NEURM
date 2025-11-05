import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { newsApi } from '../api/newsApi';
import type { NewsFilters, SortOption } from '../types';

interface UseArticlesParams {
  limit?: number;
  sortBy?: SortOption;
  filters?: NewsFilters;
}

/**
 * Hook for infinite scroll pagination of articles
 */
export const useArticles = ({ limit = 20, sortBy = 'publishedAt-desc', filters }: UseArticlesParams = {}) => {
  return useInfiniteQuery({
    queryKey: ['articles', { sortBy, filters }],
    queryFn: ({ pageParam = 1 }) =>
      newsApi.getArticles({
        page: pageParam,
        limit,
        sortBy,
        filters,
      }),
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      // Calculate hasNext from page and totalPages
      const hasNext = pagination.page < pagination.totalPages;
      return hasNext ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching featured articles
 */
export const useFeaturedArticles = () => {
  return useQuery({
    queryKey: ['articles', 'featured'],
    queryFn: () => newsApi.getFeaturedArticles(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching trending articles
 */
export const useTrendingArticles = () => {
  return useQuery({
    queryKey: ['articles', 'trending'],
    queryFn: () => newsApi.getTrendingArticles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
