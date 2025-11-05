/**
 * Hook for fetching unanswered questions
 * Fetches topics that are questions without accepted answers
 */

import { useSuspenseQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import type { TopicListQuery } from '../types';

export const useUnansweredTopics = (query?: Omit<TopicListQuery, 'type' | 'status'>) => {
  const { data, error, refetch } = useSuspenseQuery({
    queryKey: ['unanswered-topics', query],
    queryFn: () => forumApi.getUnansweredTopics(query),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  return {
    topics: data.topics,
    pagination: data.pagination,
    totalCount: data.pagination.totalCount,
    error,
    refetch,
  };
};

export default useUnansweredTopics;
