/**
 * Search Filters Component
 *
 * Filter sidebar for search results
 */

import * as React from 'react';
import { Cross2Icon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button/Button';
import type { ContentType, SearchFilters as SearchFiltersType } from '../types/search.types';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onClear: () => void;
  className?: string;
}

const contentTypeOptions: Array<{ value: ContentType; label: string }> = [
  { value: 'articles', label: 'Articles' },
  { value: 'forum_topics', label: 'Forum Topics' },
  { value: 'forum_replies', label: 'Forum Replies' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'users', label: 'Users' },
  { value: 'companies', label: 'Companies' },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear,
  className,
}) => {
  const [expandedSections, setExpandedSections] = React.useState({
    types: true,
    date: false,
    advanced: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleTypeToggle = (type: ContentType) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    onFiltersChange({ ...filters, types: newTypes.length > 0 ? newTypes : undefined });
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    onFiltersChange({ ...filters, [field]: value || undefined });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category: value || undefined });
  };

  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, location: value || undefined });
  };

  const handleEmploymentTypeChange = (value: string) => {
    onFiltersChange({ ...filters, employmentType: value || undefined });
  };

  const handleRemoteToggle = () => {
    onFiltersChange({ ...filters, isRemote: filters.isRemote ? undefined : true });
  };

  const hasActiveFilters = React.useMemo(() => {
    return !!(
      filters.types?.length ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.category ||
      filters.location ||
      filters.employmentType ||
      filters.isRemote
    );
  }, [filters]);

  return (
    <div className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Cross2Icon className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Content Types */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => toggleSection('types')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Content Type</span>
          {expandedSections.types ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.types && (
          <div className="px-4 pb-4 space-y-2">
            {contentTypeOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.types?.includes(option.value) || false}
                  onChange={() => handleTypeToggle(option.value)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => toggleSection('date')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Date Range</span>
          {expandedSections.date ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.date && (
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                From
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                To
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <div>
        <button
          onClick={() => toggleSection('advanced')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Advanced</span>
          {expandedSections.advanced ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.advanced && (
          <div className="px-4 pb-4 space-y-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={filters.category || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
                placeholder="e.g., Machine Learning"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Location (for jobs) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={filters.location || ''}
                onChange={(e) => handleLocationChange(e.target.value)}
                placeholder="e.g., San Francisco"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employment Type
              </label>
              <select
                value={filters.employmentType || ''}
                onChange={(e) => handleEmploymentTypeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            {/* Remote */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.isRemote || false}
                onChange={handleRemoteToggle}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                Remote only
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
