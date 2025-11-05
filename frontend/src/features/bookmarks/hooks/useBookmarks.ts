import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarksApi } from '../api/bookmarksApi';
import type { BookmarksResponse, UpdateBookmarkInput } from '../types';
import { useCallback, useState } from 'react';

export const useBookmarks = (collectionId?: string) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const query = useSuspenseQuery<BookmarksResponse>({
    queryKey: ['bookmarks', { collectionId, page, limit }],
    queryFn: () => bookmarksApi.getBookmarks({ page, limit, collectionId }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Filter bookmarks by search query (client-side)
  const filteredBookmarks = searchQuery
    ? query.data.data.bookmarks.filter(
        (bookmark) =>
          bookmark.article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : query.data.data.bookmarks;

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    bookmarks: filteredBookmarks,
    totalBookmarks: query.data.data.bookmarks.length,
    pagination: query.data.meta.pagination,
    isLoading: query.isLoading,
    searchQuery,
    onSearch: handleSearch,
    page,
    onPageChange: handlePageChange,
  };
};

export const useUpdateBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookmarkInput }) => {
      return bookmarksApi.updateBookmark(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};

export const useRemoveBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => bookmarksApi.removeBookmark(slug),
    onMutate: async (slug) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['bookmarks'] });

      queryClient.setQueriesData<BookmarksResponse>({ queryKey: ['bookmarks'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            bookmarks: old.data.bookmarks.filter((b) => b.article.slug !== slug),
          },
          meta: {
            ...old.meta,
            pagination: {
              ...old.meta.pagination,
              total: old.meta.pagination.total - 1,
            },
          },
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Revert optimistic update
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};
