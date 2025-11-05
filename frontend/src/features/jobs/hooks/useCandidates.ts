/**
 * Candidate Search Hooks
 *
 * Custom hooks for candidate search and management operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi } from '../api/candidatesApi';
import type { CandidateSearchFilters, CandidateExportFormat, CandidateMessage } from '../types/candidates';

interface UseCandidatesParams {
  page?: number;
  limit?: number;
  filters?: CandidateSearchFilters;
  enabled?: boolean;
}

/**
 * Hook for searching candidates with pagination
 */
export const useCandidates = ({ page = 1, limit = 20, filters, enabled = true }: UseCandidatesParams = {}) => {
  return useQuery({
    queryKey: ['candidates', 'search', { page, filters }],
    queryFn: () => candidatesApi.searchCandidates({ page, limit, filters }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching a single candidate profile
 */
export const useCandidate = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidatesApi.getCandidateProfile(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for tracking profile views
 */
export const useTrackProfileView = () => {
  return useMutation({
    mutationFn: (data: { candidateId: string; source: 'search' | 'profile' | 'list' }) =>
      candidatesApi.trackProfileView(data),
  });
};

/**
 * Hook for saving a search
 */
export const useSaveSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; filters: CandidateSearchFilters }) =>
      candidatesApi.saveSearch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
    },
  });
};

/**
 * Hook for fetching saved searches
 */
export const useSavedSearches = () => {
  return useQuery({
    queryKey: ['savedSearches'],
    queryFn: () => candidatesApi.getSavedSearches(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for deleting a saved search
 */
export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => candidatesApi.deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
    },
  });
};

/**
 * Hook for saving a candidate
 */
export const useSaveCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { candidateId: string; notes?: string; tags?: string[] }) =>
      candidatesApi.saveCandidate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCandidates'] });
    },
  });
};

/**
 * Hook for fetching saved candidates
 */
export const useSavedCandidates = () => {
  return useQuery({
    queryKey: ['savedCandidates'],
    queryFn: () => candidatesApi.getSavedCandidates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for removing a saved candidate
 */
export const useUnsaveCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => candidatesApi.unsaveCandidate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCandidates'] });
    },
  });
};

/**
 * Hook for exporting candidates
 */
export const useExportCandidates = () => {
  return useMutation({
    mutationFn: (data: CandidateExportFormat) => candidatesApi.exportCandidates(data),
  });
};

/**
 * Hook for sending message to candidate
 */
export const useSendMessage = () => {
  return useMutation({
    mutationFn: (data: CandidateMessage) => candidatesApi.sendMessage(data),
  });
};

/**
 * Hook for getting search suggestions (autocomplete)
 */
export const useSearchSuggestions = (query: string, type: 'skills' | 'all' = 'all', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['searchSuggestions', query, type],
    queryFn: () => candidatesApi.getSearchSuggestions(query, type),
    enabled: enabled && query.length >= 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
