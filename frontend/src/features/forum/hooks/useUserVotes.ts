/**
 * useUserVotes Hook
 * Fetches and caches the current user's votes
 */

import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { forumApi } from '../api/forumApi';
import { useForumStore } from '../store/forumStore';
import { useAuthStore } from '@/store/authStore';
import type { VotesMap } from '../types';

/**
 * Hook to fetch and manage user's votes
 * Uses Suspense for loading states
 */
export const useUserVotes = () => {
  const { isAuthenticated } = useAuthStore();
  const { setUserVotes } = useForumStore();

  const query = useSuspenseQuery({
    queryKey: ['user-votes'],
    queryFn: async () => {
      if (!isAuthenticated) {
        return { data: { votes: [] } };
      }

      const response = await forumApi.getUserVotes();
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update store when votes are fetched
  useEffect(() => {
    if (query.data?.data.votes) {
      const votesMap: VotesMap = {};

      query.data.data.votes.forEach((vote) => {
        const key = `${vote.voteableType}:${vote.voteableId}`;
        votesMap[key] = vote.voteType as 1 | -1 | 0;
      });

      setUserVotes(votesMap);
    }
  }, [query.data, setUserVotes]);

  return {
    votes: query.data?.data.votes || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};

export default useUserVotes;
