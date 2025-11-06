import { useInfiniteQuery } from '@tanstack/react-query';
import { activitiesApi } from '../api/activitiesApi';
import type { ActivityType, UserActivitiesResponse, FollowingFeedResponse } from '../types';

/**
 * Query keys for activities
 */
export const activityKeys = {
  all: ['activities'] as const,
  userActivities: (username: string, type?: ActivityType) =>
    [...activityKeys.all, 'user', username, type] as const,
  followingFeed: (type?: ActivityType) => [...activityKeys.all, 'following', type] as const,
};

/**
 * Hook to fetch user activities with infinite scroll
 *
 * @param username - Username of the user
 * @param type - Optional activity type filter
 * @returns Infinite query result with activities data
 */
export const useUserActivities = (username: string, type?: ActivityType) => {
  return useInfiniteQuery({
    queryKey: activityKeys.userActivities(username, type),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await activitiesApi.getUserActivities({
        username,
        type,
        limit: 20,
        offset: pageParam,
      });
      return response;
    },
    getNextPageParam: (lastPage: UserActivitiesResponse) => {
      return lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined;
    },
    initialPageParam: 0,
  });
};

/**
 * Hook to fetch following feed activities with infinite scroll
 * Requires authentication
 *
 * @param type - Optional activity type filter
 * @returns Infinite query result with following feed data
 */
export const useFollowingFeedActivities = (type?: ActivityType) => {
  return useInfiniteQuery({
    queryKey: activityKeys.followingFeed(type),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await activitiesApi.getFollowingFeed({
        type,
        limit: 20,
        offset: pageParam,
      });
      return response;
    },
    getNextPageParam: (lastPage: FollowingFeedResponse) => {
      return lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined;
    },
    initialPageParam: 0,
  });
};
