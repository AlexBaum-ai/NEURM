/**
 * Endorsements Hooks
 *
 * React Query hooks for skill endorsement operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endorsementsApi } from '../api/endorsementsApi';
import type { EndorsementsListResponse } from '../types/candidates';

/**
 * Hook to get endorsements for a skill
 */
export const useEndorsements = (username: string, skillId: string, enabled = true) => {
  return useQuery<EndorsementsListResponse>({
    queryKey: ['endorsements', username, skillId],
    queryFn: () => endorsementsApi.getEndorsements(username, skillId, { limit: 50, offset: 0 }),
    enabled: enabled && !!username && !!skillId,
  });
};

/**
 * Hook to endorse a skill
 */
export const useEndorseSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, skillId }: { username: string; skillId: string }) =>
      endorsementsApi.endorseSkill(username, skillId),
    onSuccess: (_, variables) => {
      // Invalidate endorsements list
      queryClient.invalidateQueries({
        queryKey: ['endorsements', variables.username, variables.skillId],
      });
      // Invalidate candidate profile to refresh endorsement counts
      queryClient.invalidateQueries({
        queryKey: ['candidate'],
      });
    },
  });
};

/**
 * Hook to unendorse a skill
 */
export const useUnendorseSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, skillId }: { username: string; skillId: string }) =>
      endorsementsApi.unendorseSkill(username, skillId),
    onSuccess: (_, variables) => {
      // Invalidate endorsements list
      queryClient.invalidateQueries({
        queryKey: ['endorsements', variables.username, variables.skillId],
      });
      // Invalidate candidate profile to refresh endorsement counts
      queryClient.invalidateQueries({
        queryKey: ['candidate'],
      });
    },
  });
};
