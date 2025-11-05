/**
 * useReputation Hook
 * Fetches and manages user reputation data
 */

import { useSuspenseQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import type { UserReputation } from '../types';

interface UseReputationOptions {
  userId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch user reputation data
 * Uses Suspense for loading states
 */
export const useReputation = ({ userId, enabled = true }: UseReputationOptions) => {
  return useSuspenseQuery({
    queryKey: ['reputation', userId],
    queryFn: async () => {
      const response = await forumApi.getUserReputation(userId);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: enabled && !!userId,
  });
};

/**
 * Hook to check user permissions based on reputation
 */
export const useReputationPermissions = (userId: string | undefined) => {
  const { data: reputation } = useReputation({
    userId: userId || '',
    enabled: !!userId,
  });

  return {
    canDownvote: reputation?.permissions.canDownvote ?? false,
    canEditOthersContent: reputation?.permissions.canEditOthersContent ?? false,
    canModerate: reputation?.permissions.canModerate ?? false,
  };
};

/**
 * Hook to get reputation level info
 */
export const useReputationLevel = (userId: string | undefined) => {
  const { data: reputation } = useReputation({
    userId: userId || '',
    enabled: !!userId,
  });

  if (!reputation) {
    return null;
  }

  return {
    level: reputation.level,
    totalReputation: reputation.totalReputation,
    levelProgress: reputation.levelProgress,
  };
};

/**
 * Type-safe reputation data return
 */
export type ReputationData = UserReputation;

export default useReputation;
