/**
 * useSearchSuggestions Hook
 * Provides autocomplete suggestions with debouncing
 */

import { useQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import { useMemo } from 'react';

export const useSearchSuggestions = (query: string, debounceDelay = 300) => {
  // Debounce the query
  const debouncedQuery = useMemo(() => {
    return query.trim();
  }, [query]);

  return useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => forumApi.searchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useSearchSuggestions;
