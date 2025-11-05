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
  SearchQuery,
  SearchResponse,
  SearchSuggestionsResponse,
  PopularSearchesResponse,
  SavedSearchInput,
  SavedSearch,
  SavedSearchesResponse,
  SearchHistoryResponse,
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
   * Get unanswered questions (questions without accepted answers)
   * GET /api/forum/topics/unanswered
   */
  getUnansweredTopics: async (query?: Omit<TopicListQuery, 'type' | 'status'>) => {
    const params = new URLSearchParams();

    if (query) {
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.categoryId) params.append('categoryId', query.categoryId);
      if (query.tag) params.append('tag', query.tag);
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
    }

    const queryString = params.toString();
    const url = queryString ? `${FORUM_BASE}/topics/unanswered?${queryString}` : `${FORUM_BASE}/topics/unanswered`;

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

  // ========================================
  // REPORT ENDPOINTS
  // ========================================

  /**
   * Create a new report
   * POST /api/forum/reports
   */
  createReport: async (data: {
    reportableType: 'topic' | 'reply';
    reportableId: string;
    reason: string;
    description: string;
  }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { report: any };
    }>(`${FORUM_BASE}/reports`, data);
    return response.data;
  },

  /**
   * Get all reports (moderator only)
   * GET /api/forum/reports
   */
  getReports: async (filters?: {
    reason?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.reason) params.append('reason', filters.reason);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `${FORUM_BASE}/reports?${queryString}` : `${FORUM_BASE}/reports`;

    const response = await apiClient.get<{
      success: boolean;
      data: {
        reports: any[];
        pagination: {
          page: number;
          limit: number;
          totalCount: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
      };
    }>(url);
    return response.data;
  },

  /**
   * Get report statistics (moderator only)
   * GET /api/forum/reports/statistics
   */
  getReportStatistics: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        statistics: any;
      };
    }>(`${FORUM_BASE}/reports/statistics`);
    return response.data;
  },

  /**
   * Get single report by ID (moderator only)
   * GET /api/forum/reports/:id
   */
  getReportById: async (reportId: string) => {
    const response = await apiClient.get<{
      success: boolean;
      data: { report: any };
    }>(`${FORUM_BASE}/reports/${reportId}`);
    return response.data;
  },

  /**
   * Resolve a report (moderator only)
   * PUT /api/forum/reports/:id/resolve
   */
  resolveReport: async (reportId: string, data: { action: string; notes?: string }) => {
    const response = await apiClient.put<{
      success: boolean;
      data: { report: any };
    }>(`${FORUM_BASE}/reports/${reportId}/resolve`, data);
    return response.data;
  },

  /**
   * Batch resolve reports (moderator only)
   * POST /api/forum/reports/batch-resolve
   */
  batchResolveReports: async (data: {
    reportIds: string[];
    action: string;
    notes?: string;
  }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { resolved: number };
    }>(`${FORUM_BASE}/reports/batch-resolve`, data);
    return response.data;
  },

  // ========================================
  // MODERATION ENDPOINTS
  // ========================================

  /**
   * Move topic to different category (moderator only)
   * PUT /api/forum/topics/:id/move
   */
  moveTopic: async (topicId: string, categoryId: string, reason?: string) => {
    const response = await apiClient.put<TopicResponse>(
      `${FORUM_BASE}/topics/${topicId}/move`,
      { categoryId, reason }
    );
    return response.data.topic;
  },

  /**
   * Merge duplicate topics (moderator only)
   * POST /api/forum/topics/:id/merge
   */
  mergeTopics: async (sourceTopicId: string, targetTopicId: string, reason?: string) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${FORUM_BASE}/topics/${sourceTopicId}/merge`,
      { targetTopicId, reason }
    );
    return response;
  },

  /**
   * Hard delete topic (admin only)
   * DELETE /api/forum/topics/:id/hard
   */
  hardDeleteTopic: async (topicId: string, reason?: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `${FORUM_BASE}/topics/${topicId}/hard`,
      { data: { reason } }
    );
    return response;
  },

  /**
   * Hide reply (moderator only)
   * POST /api/forum/replies/:id/hide
   */
  hideReply: async (replyId: string, isHidden: boolean, reason?: string) => {
    const response = await apiClient.post<ReplyResponse>(
      `${FORUM_BASE}/replies/${replyId}/hide`,
      { isHidden, reason }
    );
    return response.data.reply;
  },

  /**
   * Edit reply as moderator
   * PUT /api/forum/replies/:id/moderate
   */
  moderateReply: async (replyId: string, content: string, reason?: string) => {
    const response = await apiClient.put<ReplyResponse>(
      `${FORUM_BASE}/replies/${replyId}/moderate`,
      { content, reason }
    );
    return response.data.reply;
  },

  /**
   * Warn user (moderator only)
   * POST /api/forum/users/:id/warn
   */
  warnUser: async (userId: string, reason: string) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${FORUM_BASE}/users/${userId}/warn`,
      { reason }
    );
    return response;
  },

  /**
   * Suspend user temporarily (moderator only)
   * POST /api/forum/users/:id/suspend
   */
  suspendUser: async (userId: string, reason: string, durationDays: number) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${FORUM_BASE}/users/${userId}/suspend`,
      { reason, durationDays }
    );
    return response;
  },

  /**
   * Ban user permanently (admin only)
   * POST /api/forum/users/:id/ban
   */
  banUser: async (userId: string, reason: string, isPermanent: boolean) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${FORUM_BASE}/users/${userId}/ban`,
      { reason, isPermanent }
    );
    return response;
  },

  /**
   * Get moderation logs
   * GET /api/forum/moderation/logs
   */
  getModerationLogs: async (page = 1, limit = 20) => {
    const response = await apiClient.get<any>(
      `${FORUM_BASE}/moderation/logs?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * Get moderation statistics
   * GET /api/forum/moderation/stats
   */
  getModerationStats: async () => {
    const response = await apiClient.get<any>(`${FORUM_BASE}/moderation/stats`);
    return response.data;
  },

  // ========================================
  // SEARCH ENDPOINTS
  // ========================================

  /**
   * Search forum topics and replies
   * GET /api/forum/search
   */
  search: async (query: SearchQuery) => {
    const params = new URLSearchParams();

    params.append('q', query.q);
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.categoryId) params.append('categoryId', query.categoryId);
    if (query.type) params.append('type', query.type);
    if (query.status) params.append('status', query.status);
    if (query.dateFrom) params.append('dateFrom', query.dateFrom);
    if (query.dateTo) params.append('dateTo', query.dateTo);
    if (query.hasCode !== undefined) params.append('hasCode', query.hasCode.toString());
    if (query.minUpvotes) params.append('minUpvotes', query.minUpvotes.toString());
    if (query.tag) params.append('tag', query.tag);

    const response = await apiClient.get<SearchResponse>(
      `${FORUM_BASE}/search?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get autocomplete suggestions
   * GET /api/forum/search/suggest
   */
  searchSuggestions: async (query: string) => {
    const response = await apiClient.get<SearchSuggestionsResponse>(
      `${FORUM_BASE}/search/suggest?q=${encodeURIComponent(query)}`
    );
    return response.data.suggestions;
  },

  /**
   * Get popular searches
   * GET /api/forum/search/popular
   */
  getPopularSearches: async () => {
    const response = await apiClient.get<PopularSearchesResponse>(
      `${FORUM_BASE}/search/popular`
    );
    return response.data.searches;
  },

  /**
   * Save a search
   * POST /api/forum/search/saved
   */
  saveSearch: async (data: SavedSearchInput) => {
    const response = await apiClient.post<{ success: boolean; data: { search: SavedSearch } }>(
      `${FORUM_BASE}/search/saved`,
      data
    );
    return response.data.search;
  },

  /**
   * Get saved searches
   * GET /api/forum/search/saved
   */
  getSavedSearches: async () => {
    const response = await apiClient.get<SavedSearchesResponse>(
      `${FORUM_BASE}/search/saved`
    );
    return response.data.searches;
  },

  /**
   * Delete a saved search
   * DELETE /api/forum/search/saved/:id
   */
  deleteSavedSearch: async (searchId: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `${FORUM_BASE}/search/saved/${searchId}`
    );
    return response;
  },

  /**
   * Get search history
   * GET /api/forum/search/history
   */
  getSearchHistory: async () => {
    const response = await apiClient.get<SearchHistoryResponse>(
      `${FORUM_BASE}/search/history`
    );
    return response.data.history;
  },

  // ========================================
  // LEADERBOARD ENDPOINTS
  // ========================================

  /**
   * Get weekly leaderboard
   * GET /api/leaderboards/weekly
   */
  getWeeklyLeaderboard: async () => {
    const response = await apiClient.get<any>('/leaderboards/weekly');
    return response.data;
  },

  /**
   * Get monthly leaderboard
   * GET /api/leaderboards/monthly
   */
  getMonthlyLeaderboard: async () => {
    const response = await apiClient.get<any>('/leaderboards/monthly');
    return response.data;
  },

  /**
   * Get all-time leaderboard
   * GET /api/leaderboards/all-time
   */
  getAllTimeLeaderboard: async () => {
    const response = await apiClient.get<any>('/leaderboards/all-time');
    return response.data;
  },

  /**
   * Get current user's ranks across all periods
   * GET /api/leaderboards/me
   */
  getCurrentUserRanks: async () => {
    const response = await apiClient.get<any>('/leaderboards/me');
    return response.data;
  },

  /**
   * Get hall of fame (archived top contributors)
   * GET /api/leaderboards/hall-of-fame
   */
  getHallOfFame: async () => {
    const response = await apiClient.get<any>('/leaderboards/hall-of-fame');
    return response.data;
  },

  // ========================================
  // POLL ENDPOINTS
  // ========================================

  /**
   * Create a new poll for a topic
   * POST /api/forum/polls
   */
  createPoll: async (data: {
    topicId: string;
    question: string;
    allowMultiple: boolean;
    isAnonymous: boolean;
    endsAt?: string;
    options: string[];
  }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { poll: any };
    }>(`${FORUM_BASE}/polls`, data);
    return response.data.poll;
  },

  /**
   * Get poll by ID
   * GET /api/forum/polls/:id
   */
  getPollById: async (pollId: string) => {
    const response = await apiClient.get<{
      success: boolean;
      data: { poll: any };
    }>(`${FORUM_BASE}/polls/${pollId}`);
    return response.data.poll;
  },

  /**
   * Get poll by topic ID
   * GET /api/forum/polls/topic/:topicId
   */
  getPollByTopicId: async (topicId: string) => {
    const response = await apiClient.get<{
      success: boolean;
      data: { poll: any };
    }>(`${FORUM_BASE}/polls/topic/${topicId}`);
    return response.data.poll;
  },

  /**
   * Vote on a poll
   * POST /api/forum/polls/:id/vote
   */
  voteOnPoll: async (pollId: string, optionIds: string[]) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { poll: any };
    }>(`${FORUM_BASE}/polls/${pollId}/vote`, { optionIds });
    return response.data.poll;
  },

  /**
   * Delete a poll (admin only)
   * DELETE /api/forum/polls/:id
   */
  deletePoll: async (pollId: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `${FORUM_BASE}/polls/${pollId}`
    );
    return response;
  },
};

export default forumApi;
