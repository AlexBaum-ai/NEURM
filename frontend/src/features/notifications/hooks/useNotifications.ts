/**
 * useNotifications Hook
 * Manages notification fetching with real-time updates
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../api/notificationsApi';
import type { NotificationFilters } from '../types';

const NOTIFICATIONS_QUERY_KEY = 'notifications';
const UNREAD_COUNT_QUERY_KEY = 'notifications-unread-count';
const POLLING_INTERVAL = 30000; // 30 seconds

/**
 * Hook for fetching paginated notifications with infinite scroll
 */
export const useNotifications = (filters: NotificationFilters = {}) => {
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, filters],
    queryFn: ({ pageParam = 0 }) =>
      getNotifications({
        ...filters,
        limit: filters.limit || 20,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.reduce((acc, page) => acc + page.notifications.length, 0);
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60, // 1 minute
  });

  // Flatten paginated data
  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  return {
    notifications,
    total,
    unreadCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  };
};

/**
 * Hook for fetching unread notification count with real-time polling
 */
export const useUnreadCount = (enablePolling = true) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [UNREAD_COUNT_QUERY_KEY],
    queryFn: getUnreadCount,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: enablePolling ? POLLING_INTERVAL : false,
  });

  return {
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    refetch,
  };
};

/**
 * Hook for marking notification as read
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
    },
  });
};

/**
 * Hook for marking all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
    },
  });
};

/**
 * Hook for deleting a notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
    },
  });
};

/**
 * Hook for notification sound
 */
export const useNotificationSound = (enabled = true) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousCountRef = useRef<number>(0);

  useEffect(() => {
    if (enabled && !audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.5;
    }
  }, [enabled]);

  const playSound = useCallback(() => {
    if (enabled && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.warn('Failed to play notification sound:', error);
      });
    }
  }, [enabled]);

  // Monitor unread count for changes
  const { unreadCount } = useUnreadCount(enabled);

  useEffect(() => {
    if (unreadCount > previousCountRef.current && previousCountRef.current > 0) {
      playSound();
    }
    previousCountRef.current = unreadCount;
  }, [unreadCount, playSound]);

  return { playSound };
};

/**
 * Hook for optimistic notification updates
 */
export const useOptimisticNotificationUpdate = () => {
  const queryClient = useQueryClient();

  const markAsReadOptimistically = useCallback(
    (notificationId: string) => {
      // Optimistically update cache
      queryClient.setQueryData([NOTIFICATIONS_QUERY_KEY], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            notifications: page.notifications.map((notification: any) =>
              notification.id === notificationId
                ? { ...notification, readAt: new Date().toISOString() }
                : notification
            ),
            unreadCount: Math.max(0, page.unreadCount - 1),
          })),
        };
      });

      // Update unread count
      queryClient.setQueryData([UNREAD_COUNT_QUERY_KEY], (old: any) => ({
        unreadCount: Math.max(0, (old?.unreadCount ?? 1) - 1),
      }));
    },
    [queryClient]
  );

  const deleteOptimistically = useCallback(
    (notificationId: string) => {
      // Optimistically remove from cache
      queryClient.setQueryData([NOTIFICATIONS_QUERY_KEY], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            notifications: page.notifications.filter(
              (notification: any) => notification.id !== notificationId
            ),
            total: page.total - 1,
          })),
        };
      });
    },
    [queryClient]
  );

  return {
    markAsReadOptimistically,
    deleteOptimistically,
  };
};
