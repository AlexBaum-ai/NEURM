/**
 * useForumSearch Hook
 * Handles forum search with filters and pagination
 */

import { useQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import type { SearchQuery } from '../types';

export const useForumSearch = (searchQuery: SearchQuery) => {
  return useQuery({
    queryKey: ['forum-search', searchQuery],
    queryFn: () => forumApi.search(searchQuery),
    enabled: !!searchQuery.q && searchQuery.q.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useForumSearch;
