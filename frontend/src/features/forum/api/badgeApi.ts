/**
 * Badge API Client
 * Handles all API calls related to badges and user badge progress
 */

import { apiClient } from '@/lib/api';
import type {
  Badge,
  BadgesResponse,
  UserBadgesResponse,
  BadgeProgressResponse,
  BadgeDetailResponse,
  BadgeFilters,
} from '../types/badge';

const FORUM_BASE = '/forum';

export const badgeApi = {
  // ========================================
  // BADGE ENDPOINTS (Public)
  // ========================================

  /**
   * Get all available badges
   * GET /api/forum/badges
   */
  getAllBadges: async (filters?: BadgeFilters) => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type) params.append('type', filters.type);
      if (filters.rarity) params.append('rarity', filters.rarity);
      if (filters.category) params.append('category', filters.category);
      if (filters.searchQuery) params.append('q', filters.searchQuery);
    }

    const queryString = params.toString();
    const url = queryString ? `${FORUM_BASE}/badges?${queryString}` : `${FORUM_BASE}/badges`;

    const response = await apiClient.get<BadgesResponse>(url);
    return response.data;
  },

  /**
   * Get single badge details
   * GET /api/forum/badges/:badgeId
   */
  getBadgeById: async (badgeId: string) => {
    const response = await apiClient.get<BadgeDetailResponse>(
      `${FORUM_BASE}/badges/${badgeId}`
    );
    return response.data;
  },

  // ========================================
  // USER BADGE ENDPOINTS (Authenticated)
  // ========================================

  /**
   * Get user's earned badges and progress
   * GET /api/users/:userId/badges
   */
  getUserBadges: async (userId: string, filters?: BadgeFilters) => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type) params.append('type', filters.type);
      if (filters.rarity) params.append('rarity', filters.rarity);
      if (filters.category) params.append('category', filters.category);
      if (filters.earnedStatus) params.append('status', filters.earnedStatus);
    }

    const queryString = params.toString();
    const url = queryString
      ? `/users/${userId}/badges?${queryString}`
      : `/users/${userId}/badges`;

    const response = await apiClient.get<UserBadgesResponse>(url);
    return response.data;
  },

  /**
   * Get current user's badge progress
   * GET /api/users/:userId/badges/progress
   */
  getUserBadgeProgress: async (userId: string) => {
    const response = await apiClient.get<BadgeProgressResponse>(
      `/users/${userId}/badges/progress`
    );
    return response.data;
  },

  /**
   * Get current authenticated user's badges
   * GET /api/users/me/badges
   */
  getCurrentUserBadges: async (filters?: BadgeFilters) => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type) params.append('type', filters.type);
      if (filters.rarity) params.append('rarity', filters.rarity);
      if (filters.category) params.append('category', filters.category);
      if (filters.earnedStatus) params.append('status', filters.earnedStatus);
    }

    const queryString = params.toString();
    const url = queryString ? `/users/me/badges?${queryString}` : `/users/me/badges`;

    const response = await apiClient.get<UserBadgesResponse>(url);
    return response.data;
  },

  /**
   * Get current authenticated user's badge progress
   * GET /api/users/me/badges/progress
   */
  getCurrentUserBadgeProgress: async () => {
    const response = await apiClient.get<BadgeProgressResponse>('/users/me/badges/progress');
    return response.data;
  },

  // ========================================
  // BADGE CATEGORIES
  // ========================================

  /**
   * Get all badge categories
   * GET /api/forum/badges/categories
   */
  getBadgeCategories: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: { categories: string[] };
    }>(`${FORUM_BASE}/badges/categories`);
    return response.data.categories;
  },

  // ========================================
  // BADGE STATISTICS
  // ========================================

  /**
   * Get badge statistics for a user
   * GET /api/users/:userId/badges/stats
   */
  getUserBadgeStats: async (userId: string) => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        totalBadges: number;
        earnedBadges: number;
        lockedBadges: number;
        byType: Record<string, number>;
        byRarity: Record<string, number>;
      };
    }>(`/users/${userId}/badges/stats`);
    return response.data;
  },

  // ========================================
  // BADGE SHARING
  // ========================================

  /**
   * Generate shareable badge image
   * GET /api/users/:userId/badges/:badgeId/share
   */
  generateShareableBadge: async (userId: string, badgeId: string) => {
    const response = await apiClient.get<{
      success: boolean;
      data: { shareUrl: string; imageUrl: string };
    }>(`/users/${userId}/badges/${badgeId}/share`);
    return response.data;
  },
};

export default badgeApi;
