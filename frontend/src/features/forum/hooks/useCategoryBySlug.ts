/**
 * useCategoryBySlug Hook
 * Fetches a single category by slug using useSuspenseQuery
 */

import { useSuspenseQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import { useForumStore } from '../store/forumStore';
import { useEffect } from 'react';

export const useCategoryBySlug = (slug: string) => {
  const setSelectedCategory = useForumStore((state) => state.setSelectedCategory);

  const query = useSuspenseQuery({
    queryKey: ['forum', 'category', slug],
    queryFn: async () => {
      const category = await forumApi.getCategoryBySlug(slug);
      return category;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync with store when data changes
  useEffect(() => {
    if (query.data) {
      setSelectedCategory(query.data);
    }
  }, [query.data, setSelectedCategory]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      setSelectedCategory(null);
    };
  }, [setSelectedCategory]);

  return {
    category: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};
