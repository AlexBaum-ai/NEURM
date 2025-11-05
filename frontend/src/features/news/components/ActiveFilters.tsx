import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NewsFilters, DifficultyLevel } from '../types';

interface ActiveFiltersProps {
  filters: NewsFilters;
  onRemoveFilter: (filterKey: keyof NewsFilters, value?: string) => void;
  onClearAll: () => void;
  className?: string;
  // Optional: Tag names for display (since filters only have slugs)
  tagNames?: Record<string, string>;
  categoryName?: string;
  modelName?: string;
}

interface FilterPillProps {
  label: string;
  onRemove: () => void;
  variant?: 'default' | 'primary';
}

const FilterPill: React.FC<FilterPillProps> = ({ label, onRemove, variant = 'default' }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
        variant === 'primary'
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      )}
    >
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
};

const getDifficultyLabel = (difficulty: DifficultyLevel): string => {
  const labels: Record<DifficultyLevel, string> = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced',
    EXPERT: 'Expert',
  };
  return labels[difficulty];
};

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
  className,
  tagNames = {},
  categoryName,
  modelName,
}) => {
  const hasActiveFilters =
    filters.search ||
    filters.categorySlug ||
    (filters.tags && filters.tags.length > 0) ||
    filters.difficulty ||
    filters.modelSlug;

  if (!hasActiveFilters) {
    return null;
  }

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.categorySlug ? 1 : 0) +
    (filters.tags?.length || 0) +
    (filters.difficulty ? 1 : 0) +
    (filters.modelSlug ? 1 : 0);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Active Filters ({activeFilterCount})
        </h3>
        <button
          onClick={onClearAll}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Search filter */}
        {filters.search && (
          <FilterPill
            label={`Search: "${filters.search}"`}
            onRemove={() => onRemoveFilter('search')}
            variant="primary"
          />
        )}

        {/* Category filter */}
        {filters.categorySlug && (
          <FilterPill
            label={`Category: ${categoryName || filters.categorySlug}`}
            onRemove={() => onRemoveFilter('categorySlug')}
          />
        )}

        {/* Tag filters */}
        {filters.tags?.map((tagSlug) => (
          <FilterPill
            key={tagSlug}
            label={`Tag: ${tagNames[tagSlug] || tagSlug}`}
            onRemove={() => onRemoveFilter('tags', tagSlug)}
          />
        ))}

        {/* Difficulty filter */}
        {filters.difficulty && (
          <FilterPill
            label={`Level: ${getDifficultyLabel(filters.difficulty)}`}
            onRemove={() => onRemoveFilter('difficulty')}
          />
        )}

        {/* Model filter */}
        {filters.modelSlug && (
          <FilterPill
            label={`Model: ${modelName || filters.modelSlug}`}
            onRemove={() => onRemoveFilter('modelSlug')}
          />
        )}
      </div>
    </div>
  );
};

export default ActiveFilters;
