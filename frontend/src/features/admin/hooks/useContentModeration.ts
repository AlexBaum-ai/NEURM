/**
 * Content Moderation Hooks
 *
 * Custom hooks for fetching and managing content moderation data
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import type {
  ModerationFilters,
  ModerationAction,
  BulkModerationAction,
  ContentType,
} from '../types';
import { toast } from 'react-hot-toast';

interface UseContentQueueParams {
  page?: number;
  limit?: number;
  filters?: ModerationFilters;
  refetchInterval?: number;
}

/**
 * Hook for fetching content queue with filters
 */
export const useContentQueue = ({
  page = 1,
  limit = 20,
  filters,
  refetchInterval = 60000, // 60 seconds
}: UseContentQueueParams = {}) => {
  return useQuery({
    queryKey: ['admin', 'content-queue', page, limit, filters],
    queryFn: () => adminApi.getContentQueue({ page, limit, filters }),
    refetchInterval,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook for fetching content detail
 */
export const useContentDetail = (contentType: ContentType, contentId: string) => {
  return useQuery({
    queryKey: ['admin', 'content-detail', contentType, contentId],
    queryFn: () => adminApi.getContentDetail(contentType, contentId),
    enabled: !!contentType && !!contentId,
  });
};

/**
 * Hook for moderating content (single action)
 */
export const useModerateContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: ModerationAction) => adminApi.moderateContent(action),
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Content moderated successfully');

      // Invalidate content queue and detail queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content-detail', variables.contentType, variables.contentId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to moderate content');
    },
  });
};

/**
 * Hook for bulk moderation
 */
export const useBulkModerate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: BulkModerationAction) => adminApi.bulkModerateContent(action),
    onSuccess: (data) => {
      const affectedCount = data.affectedCount || 0;
      if (affectedCount > 0) {
        toast.success(`Successfully moderated ${affectedCount} item(s)`);
      } else {
        toast.success(data.message || 'Content moderated successfully');
      }

      // Invalidate content queue
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to perform bulk moderation');
    },
  });
};

/**
 * Hook for approving content
 */
export const useApproveContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contentType, contentId }: { contentType: ContentType; contentId: string }) =>
      adminApi.approveContent(contentType, contentId),
    onSuccess: (_, variables) => {
      toast.success('Content approved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content-detail', variables.contentType, variables.contentId],
      });
    },
    onError: () => {
      toast.error('Failed to approve content');
    },
  });
};

/**
 * Hook for rejecting content
 */
export const useRejectContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contentType,
      contentId,
      reason,
    }: {
      contentType: ContentType;
      contentId: string;
      reason?: string;
    }) => adminApi.rejectContent(contentType, contentId, reason),
    onSuccess: (_, variables) => {
      toast.success('Content rejected');
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content-detail', variables.contentType, variables.contentId],
      });
    },
    onError: () => {
      toast.error('Failed to reject content');
    },
  });
};

/**
 * Hook for hiding content
 */
export const useHideContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contentType,
      contentId,
      reason,
    }: {
      contentType: ContentType;
      contentId: string;
      reason?: string;
    }) => adminApi.hideContent(contentType, contentId, reason),
    onSuccess: (_, variables) => {
      toast.success('Content hidden');
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content-detail', variables.contentType, variables.contentId],
      });
    },
    onError: () => {
      toast.error('Failed to hide content');
    },
  });
};

/**
 * Hook for deleting content
 */
export const useDeleteContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contentType,
      contentId,
      reason,
    }: {
      contentType: ContentType;
      contentId: string;
      reason?: string;
    }) => adminApi.deleteContent(contentType, contentId, reason),
    onSuccess: (_, variables) => {
      toast.success('Content deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'content-detail', variables.contentType, variables.contentId],
      });
    },
    onError: () => {
      toast.error('Failed to delete content');
    },
  });
};
