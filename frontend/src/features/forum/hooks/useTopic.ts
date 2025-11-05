/**
 * useTopic Hook
 * Fetches a single topic by ID with all details
 */

import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';

export const TOPIC_QUERY_KEY = 'forum-topic';

interface UseTopicOptions {
  topicId: string;
  enabled?: boolean;
  suspense?: boolean;
}

/**
 * Hook to fetch a single topic by ID
 * Uses Suspense by default for consistent loading UX
 */
export function useTopic(options: UseTopicOptions) {
  const { topicId, enabled = true, suspense = true } = options;

  if (suspense) {
    return useSuspenseQuery({
      queryKey: [TOPIC_QUERY_KEY, topicId],
      queryFn: () => forumApi.getTopicById(topicId),
      enabled,
    });
  }

  return useQuery({
    queryKey: [TOPIC_QUERY_KEY, topicId],
    queryFn: () => forumApi.getTopicById(topicId),
    enabled,
  });
}

export default useTopic;
