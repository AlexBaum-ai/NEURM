/**
 * useTopics Hook
 * Fetches and manages forum topics with filtering and pagination
 */

import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import type { TopicListQuery } from '../types';

export const TOPICS_QUERY_KEY = 'forum-topics';

interface UseTopicsOptions {
  query?: TopicListQuery;
  enabled?: boolean;
  suspense?: boolean;
}

/**
 * Hook to fetch topics with filters and pagination
 * Uses Suspense by default for consistent loading UX
 */
export function useTopics(options: UseTopicsOptions = {}) {
  const { query, enabled = true, suspense = true } = options;

  if (suspense) {
    return useSuspenseQuery({
      queryKey: [TOPICS_QUERY_KEY, query],
      queryFn: () => forumApi.getTopics(query),
      enabled,
    });
  }

  return useQuery({
    queryKey: [TOPICS_QUERY_KEY, query],
    queryFn: () => forumApi.getTopics(query),
    enabled,
  });
}

export default useTopics;
