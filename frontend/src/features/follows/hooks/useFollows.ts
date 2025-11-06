import { useSuspenseQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followsApi } from '../api/followsApi';
import type {
  FollowEntityType,
  FollowingListResponse,
  FollowersListResponse,
  ActivityFeedResponse,
  FollowSuggestionsResponse,
} from '../types';
import toast from 'react-hot-toast';

// Query keys
export const followKeys = {
  all: ['follows'] as const,
  following: (userId: number, type?: FollowEntityType) =>
    [...followKeys.all, 'following', userId, type] as const,
  followers: (userId: number) => [...followKeys.all, 'followers', userId] as const,
  feed: (type?: string) => [...followKeys.all, 'feed', type] as const,
  status: (entityType: FollowEntityType, entityId: number) =>
    [...followKeys.all, 'status', entityType, entityId] as const,
  suggestions: () => [...followKeys.all, 'suggestions'] as const,
};

// Get following list (infinite scroll)
export const useFollowing = (userId: number, type?: FollowEntityType) => {
  return useInfiniteQuery({
    queryKey: followKeys.following(userId, type),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await followsApi.getFollowing({
        userId,
        type,
        page: pageParam,
        limit: 20,
      });
      return response;
    },
    getNextPageParam: (lastPage: FollowingListResponse) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

// Get followers list (infinite scroll)
export const useFollowers = (userId: number) => {
  return useInfiniteQuery({
    queryKey: followKeys.followers(userId),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await followsApi.getFollowers({
        userId,
        page: pageParam,
        limit: 20,
      });
      return response;
    },
    getNextPageParam: (lastPage: FollowersListResponse) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

// Get activity feed (infinite scroll)
export const useActivityFeed = (type?: 'article' | 'forum_post' | 'job') => {
  return useInfiniteQuery({
    queryKey: followKeys.feed(type),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await followsApi.getActivityFeed({
        type,
        page: pageParam,
        limit: 20,
      });
      return response;
    },
    getNextPageParam: (lastPage: ActivityFeedResponse) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

// Check follow status
export const useFollowStatus = (entityType: FollowEntityType, entityId: number) => {
  return useSuspenseQuery({
    queryKey: followKeys.status(entityType, entityId),
    queryFn: async () => {
      const response = await followsApi.checkFollowStatus({ entityType, entityId });
      return response;
    },
  });
};

// Get follow suggestions
export const useFollowSuggestions = () => {
  return useSuspenseQuery({
    queryKey: followKeys.suggestions(),
    queryFn: async () => {
      const response = await followsApi.getSuggestions();
      return response;
    },
  });
};

// Follow mutation
export const useFollow = (entityType: FollowEntityType, entityId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await followsApi.follow({ entityType, entityId });
      return response;
    },
    onMutate: async () => {
      // Optimistically update the follow status
      await queryClient.cancelQueries({ queryKey: followKeys.status(entityType, entityId) });

      const previousStatus = queryClient.getQueryData(followKeys.status(entityType, entityId));

      queryClient.setQueryData(followKeys.status(entityType, entityId), {
        isFollowing: true,
        followId: -1, // Temporary ID
      });

      return { previousStatus };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousStatus) {
        queryClient.setQueryData(followKeys.status(entityType, entityId), context.previousStatus);
      }
      toast.error('Failed to follow. Please try again.');
    },
    onSuccess: (data) => {
      // Update the status with real data
      queryClient.setQueryData(followKeys.status(entityType, entityId), {
        isFollowing: data.isFollowing,
        followId: data.followId,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: followKeys.all });
      queryClient.invalidateQueries({ queryKey: followKeys.feed() });

      toast.success('Successfully followed!');
    },
  });
};

// Unfollow mutation
export const useUnfollow = (followId: number, entityType: FollowEntityType, entityId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await followsApi.unfollow(followId);
      return response;
    },
    onMutate: async () => {
      // Optimistically update the follow status
      await queryClient.cancelQueries({ queryKey: followKeys.status(entityType, entityId) });

      const previousStatus = queryClient.getQueryData(followKeys.status(entityType, entityId));

      queryClient.setQueryData(followKeys.status(entityType, entityId), {
        isFollowing: false,
        followId: null,
      });

      return { previousStatus };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousStatus) {
        queryClient.setQueryData(followKeys.status(entityType, entityId), context.previousStatus);
      }
      toast.error('Failed to unfollow. Please try again.');
    },
    onSuccess: (data) => {
      // Update the status with real data
      queryClient.setQueryData(followKeys.status(entityType, entityId), {
        isFollowing: data.isFollowing,
        followId: null,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: followKeys.all });
      queryClient.invalidateQueries({ queryKey: followKeys.feed() });

      toast.success('Successfully unfollowed');
    },
  });
};
