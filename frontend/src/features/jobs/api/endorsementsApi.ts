/**
 * Endorsements API Client
 *
 * API functions for skill endorsement operations
 */

import { apiClient } from '@/lib/api';
import type { EndorsementsListResponse } from '../types/candidates';

export const endorsementsApi = {
  /**
   * Endorse a user's skill
   * POST /api/v1/profiles/:username/skills/:skillId/endorse
   */
  endorseSkill: async (username: string, skillId: string): Promise<void> => {
    await apiClient.post<{ success: boolean; message: string }>(
      `/profiles/${username}/skills/${skillId}/endorse`
    );
  },

  /**
   * Remove endorsement from a user's skill
   * DELETE /api/v1/profiles/:username/skills/:skillId/endorse
   */
  unendorseSkill: async (username: string, skillId: string): Promise<void> => {
    await apiClient.delete<{ success: boolean; message: string }>(
      `/profiles/${username}/skills/${skillId}/endorse`
    );
  },

  /**
   * Get all endorsements for a skill
   * GET /api/v1/profiles/:username/skills/:skillId/endorsements
   */
  getEndorsements: async (
    username: string,
    skillId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<EndorsementsListResponse> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const response = await apiClient.get<{
      success: boolean;
      data: EndorsementsListResponse;
    }>(`/profiles/${username}/skills/${skillId}/endorsements${queryString ? '?' + queryString : ''}`);
    return response.data;
  },
};
