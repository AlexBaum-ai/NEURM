import { apiClient } from '@/lib/api';
import type {
  UserActivitiesResponse,
  FollowingFeedResponse,
  GetUserActivitiesParams,
  GetFollowingFeedParams,
} from '../types';

/**
 * Activities API Client
 *
 * Provides methods to fetch user activities and following feed.
 * Connects to backend endpoints:
 * - GET /api/v1/users/:username/activity
 * - GET /api/v1/following/feed
 */
export const activitiesApi = {
  /**
   * Get activities for a specific user
   * Supports filtering by activity type and pagination
   */
  async getUserActivities(params: GetUserActivitiesParams): Promise<UserActivitiesResponse> {
    const { username, type, limit = 20, offset = 0 } = params;

    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());

    const url = `/users/${username}/activity?${queryParams.toString()}`;
    const response = await apiClient.get<UserActivitiesResponse>(url);

    return response;
  },

  /**
   * Get activity feed from followed users
   * Requires authentication
   */
  async getFollowingFeed(params: GetFollowingFeedParams): Promise<FollowingFeedResponse> {
    const { type, limit = 20, offset = 0 } = params;

    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());

    const url = `/following/feed?${queryParams.toString()}`;
    const response = await apiClient.get<FollowingFeedResponse>(url);

    return response;
  },
};
