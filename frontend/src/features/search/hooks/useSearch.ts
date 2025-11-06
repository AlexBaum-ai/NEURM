/**
 * Search Hooks
 *
 * React Query hooks for search functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';
import type { SearchParams } from '../types/search.types';

/**
 * Query keys for search
 */
export const searchKeys = {
  all: ['search'] as const,
  results: (params: SearchParams) => [...searchKeys.all, 'results', params] as const,
  suggestions: (query: string) => [...searchKeys.all, 'suggestions', query] as const,
  history: () => [...searchKeys.all, 'history'] as const,
  saved: () => [...searchKeys.all, 'saved'] as const,
};

/**
 * Hook to perform search
 */
export const useSearch = (params: SearchParams, enabled = true) => {
  return useQuery({
    queryKey: searchKeys.results(params),
    queryFn: () => searchApi.search(params),
    enabled: enabled && params.q.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get autocomplete suggestions
 */
export const useSearchSuggestions = (query: string, enabled = true) => {
  return useQuery({
    queryKey: searchKeys.suggestions(query),
    queryFn: () => searchApi.getSuggestions(query),
    enabled: enabled && query.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to get search history
 */
export const useSearchHistory = () => {
  return useQuery({
    queryKey: searchKeys.history(),
    queryFn: () => searchApi.getHistory(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get saved searches
 */
export const useSavedSearches = () => {
  return useQuery({
    queryKey: searchKeys.saved(),
    queryFn: () => searchApi.getSavedSearches(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to save a search
 */
export const useSaveSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: searchApi.saveSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.saved() });
    },
  });
};

/**
 * Hook to delete a saved search
 */
export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: searchApi.deleteSavedSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.saved() });
    },
  });
};

/**
 * Hook to clear search history
 */
export const useClearHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: searchApi.clearHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.history() });
    },
  });
};
