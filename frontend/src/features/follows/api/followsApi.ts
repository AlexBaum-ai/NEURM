import api from '@/lib/api';
import type {
  FollowActionResponse,
  FollowStatusResponse,
  FollowingListResponse,
  FollowersListResponse,
  ActivityFeedResponse,
  FollowSuggestionsResponse,
  FollowEntityType,
} from '../types';

interface FollowParams {
  entityType: FollowEntityType;
  entityId: number;
}

interface GetFollowingParams {
  userId: number;
  type?: FollowEntityType;
  page?: number;
  limit?: number;
}

interface GetFollowersParams {
  userId: number;
  page?: number;
  limit?: number;
}

interface GetActivityFeedParams {
  type?: 'article' | 'forum_post' | 'job';
  page?: number;
  limit?: number;
}

interface CheckFollowStatusParams {
  entityType: FollowEntityType;
  entityId: number;
}

export const followsApi = {
  // Create a follow
  follow: async (params: FollowParams): Promise<FollowActionResponse> => {
    const response = await api.post<{ data: FollowActionResponse }>('/follows', params);
    return response.data;
  },

  // Remove a follow
  unfollow: async (followId: number): Promise<FollowActionResponse> => {
    const response = await api.delete<{ data: FollowActionResponse }>(`/follows/${followId}`);
    return response.data;
  },

  // Get following list for a user
  getFollowing: async (params: GetFollowingParams): Promise<FollowingListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<{ data: FollowingListResponse }>(
      `/users/${params.userId}/following?${queryParams.toString()}`
    );
    return response.data;
  },

  // Get followers list for a user
  getFollowers: async (params: GetFollowersParams): Promise<FollowersListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<{ data: FollowersListResponse }>(
      `/users/${params.userId}/followers?${queryParams.toString()}`
    );
    return response.data;
  },

  // Get activity feed from followed entities
  getActivityFeed: async (params: GetActivityFeedParams = {}): Promise<ActivityFeedResponse> => {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<{ data: ActivityFeedResponse }>(
      `/following/feed?${queryParams.toString()}`
    );
    return response.data;
  },

  // Check if currently following an entity
  checkFollowStatus: async (params: CheckFollowStatusParams): Promise<FollowStatusResponse> => {
    const queryParams = new URLSearchParams({
      entityType: params.entityType,
      entityId: params.entityId.toString(),
    });

    const response = await api.get<{ data: FollowStatusResponse }>(
      `/follows/check?${queryParams.toString()}`
    );
    return response.data;
  },

  // Get follow suggestions
  getSuggestions: async (): Promise<FollowSuggestionsResponse> => {
    const response = await api.get<{ data: FollowSuggestionsResponse }>('/follows/suggestions');
    return response.data;
  },
};
