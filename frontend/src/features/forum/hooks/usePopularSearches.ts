/**
 * usePopularSearches Hook
 * Fetches popular forum searches
 */

import { useQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';

export const usePopularSearches = () => {
  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: () => forumApi.getPopularSearches(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export default usePopularSearches;
