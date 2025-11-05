import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { NewsFilters, DifficultyLevel } from '../types';

/**
 * Custom hook to manage news filters with URL synchronization
 *
 * URL Parameters:
 * - search: Search query string
 * - category: Category slug
 * - tags: Comma-separated tag slugs
 * - difficulty: Difficulty level (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)
 * - model: Model slug
 *
 * @returns Object with filters and setter function
 */
export const useNewsFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL params
  const filters = useMemo<NewsFilters>(() => {
    const search = searchParams.get('search') || undefined;
    const categorySlug = searchParams.get('category') || undefined;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined;
    const difficulty = (searchParams.get('difficulty') as DifficultyLevel) || undefined;
    const modelSlug = searchParams.get('model') || undefined;

    return {
      search,
      categorySlug,
      tags,
      difficulty,
      modelSlug,
    };
  }, [searchParams]);

  // Update filters and sync to URL
  const setFilters = useCallback(
    (newFilters: NewsFilters) => {
      const params = new URLSearchParams();

      // Add non-empty filter values to URL params
      if (newFilters.search) {
        params.set('search', newFilters.search);
      }

      if (newFilters.categorySlug) {
        params.set('category', newFilters.categorySlug);
      }

      if (newFilters.tags && newFilters.tags.length > 0) {
        params.set('tags', newFilters.tags.join(','));
      }

      if (newFilters.difficulty) {
        params.set('difficulty', newFilters.difficulty);
      }

      if (newFilters.modelSlug) {
        params.set('model', newFilters.modelSlug);
      }

      // Update URL without triggering page reload
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // Update single filter field
  const updateFilter = useCallback(
    (key: keyof NewsFilters, value: string | string[] | undefined) => {
      setFilters({
        ...filters,
        [key]: value,
      });
    },
    [filters, setFilters]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search ||
        filters.categorySlug ||
        (filters.tags && filters.tags.length > 0) ||
        filters.difficulty ||
        filters.modelSlug
    );
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
};

export default useNewsFilters;
