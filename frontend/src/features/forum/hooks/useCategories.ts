/**
 * useCategories Hook
 * Fetches all forum categories with hierarchy using useSuspenseQuery
 */

import { useSuspenseQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import { useForumStore } from '../store/forumStore';
import { useEffect } from 'react';

export const useCategories = () => {
  const setCategories = useForumStore((state) => state.setCategories);

  const query = useSuspenseQuery({
    queryKey: ['forum', 'categories'],
    queryFn: async () => {
      const data = await forumApi.getCategories();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
  });

  // Sync with store when data changes
  useEffect(() => {
    if (query.data?.categories) {
      setCategories(query.data.categories);
    }
  }, [query.data, setCategories]);

  return {
    categories: query.data.categories,
    count: query.data.count,
    isLoading: query.isLoading,
    error: query.error,
  };
};
