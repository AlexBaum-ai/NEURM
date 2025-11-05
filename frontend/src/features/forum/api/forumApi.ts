/**
 * Forum API Client
 * Handles all API calls related to forum categories, topics, and replies
 */

import { apiClient } from '@/lib/api';
import type {
  CategoryTreeResponse,
  CategoryResponse,
  ModeratorsResponse,
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderCategoryInput,
  AssignModeratorInput,
  TopicResponse,
  TopicListResponse,
  TopicListQuery,
  CreateTopicInput,
  UpdateTopicInput,
  ReplyTreeResponse,
  ReplyResponse,
  CreateReplyInput,
  UpdateReplyInput,
  AcceptAnswerResponse,
  ReputationResponse,
} from '../types';

const FORUM_BASE = '/forum';

export const forumApi = {
  // ========================================
  // CATEGORY ENDPOINTS (Public)
  // ========================================

  /**
   * Get all categories with hierarchy
   * GET /api/forum/categories
   */
  getCategories: async () => {
    const response = await apiClient.get<CategoryTreeResponse>(`${FORUM_BASE}/categories`);
    return response.data;
  },

  /**
   * Get single category by slug
   * GET /api/forum/categories/:slug
   */
  getCategoryBySlug: async (slug: string) => {
    const response = await apiClient.get<CategoryResponse>(`${FORUM_BASE}/categories/${slug}`);
    return response.data.category;
  },

  /**
   * Get category moderators
   * GET /api/forum/categories/:id/moderators
   */
  getCategoryModerators: async (categoryId: string) => {
    const response = await apiClient.get<ModeratorsResponse>(
      `${FORUM_BASE}/categories/${categoryId}/moderators`
    );
    return response.data.moderators;
  },

  // ========================================
  // CATEGORY ENDPOINTS (Admin)
  // ========================================

  /**
   * Create new category (admin only)
   * POST /api/forum/categories
   */
  createCategory: async (data: CreateCategoryInput) => {
    const response = await apiClient.post<CategoryResponse>(`${FORUM_BASE}/categories`, data);
    return response.data.category;
  },

  /**
   * Update category (admin only)
   * PUT /api/forum/categories/:id
   */
  updateCategory: async (categoryId: string, data: UpdateCategoryInput) => {
    const response = await apiClient.put<CategoryResponse>(
      `${FORUM_BASE}/categories/${categoryId}`,
      data
    );
    return response.data.category;
  },

  /**
   * Delete category (admin only)
   * DELETE /api/forum/categories/:id
   */
  deleteCategory: async (categoryId: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `${FORUM_BASE}/categories/${categoryId}`
    );
    return response;
  },

  /**
   * Reorder categories (admin only)
   * PUT /api/forum/categories/reorder
   */
  reorderCategories: async (data: ReorderCategoryInput) => {
    const response = await apiClient.put<{ success: boolean; message: string }>(
      `${FORUM_BASE}/categories/reorder`,
      data
    );
    return response;
  },

  /**
   * Assign moderator to category (admin only)
   * POST /api/forum/categories/:id/moderators
   */
  assignModerator: async (categoryId: string, data: AssignModeratorInput) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${FORUM_BASE}/categories/${categoryId}/moderators`,
      data
    );
    return response;
  },

  /**
   * Remove moderator from category (admin only)
   * DELETE /api/forum/categories/:id/moderators/:userId
   */
  removeModerator: async (categoryId: string, userId: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `${FORUM_BASE}/categories/${categoryId}/moderators/${userId}`
    );
    return response;
  },

  // ========================================
  // CATEGORY FOLLOWING (Future)
  // ========================================

  /**
   * Follow a category
   * POST /api/forum/categories/:id/follow
   * (To be implemented in future sprint)
   */
  followCategory: async (categoryId: string) => {
    const response = await apiClient.post<{ success: boolean; isFollowing: boolean }>(
      `${FORUM_BASE}/categories/${categoryId}/follow`
    );
    return response;
  },

  /**
   * Unfollow a category
   * DELETE /api/forum/categories/:id/follow
   * (To be implemented in future sprint)
   */
  unfollowCategory: async (categoryId: string) => {
    const response = await apiClient.delete<{ success: boolean; isFollowing: boolean }>(
      `${FORUM_BASE}/categories/${categoryId}/follow`
    );
    return response;
  },

  // ========================================
  // TOPIC ENDPOINTS (Public)
  // ========================================

  /**
   * Get topics with filters and pagination
   * GET /api/forum/topics
   */
  getTopics: async (query?: TopicListQuery) => {
    const params = new URLSearchParams();

    if (query) {
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.categoryId) params.append('categoryId', query.categoryId);
      if (query.type) params.append('type', query.type);
      if (query.status) params.append('status', query.status);
      if (query.authorId) params.append('authorId', query.authorId);
      if (query.tag) params.append('tag', query.tag);
      if (query.search) params.append('search', query.search);
      if (query.hasCode !== undefined) params.append('hasCode', query.hasCode.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.includeDrafts) params.append('includeDrafts', 'true');
    }

    const queryString = params.toString();
    const url = queryString ? `${FORUM_BASE}/topics?${queryString}` : `${FORUM_BASE}/topics`;

    const response = await apiClient.get<TopicListResponse>(url);
    return response.data;
  },

  /**
   * Get single topic by ID
   * GET /api/forum/topics/:id
   */
  getTopicById: async (topicId: string) => {
    const response = await apiClient.get<TopicResponse>(`${FORUM_BASE}/topics/${topicId}`);
    return response.data.topic;
  },

  // ========================================
  // TOPIC ENDPOINTS (Authenticated)
  // ========================================

  /**
   * Create new topic
   * POST /api/forum/topics
   */
  createTopic: async (data: CreateTopicInput) => {
    const response = await apiClient.post<TopicResponse>(`${FORUM_BASE}/topics`, data);
    return response.data.topic;
  },

  /**
   * Update topic
   * PUT /api/forum/topics/:id
   */
  updateTopic: async (topicId: string, data: UpdateTopicInput) => {
    const response = await apiClient.put<TopicResponse>(
      `${FORUM_BASE}/topics/${topicId}`,
      data
    );
    return response.data.topic;
  },

  /**
   * Delete topic
   * DELETE /api/forum/topics/:id
   */
  deleteTopic: async (topicId: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `${FORUM_BASE}/topics/${topicId}`
    );
    return response;
  },

  // ========================================
  // TOPIC ENDPOINTS (Moderator)
  // ========================================

  /**
   * Pin/unpin topic (moderator only)
   * POST /api/forum/topics/:id/pin
   */
  pinTopic: async (topicId: string, isPinned: boolean) => {
    const response = await apiClient.post<TopicResponse>(
      `${FORUM_BASE}/topics/${topicId}/pin`,
      { isPinned }
    );
    return response.data.topic;
  },

  /**
   * Lock/unlock topic (moderator only)
   * POST /api/forum/topics/:id/lock
   */
  lockTopic: async (topicId: string, isLocked: boolean) => {
    const response = await apiClient.post<TopicResponse>(
      `${FORUM_BASE}/topics/${topicId}/lock`,
      { isLocked }
    );
    return response.data.topic;
  },

  // ========================================
  // REPLY ENDPOINTS
  // ========================================

  /**
   * Get replies for a topic (nested tree structure)
   * GET /api/forum/topics/:topicId/replies
   */
  getReplies: async (topicId: string, sortBy: 'oldest' | 'newest' | 'most_voted' = 'oldest') => {
    const response = await apiClient.get<ReplyTreeResponse>(
      `${FORUM_BASE}/topics/${topicId}/replies?sortBy=${sortBy}`
    );
    return response.data;
  },

  /**
   * Create a new reply
   * POST /api/forum/topics/:topicId/replies
   */
  createReply: async (data: CreateReplyInput) => {
    const response = await apiClient.post<ReplyResponse>(
      `${FORUM_BASE}/topics/${data.topicId}/replies`,
      data
    );
    return response.data.reply;
  },

  /**
   * Update a reply
   * PUT /api/forum/replies/:id
   */
  updateReply: async (replyId: string, data: UpdateReplyInput) => {
    const response = await apiClient.put<ReplyResponse>(
      `${FORUM_BASE}/replies/${replyId}`,
      data
    );
    return response.data.reply;
  },

  /**
   * Delete a reply (soft delete)
   * DELETE /api/forum/replies/:id
   */
  deleteReply: async (replyId: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `${FORUM_BASE}/replies/${replyId}`
    );
    return response;
  },

  /**
   * Accept answer (mark reply as accepted for questions)
   * POST /api/forum/topics/:topicId/accept-answer
   */
  acceptAnswer: async (topicId: string, replyId: string) => {
    const response = await apiClient.post<AcceptAnswerResponse>(
      `${FORUM_BASE}/topics/${topicId}/accept-answer`,
      { replyId }
    );
    return response.data.topic;
  },

  // ========================================
  // VOTING ENDPOINTS
  // ========================================

  /**
   * Vote on a topic
   * POST /api/forum/topics/:id/vote
   * @param topicId - The ID of the topic
   * @param voteType - Vote type: 1 (upvote), -1 (downvote), 0 (remove vote)
   */
  voteOnTopic: async (topicId: string, voteType: number) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { voteScore: number; userVote: number }
    }>(
      `${FORUM_BASE}/topics/${topicId}/vote`,
      { voteType }
    );
    return response.data;
  },

  /**
   * Vote on a reply
   * POST /api/forum/replies/:id/vote
   * @param replyId - The ID of the reply
   * @param voteType - Vote type: 1 (upvote), -1 (downvote), 0 (remove vote)
   */
  voteOnReply: async (replyId: string, voteType: number) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { voteScore: number; userVote: number }
    }>(
      `${FORUM_BASE}/replies/${replyId}/vote`,
      { voteType }
    );
    return response.data;
  },

  /**
   * Get current user's votes
   * GET /api/forum/votes/me
   * Returns a map of voteable IDs to vote types
   */
  getUserVotes: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        votes: Array<{
          voteableType: 'topic' | 'reply';
          voteableId: string;
          voteType: number;
        }>;
      };
    }>(`${FORUM_BASE}/votes/me`);
    return response.data;
  },

  // ========================================
  // REPUTATION ENDPOINTS
  // ========================================

  /**
   * Get user reputation with breakdown and history
   * GET /api/users/:userId/reputation
   */
  getUserReputation: async (userId: string) => {
    const response = await apiClient.get<ReputationResponse>(`/users/${userId}/reputation`);
    return response.data;
  },
};

export default forumApi;
