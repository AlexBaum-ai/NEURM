/**
 * useReplies Hook
 * Manages reply data fetching with TanStack Query
 */

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import type {
  ForumReply,
  CreateReplyInput,
  UpdateReplyInput,
  ReplySortOption,
} from '../types';

// Query keys
export const replyKeys = {
  all: ['replies'] as const,
  byTopic: (topicId: string) => [...replyKeys.all, 'topic', topicId] as const,
  byTopicSorted: (topicId: string, sortBy: ReplySortOption) =>
    [...replyKeys.byTopic(topicId), sortBy] as const,
};

interface UseRepliesOptions {
  topicId: string;
  sortBy?: ReplySortOption;
  refetchInterval?: number | false;
}

/**
 * Hook to fetch replies for a topic
 * Uses Suspense for loading states
 */
export const useReplies = ({ topicId, sortBy = 'oldest', refetchInterval = 30000 }: UseRepliesOptions) => {
  return useSuspenseQuery({
    queryKey: replyKeys.byTopicSorted(topicId, sortBy),
    queryFn: async () => {
      const data = await forumApi.getReplies(topicId, sortBy);
      return data;
    },
    refetchInterval, // Poll for new replies every 30 seconds by default
  });
};

/**
 * Hook to create a new reply
 */
export const useCreateReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReplyInput) => forumApi.createReply(data),
    onSuccess: (_newReply, variables) => {
      // Invalidate replies query for the topic
      queryClient.invalidateQueries({
        queryKey: replyKeys.byTopic(variables.topicId),
      });
    },
  });
};

/**
 * Hook to update an existing reply
 */
export const useUpdateReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ replyId, data }: { replyId: string; data: UpdateReplyInput }) =>
      forumApi.updateReply(replyId, data),
    onSuccess: (updatedReply: ForumReply) => {
      // Invalidate replies query for the topic
      queryClient.invalidateQueries({
        queryKey: replyKeys.byTopic(updatedReply.topicId),
      });
    },
  });
};

/**
 * Hook to delete a reply
 */
export const useDeleteReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ replyId }: { replyId: string; topicId: string }) =>
      forumApi.deleteReply(replyId),
    onSuccess: (_data, variables) => {
      // Invalidate replies query for the topic
      queryClient.invalidateQueries({
        queryKey: replyKeys.byTopic(variables.topicId),
      });
    },
  });
};

/**
 * Hook to accept an answer (for question-type topics)
 */
export const useAcceptAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId, replyId }: { topicId: string; replyId: string }) =>
      forumApi.acceptAnswer(topicId, replyId),
    onSuccess: (_updatedTopic, variables) => {
      // Invalidate both topic and replies queries
      queryClient.invalidateQueries({
        queryKey: ['topics', variables.topicId],
      });
      queryClient.invalidateQueries({
        queryKey: replyKeys.byTopic(variables.topicId),
      });
    },
  });
};
