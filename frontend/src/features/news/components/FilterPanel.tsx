import React from 'react';
import { cn } from '@/lib/utils';
import { SearchBar } from './SearchBar';
import { TagFilter } from './TagFilter';
import { DifficultyFilter } from './DifficultyFilter';
import { ModelFilter } from './ModelFilter';
import { ActiveFilters } from './ActiveFilters';
import type { NewsFilters, DifficultyLevel } from '../types';

interface FilterPanelProps {
  filters: NewsFilters;
  onFiltersChange: (filters: NewsFilters) => void;
  className?: string;
  // Optional display names for better UX
  categoryName?: string;
  tagNames?: Record<string, string>;
  modelName?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  className,
  categoryName,
  tagNames,
  modelName,
}) => {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const handleTagsChange = (tags: string[]) => {
    onFiltersChange({ ...filters, tags: tags.length > 0 ? tags : undefined });
  };

  const handleDifficultyChange = (difficulty: DifficultyLevel | undefined) => {
    onFiltersChange({ ...filters, difficulty });
  };

  const handleModelChange = (modelSlug: string | undefined) => {
    onFiltersChange({ ...filters, modelSlug });
  };

  const handleRemoveFilter = (filterKey: keyof NewsFilters, value?: string) => {
    const newFilters = { ...filters };

    if (filterKey === 'tags' && value) {
      // Remove specific tag
      newFilters.tags = filters.tags?.filter((tag) => tag !== value);
      if (newFilters.tags?.length === 0) {
        newFilters.tags = undefined;
      }
    } else {
      // Remove entire filter
      newFilters[filterKey] = undefined;
    }

    onFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    onFiltersChange({
      categorySlug: filters.categorySlug, // Keep category selection
    });
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Search Bar */}
      <SearchBar
        value={filters.search || ''}
        onChange={handleSearchChange}
        placeholder="Search articles by title or content..."
      />

      {/* Active Filters */}
      <ActiveFilters
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
        categoryName={categoryName}
        tagNames={tagNames}
        modelName={modelName}
      />

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Filter Options */}
      <div className="space-y-6">
        {/* Tags */}
        <TagFilter
          selectedTags={filters.tags || []}
          onChange={handleTagsChange}
        />

        {/* Difficulty */}
        <DifficultyFilter
          value={filters.difficulty}
          onChange={handleDifficultyChange}
        />

        {/* Model */}
        <ModelFilter
          value={filters.modelSlug}
          onChange={handleModelChange}
        />
      </div>
    </div>
  );
};

export default FilterPanel;
