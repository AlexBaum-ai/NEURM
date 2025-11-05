/**
 * useSavedSearches Hook
 * Manages user's saved searches
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import type { SavedSearchInput } from '../types';

export const useSavedSearches = () => {
  const queryClient = useQueryClient();

  const savedSearchesQuery = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => forumApi.getSavedSearches(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const saveSearchMutation = useMutation({
    mutationFn: (data: SavedSearchInput) => forumApi.saveSearch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });

  const deleteSearchMutation = useMutation({
    mutationFn: (searchId: string) => forumApi.deleteSavedSearch(searchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });

  return {
    savedSearches: savedSearchesQuery.data || [],
    isLoading: savedSearchesQuery.isLoading,
    isError: savedSearchesQuery.isError,
    saveSearch: saveSearchMutation.mutate,
    deleteSearch: deleteSearchMutation.mutate,
    isSaving: saveSearchMutation.isPending,
    isDeleting: deleteSearchMutation.isPending,
  };
};

export default useSavedSearches;
