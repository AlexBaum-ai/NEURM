import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../api/newsApi';

/**
 * Hook for fetching category hierarchy
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => newsApi.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
  });
};
