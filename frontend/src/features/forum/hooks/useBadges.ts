/**
 * Badge Hooks
 * React Query hooks for fetching and managing badge data
 */

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { badgeApi } from '../api/badgeApi';
import type {
  Badge,
  BadgeFilters,
  UserBadgesResponse,
  BadgeProgressResponse,
} from '../types/badge';

// ========================================
// Query Keys
// ========================================

export const badgeKeys = {
  all: ['badges'] as const,
  lists: () => [...badgeKeys.all, 'list'] as const,
  list: (filters?: BadgeFilters) => [...badgeKeys.lists(), filters] as const,
  details: () => [...badgeKeys.all, 'detail'] as const,
  detail: (badgeId: string) => [...badgeKeys.details(), badgeId] as const,
  userBadges: (userId: string) => [...badgeKeys.all, 'user', userId] as const,
  userBadgesWithFilters: (userId: string, filters?: BadgeFilters) =>
    [...badgeKeys.userBadges(userId), filters] as const,
  userProgress: (userId: string) => [...badgeKeys.all, 'user', userId, 'progress'] as const,
  categories: () => [...badgeKeys.all, 'categories'] as const,
  stats: (userId: string) => [...badgeKeys.all, 'user', userId, 'stats'] as const,
};

// ========================================
// Badge Hooks
// ========================================

/**
 * Fetch all available badges (with Suspense)
 */
export const useBadges = (filters?: BadgeFilters) => {
  return useSuspenseQuery({
    queryKey: badgeKeys.list(filters),
    queryFn: () => badgeApi.getAllBadges(filters),
  });
};

/**
 * Fetch all available badges (without Suspense)
 */
export const useBadgesQuery = (filters?: BadgeFilters, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: badgeKeys.list(filters),
    queryFn: () => badgeApi.getAllBadges(filters),
    ...options,
  });
};

/**
 * Fetch single badge details (with Suspense)
 */
export const useBadge = (badgeId: string) => {
  return useSuspenseQuery({
    queryKey: badgeKeys.detail(badgeId),
    queryFn: () => badgeApi.getBadgeById(badgeId),
  });
};

/**
 * Fetch single badge details (without Suspense)
 */
export const useBadgeQuery = (badgeId: string, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: badgeKeys.detail(badgeId),
    queryFn: () => badgeApi.getBadgeById(badgeId),
    enabled: !!badgeId,
    ...options,
  });
};

// ========================================
// User Badge Hooks
// ========================================

/**
 * Fetch user's badges and progress (with Suspense)
 */
export const useUserBadges = (userId: string, filters?: BadgeFilters) => {
  return useSuspenseQuery({
    queryKey: badgeKeys.userBadgesWithFilters(userId, filters),
    queryFn: () => badgeApi.getUserBadges(userId, filters),
  });
};

/**
 * Fetch user's badges and progress (without Suspense)
 */
export const useUserBadgesQuery = (
  userId: string,
  filters?: BadgeFilters,
  options?: UseQueryOptions<UserBadgesResponse>
) => {
  return useQuery({
    queryKey: badgeKeys.userBadgesWithFilters(userId, filters),
    queryFn: () => badgeApi.getUserBadges(userId, filters),
    enabled: !!userId,
    ...options,
  });
};

/**
 * Fetch user's badge progress (with Suspense)
 */
export const useUserBadgeProgress = (userId: string) => {
  return useSuspenseQuery({
    queryKey: badgeKeys.userProgress(userId),
    queryFn: () => badgeApi.getUserBadgeProgress(userId),
  });
};

/**
 * Fetch user's badge progress (without Suspense)
 */
export const useUserBadgeProgressQuery = (
  userId: string,
  options?: UseQueryOptions<BadgeProgressResponse>
) => {
  return useQuery({
    queryKey: badgeKeys.userProgress(userId),
    queryFn: () => badgeApi.getUserBadgeProgress(userId),
    enabled: !!userId,
    ...options,
  });
};

/**
 * Fetch current authenticated user's badges (with Suspense)
 */
export const useCurrentUserBadges = (filters?: BadgeFilters) => {
  return useSuspenseQuery({
    queryKey: [...badgeKeys.all, 'current-user', filters],
    queryFn: () => badgeApi.getCurrentUserBadges(filters),
  });
};

/**
 * Fetch current authenticated user's badges (without Suspense)
 */
export const useCurrentUserBadgesQuery = (
  filters?: BadgeFilters,
  options?: UseQueryOptions<UserBadgesResponse>
) => {
  return useQuery({
    queryKey: [...badgeKeys.all, 'current-user', filters],
    queryFn: () => badgeApi.getCurrentUserBadges(filters),
    ...options,
  });
};

// ========================================
// Badge Category Hooks
// ========================================

/**
 * Fetch all badge categories (with Suspense)
 */
export const useBadgeCategories = () => {
  return useSuspenseQuery({
    queryKey: badgeKeys.categories(),
    queryFn: () => badgeApi.getBadgeCategories(),
  });
};

/**
 * Fetch all badge categories (without Suspense)
 */
export const useBadgeCategoriesQuery = (options?: UseQueryOptions<string[]>) => {
  return useQuery({
    queryKey: badgeKeys.categories(),
    queryFn: () => badgeApi.getBadgeCategories(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    ...options,
  });
};

// ========================================
// Badge Statistics Hooks
// ========================================

/**
 * Fetch user badge statistics (with Suspense)
 */
export const useUserBadgeStats = (userId: string) => {
  return useSuspenseQuery({
    queryKey: badgeKeys.stats(userId),
    queryFn: () => badgeApi.getUserBadgeStats(userId),
  });
};

/**
 * Fetch user badge statistics (without Suspense)
 */
export const useUserBadgeStatsQuery = (userId: string, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: badgeKeys.stats(userId),
    queryFn: () => badgeApi.getUserBadgeStats(userId),
    enabled: !!userId,
    ...options,
  });
};
