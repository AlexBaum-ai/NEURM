/**
 * useSearchHistory Hook
 * Manages user's search history
 */

import { useQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';

export const useSearchHistory = () => {
  return useQuery({
    queryKey: ['search-history'],
    queryFn: () => forumApi.getSearchHistory(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useSearchHistory;
