import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarksApi } from '../api/bookmarksApi';
import type {
  CollectionsResponse,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '../types';

export const useCollections = () => {
  return useSuspenseQuery<CollectionsResponse>({
    queryKey: ['collections'],
    queryFn: () => bookmarksApi.getCollections(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCollectionInput) => bookmarksApi.createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCollectionInput }) => {
      return bookmarksApi.updateCollection(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookmarksApi.deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
};
