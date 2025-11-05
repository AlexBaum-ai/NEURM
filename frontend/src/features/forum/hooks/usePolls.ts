/**
 * Poll-related hooks for voting and fetching poll data
 */

import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import type { TopicPoll } from '../types';

// ============================================================================
// Query Keys
// ============================================================================

export const pollKeys = {
  all: ['polls'] as const,
  detail: (pollId: string) => ['polls', pollId] as const,
  byTopic: (topicId: string) => ['polls', 'topic', topicId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get poll by ID
 */
export const usePoll = ({ pollId }: { pollId: string }) => {
  return useQuery({
    queryKey: pollKeys.detail(pollId),
    queryFn: () => forumApi.getPollById(pollId),
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Get poll by topic ID with suspense
 */
export const usePollByTopic = ({ topicId }: { topicId: string }) => {
  return useSuspenseQuery({
    queryKey: pollKeys.byTopic(topicId),
    queryFn: () => forumApi.getPollByTopicId(topicId),
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Get poll by topic ID (non-suspense version)
 */
export const usePollByTopicQuery = ({ topicId }: { topicId: string }) => {
  return useQuery({
    queryKey: pollKeys.byTopic(topicId),
    queryFn: () => forumApi.getPollByTopicId(topicId),
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Vote on a poll
 */
export const useVoteOnPoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, optionIds }: { pollId: string; optionIds: string[] }) =>
      forumApi.voteOnPoll(pollId, optionIds),
    onSuccess: (updatedPoll: TopicPoll) => {
      // Update poll detail cache
      queryClient.setQueryData(pollKeys.detail(updatedPoll.id), updatedPoll);

      // Update topic-based poll cache
      queryClient.setQueryData(pollKeys.byTopic(updatedPoll.topicId), updatedPoll);

      // Invalidate topic query to update poll data in topic view
      queryClient.invalidateQueries({
        queryKey: ['topics', updatedPoll.topicId],
      });
    },
  });
};

/**
 * Create a new poll
 */
export const useCreatePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      topicId: string;
      question: string;
      allowMultiple: boolean;
      isAnonymous: boolean;
      endsAt?: string;
      options: string[];
    }) => forumApi.createPoll(data),
    onSuccess: (newPoll: TopicPoll) => {
      // Update topic-based poll cache
      queryClient.setQueryData(pollKeys.byTopic(newPoll.topicId), newPoll);

      // Invalidate topic query to show new poll
      queryClient.invalidateQueries({
        queryKey: ['topics', newPoll.topicId],
      });
    },
  });
};

/**
 * Delete a poll (admin only)
 */
export const useDeletePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, topicId }: { pollId: string; topicId: string }) =>
      forumApi.deletePoll(pollId),
    onSuccess: (_, { pollId, topicId }) => {
      // Remove poll from cache
      queryClient.removeQueries({
        queryKey: pollKeys.detail(pollId),
      });

      // Remove topic-based poll cache
      queryClient.removeQueries({
        queryKey: pollKeys.byTopic(topicId),
      });

      // Invalidate topic query to remove poll from topic view
      queryClient.invalidateQueries({
        queryKey: ['topics', topicId],
      });
    },
  });
};
