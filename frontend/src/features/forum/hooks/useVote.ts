/**
 * useVote Hook
 * Handles voting on topics and replies with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { forumApi } from '../api/forumApi';
import { useForumStore } from '../store/forumStore';
import { useAuthStore } from '@/store/authStore';
import { calculateNewVote, calculateNewScore } from '../utils/voteUtils';
import type { VoteableType, VoteType } from '../types';

interface UseVoteOptions {
  voteableType: VoteableType;
  voteableId: string;
  currentScore: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface VoteContext {
  previousScore: number;
  previousVote: VoteType;
}

/**
 * Hook to handle voting on topics or replies
 * Implements optimistic updates with rollback on error
 */
export const useVote = (options: UseVoteOptions) => {
  const { voteableType, voteableId, currentScore, onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const { setVote, getUserVote } = useForumStore();
  const { isAuthenticated, user } = useAuthStore();

  // Check if user has sufficient reputation for downvoting
  const canDownvote = user?.role === 'admin' || user?.role === 'moderator'; // Simplified check
  // TODO: Replace with actual reputation check when reputation system is integrated
  // const canDownvote = user?.reputation && user.reputation >= 50;

  const voteMutation = useMutation({
    mutationFn: async (voteType: number) => {
      if (voteableType === 'topic') {
        return forumApi.voteOnTopic(voteableId, voteType);
      } else {
        return forumApi.voteOnReply(voteableId, voteType);
      }
    },
    onMutate: async (newVoteType: number): Promise<VoteContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [voteableType, voteableId] });

      // Save current state for rollback
      const previousVote = getUserVote(voteableType, voteableId);
      const previousScore = currentScore;

      // Optimistically update the vote in store
      setVote(voteableType, voteableId, newVoteType as VoteType);

      // Calculate and update optimistic score in cache
      const newScore = calculateNewScore(currentScore, previousVote, newVoteType);

      // Update the query cache based on type
      if (voteableType === 'topic') {
        queryClient.setQueryData(['topic', voteableId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            voteScore: newScore,
            userVote: newVoteType,
          };
        });
      } else {
        // Update reply in the replies tree
        queryClient.setQueryData(['replies', voteableId], (old: any) => {
          if (!old?.data?.replies) return old;
          return {
            ...old,
            data: {
              ...old.data,
              replies: updateReplyInTree(old.data.replies, voteableId, newScore, newVoteType),
            },
          };
        });
      }

      return { previousScore, previousVote };
    },
    onError: (error, _newVoteType, context) => {
      // Rollback on error
      if (context) {
        setVote(voteableType, voteableId, context.previousVote);

        // Rollback cache
        if (voteableType === 'topic') {
          queryClient.setQueryData(['topic', voteableId], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              voteScore: context.previousScore,
              userVote: context.previousVote,
            };
          });
        } else {
          queryClient.setQueryData(['replies', voteableId], (old: any) => {
            if (!old?.data?.replies) return old;
            return {
              ...old,
              data: {
                ...old.data,
                replies: updateReplyInTree(
                  old.data.replies,
                  voteableId,
                  context.previousScore,
                  context.previousVote
                ),
              },
            };
          });
        }
      }

      onError?.(error as Error);
    },
    onSuccess: (data) => {
      // Update with actual server data
      setVote(voteableType, voteableId, data.data.userVote as VoteType);

      // Invalidate related queries to refetch
      queryClient.invalidateQueries({ queryKey: [voteableType, voteableId] });
      queryClient.invalidateQueries({ queryKey: ['user-votes'] });

      onSuccess?.();
    },
  });

  const handleUpvote = useCallback(() => {
    if (!isAuthenticated) {
      // TODO: Show login modal or toast
      console.warn('Must be authenticated to vote');
      return;
    }

    const currentVote = getUserVote(voteableType, voteableId);
    const newVote = calculateNewVote(currentVote, 1);
    voteMutation.mutate(newVote);
  }, [isAuthenticated, voteableType, voteableId, getUserVote, voteMutation]);

  const handleDownvote = useCallback(() => {
    if (!isAuthenticated) {
      console.warn('Must be authenticated to vote');
      return;
    }

    if (!canDownvote) {
      console.warn('Insufficient reputation to downvote');
      return;
    }

    const currentVote = getUserVote(voteableType, voteableId);
    const newVote = calculateNewVote(currentVote, -1);
    voteMutation.mutate(newVote);
  }, [isAuthenticated, canDownvote, voteableType, voteableId, getUserVote, voteMutation]);

  return {
    upvote: handleUpvote,
    downvote: handleDownvote,
    isVoting: voteMutation.isPending,
    error: voteMutation.error,
    canDownvote,
    currentVote: getUserVote(voteableType, voteableId),
  };
};

/**
 * Helper function to update a reply in a nested tree structure
 */
function updateReplyInTree(
  replies: any[],
  replyId: string,
  newScore: number,
  newVote: number
): any[] {
  return replies.map((reply) => {
    if (reply.id === replyId) {
      return {
        ...reply,
        voteScore: newScore,
        userVote: newVote,
      };
    }

    // Recursively update children
    if (reply.children && reply.children.length > 0) {
      return {
        ...reply,
        children: updateReplyInTree(reply.children, replyId, newScore, newVote),
      };
    }

    return reply;
  });
}

export default useVote;
