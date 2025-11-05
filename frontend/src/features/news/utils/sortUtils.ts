import type { SortOption, SortParams } from '../types';

/**
 * Parse frontend sort option into backend sortBy and sortOrder parameters
 *
 * Frontend format: "publishedAt-desc", "viewCount-desc", etc.
 * Backend format: sortBy=publishedAt&sortOrder=desc
 */
export const parseSortOption = (sortOption: SortOption): SortParams => {
  // Handle relevance sort (no order needed)
  if (sortOption === 'relevance') {
    return { sortBy: 'relevance' };
  }

  // Split by last hyphen
  const parts = sortOption.split('-');
  const sortOrder = parts.pop() as 'asc' | 'desc';
  const sortBy = parts.join('-') as SortParams['sortBy'];

  return {
    sortBy,
    sortOrder,
  };
};

/**
 * Convert backend sort parameters to frontend sort option
 * Used for reading URL params
 */
export const toSortOption = (sortBy?: string, sortOrder?: string): SortOption => {
  if (!sortBy) {
    return 'publishedAt-desc'; // Default
  }

  if (sortBy === 'relevance') {
    return 'relevance';
  }

  const order = sortOrder === 'asc' ? 'asc' : 'desc';
  return `${sortBy}-${order}` as SortOption;
};
