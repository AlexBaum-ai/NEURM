/**
 * Search API
 *
 * API client for universal search functionality
 */

import { apiClient } from '@/lib/api';
import type {
  SearchResponse,
  SearchAutocompleteResponse,
  SearchHistoryItem,
  SavedSearch,
  SearchParams,
} from '../types/search.types';

export const searchApi = {
  /**
   * Perform a search across all content types
   */
  search: async (params: SearchParams): Promise<SearchResponse> => {
    const queryParams = new URLSearchParams();

    queryParams.append('q', params.q);

    if (params.type && params.type.length > 0) {
      params.type.forEach((type) => queryParams.append('type', type));
    }

    if (params.sort) {
      queryParams.append('sort', params.sort);
    }

    if (params.page) {
      queryParams.append('page', params.page.toString());
    }

    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    // Add filter parameters
    if (params.filters) {
      const { dateFrom, dateTo, category, tags, location, employmentType, isRemote } =
        params.filters;

      if (dateFrom) queryParams.append('dateFrom', dateFrom);
      if (dateTo) queryParams.append('dateTo', dateTo);
      if (category) queryParams.append('category', category);
      if (tags && tags.length > 0) {
        tags.forEach((tag) => queryParams.append('tags', tag));
      }
      if (location) queryParams.append('location', location);
      if (employmentType) queryParams.append('employmentType', employmentType);
      if (isRemote !== undefined) queryParams.append('isRemote', isRemote.toString());
    }

    return apiClient.get<SearchResponse>(`/search?${queryParams.toString()}`);
  },

  /**
   * Get autocomplete suggestions
   */
  getSuggestions: async (query: string, limit: number = 10): Promise<SearchAutocompleteResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    queryParams.append('limit', limit.toString());

    return apiClient.get<SearchAutocompleteResponse>(`/search/suggest?${queryParams.toString()}`);
  },

  /**
   * Get search history
   */
  getHistory: async (limit: number = 10): Promise<SearchHistoryItem[]> => {
    return apiClient.get<SearchHistoryItem[]>(`/search/history?limit=${limit}`);
  },

  /**
   * Get saved searches
   */
  getSavedSearches: async (): Promise<SavedSearch[]> => {
    return apiClient.get<SavedSearch[]>('/search/saved');
  },

  /**
   * Save a search
   */
  saveSearch: async (data: {
    query: string;
    filters?: SearchParams['filters'];
    name?: string;
  }): Promise<SavedSearch> => {
    return apiClient.post<SavedSearch>('/search/saved', data);
  },

  /**
   * Delete a saved search
   */
  deleteSavedSearch: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/search/saved/${id}`);
  },

  /**
   * Clear search history
   */
  clearHistory: async (): Promise<void> => {
    return apiClient.delete<void>('/search/history');
  },
};
