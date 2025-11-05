import { apiClient } from '@/lib/api';
import type {
  Prompt,
  CreatePromptDto,
  UpdatePromptDto,
  PromptsQueryParams,
  PromptsResponse,
  RatePromptDto,
  VotePromptDto,
} from '../types/prompt';
import type { ForumReply, CreateReplyInput, ReplyTreeResponse } from '../types';

const BASE_URL = '/forum/prompts';

export const promptsApi = {
  /**
   * Get list of prompts with filters and pagination
   */
  async getPrompts(params?: PromptsQueryParams): Promise<PromptsResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = queryParams.toString() ? `${BASE_URL}?${queryParams}` : BASE_URL;
    return apiClient.get<PromptsResponse>(url);
  },

  /**
   * Get single prompt by ID
   */
  async getPromptById(id: string): Promise<{ prompt: Prompt }> {
    return apiClient.get<{ prompt: Prompt }>(`${BASE_URL}/${id}`);
  },

  /**
   * Create new prompt
   */
  async createPrompt(data: CreatePromptDto): Promise<{ prompt: Prompt }> {
    return apiClient.post<{ prompt: Prompt }>(BASE_URL, data);
  },

  /**
   * Update existing prompt (author only)
   */
  async updatePrompt(id: string, data: UpdatePromptDto): Promise<{ prompt: Prompt }> {
    return apiClient.put<{ prompt: Prompt }>(`${BASE_URL}/${id}`, data);
  },

  /**
   * Delete prompt (author only)
   */
  async deletePrompt(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${BASE_URL}/${id}`);
  },

  /**
   * Fork a prompt (create variation)
   */
  async forkPrompt(id: string): Promise<{ prompt: Prompt }> {
    return apiClient.post<{ prompt: Prompt }>(`${BASE_URL}/${id}/fork`);
  },

  /**
   * Rate a prompt (1-5 stars)
   */
  async ratePrompt(id: string, data: RatePromptDto): Promise<{
    ratingAvg: number;
    ratingCount: number;
    userRating: number;
  }> {
    return apiClient.post<{
      ratingAvg: number;
      ratingCount: number;
      userRating: number;
    }>(`${BASE_URL}/${id}/rate`, data);
  },

  /**
   * Vote on a prompt (upvote/downvote)
   */
  async votePrompt(id: string, data: VotePromptDto): Promise<{
    voteScore: number;
    upvotes: number;
    downvotes: number;
    userVote: 'up' | 'down' | null;
  }> {
    return apiClient.post<{
      voteScore: number;
      upvotes: number;
      downvotes: number;
      userVote: 'up' | 'down' | null;
    }>(`${BASE_URL}/${id}/vote`, data);
  },

  /**
   * Get comments (replies) for a prompt
   */
  async getPromptComments(promptId: string): Promise<ReplyTreeResponse> {
    return apiClient.get<ReplyTreeResponse>(`${BASE_URL}/${promptId}/comments`);
  },

  /**
   * Add comment to a prompt
   */
  async addPromptComment(promptId: string, data: Omit<CreateReplyInput, 'topicId'>): Promise<{ reply: ForumReply }> {
    return apiClient.post<{ reply: ForumReply }>(`${BASE_URL}/${promptId}/comments`, data);
  },

  /**
   * Get user's prompts
   */
  async getUserPrompts(username: string, params?: PromptsQueryParams): Promise<PromptsResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = queryParams.toString()
      ? `/users/${username}/prompts?${queryParams}`
      : `/users/${username}/prompts`;

    return apiClient.get<PromptsResponse>(url);
  },

  /**
   * Get prompt forks
   */
  async getPromptForks(id: string): Promise<{ prompts: Prompt[]; count: number }> {
    return apiClient.get<{ prompts: Prompt[]; count: number }>(`${BASE_URL}/${id}/forks`);
  },
};
