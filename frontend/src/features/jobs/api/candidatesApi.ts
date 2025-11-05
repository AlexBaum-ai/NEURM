/**
 * Candidates API Client
 *
 * API functions for recruiter candidate search operations
 */

import { apiClient } from '@/lib/api';
import type {
  CandidateSearchFilters,
  CandidateSearchResponse,
  CandidateProfile,
  SavedSearch,
  SavedCandidate,
  CandidateExportFormat,
  CandidateMessage,
  TrackViewRequest,
} from '../types/candidates';

export const candidatesApi = {
  /**
   * Search for candidates with filters
   */
  searchCandidates: async (params: {
    page?: number;
    limit?: number;
    filters?: CandidateSearchFilters;
  }): Promise<CandidateSearchResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    if (params.filters) {
      // Query
      if (params.filters.query) queryParams.append('query', params.filters.query);

      // Skills
      if (params.filters.skills) {
        params.filters.skills.forEach((skill) => queryParams.append('skills', skill));
      }
      if (params.filters.skillsOperator) {
        queryParams.append('skillsOperator', params.filters.skillsOperator);
      }

      // Tech stack
      if (params.filters.models) {
        params.filters.models.forEach((model) => queryParams.append('models', model));
      }
      if (params.filters.frameworks) {
        params.filters.frameworks.forEach((framework) =>
          queryParams.append('frameworks', framework)
        );
      }
      if (params.filters.languages) {
        params.filters.languages.forEach((lang) => queryParams.append('languages', lang));
      }

      // Location
      if (params.filters.location) queryParams.append('location', params.filters.location);
      if (params.filters.remoteOnly !== undefined) {
        queryParams.append('remoteOnly', params.filters.remoteOnly.toString());
      }

      // Experience
      if (params.filters.experienceLevel) {
        params.filters.experienceLevel.forEach((level) =>
          queryParams.append('experienceLevel', level)
        );
      }
      if (params.filters.minYearsExperience !== undefined) {
        queryParams.append('minYearsExperience', params.filters.minYearsExperience.toString());
      }
      if (params.filters.maxYearsExperience !== undefined) {
        queryParams.append('maxYearsExperience', params.filters.maxYearsExperience.toString());
      }

      // Other filters
      if (params.filters.minReputation !== undefined) {
        queryParams.append('minReputation', params.filters.minReputation.toString());
      }
      if (params.filters.openToWorkOnly !== undefined) {
        queryParams.append('openToWorkOnly', params.filters.openToWorkOnly.toString());
      }
      if (params.filters.lastActiveWithin) {
        queryParams.append('lastActiveWithin', params.filters.lastActiveWithin);
      }

      // Sorting
      if (params.filters.sort) {
        queryParams.append('sort', params.filters.sort);
      }
    }

    const queryString = queryParams.toString();
    const response = await apiClient.get<{
      success: boolean;
      data: CandidateSearchResponse;
    }>(`/candidates/search${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  /**
   * Get candidate profile by ID (premium feature)
   */
  getCandidateProfile: async (id: string): Promise<CandidateProfile> => {
    const response = await apiClient.get<{
      success: boolean;
      data: CandidateProfile;
    }>(`/candidates/${id}`);
    return response.data;
  },

  /**
   * Track profile view (for analytics)
   */
  trackProfileView: async (data: TrackViewRequest): Promise<void> => {
    await apiClient.post<{ success: boolean }>('/candidates/track-view', data);
  },

  /**
   * Save a search for future use
   */
  saveSearch: async (params: {
    name: string;
    filters: CandidateSearchFilters;
  }): Promise<SavedSearch> => {
    const response = await apiClient.post<{
      success: boolean;
      data: SavedSearch;
    }>('/candidates/save-search', params);
    return response.data;
  },

  /**
   * Get all saved searches
   */
  getSavedSearches: async (): Promise<SavedSearch[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { searches: SavedSearch[] };
    }>('/candidates/saved-searches');
    return response.data.searches;
  },

  /**
   * Delete a saved search
   */
  deleteSavedSearch: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/candidates/saved-searches/${id}`);
  },

  /**
   * Save a candidate to a list
   */
  saveCandidate: async (params: {
    candidateId: string;
    notes?: string;
    tags?: string[];
  }): Promise<SavedCandidate> => {
    const response = await apiClient.post<{
      success: boolean;
      data: SavedCandidate;
    }>('/candidates/save', params);
    return response.data;
  },

  /**
   * Get all saved candidates
   */
  getSavedCandidates: async (): Promise<SavedCandidate[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { candidates: SavedCandidate[] };
    }>('/candidates/saved');
    return response.data.candidates;
  },

  /**
   * Remove a candidate from saved list
   */
  unsaveCandidate: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/candidates/saved/${id}`);
  },

  /**
   * Export selected candidates
   */
  exportCandidates: async (data: CandidateExportFormat): Promise<Blob> => {
    const response = await apiClient.post<Blob>('/candidates/export', data, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Send message to candidate
   */
  sendMessage: async (data: CandidateMessage): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/candidates/message', data);
  },

  /**
   * Get autocomplete suggestions for search
   */
  getSearchSuggestions: async (query: string, type: 'skills' | 'all' = 'all'): Promise<string[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { suggestions: string[] };
    }>('/candidates/suggestions', {
      params: { query, type },
    });
    return response.data.suggestions;
  },
};
