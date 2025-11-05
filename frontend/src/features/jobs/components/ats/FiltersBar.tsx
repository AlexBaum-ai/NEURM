import React, { useState } from 'react';
import { Search, Filter, X, Star } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import type { ATSFilters, ATSStatus } from '../../types';

interface FiltersBarProps {
  filters: ATSFilters;
  onFiltersChange: (filters: ATSFilters) => void;
  jobs: Array<{ id: string; title: string }>;
}

const statusOptions: Array<{ value: ATSStatus; label: string }> = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

export const FiltersBar: React.FC<FiltersBarProps> = ({ filters, onFiltersChange, jobs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const handleStatusToggle = (status: ATSStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleRatingToggle = (rating: number) => {
    const currentRatings = filters.rating || [];
    const newRatings = currentRatings.includes(rating)
      ? currentRatings.filter((r) => r !== rating)
      : [...currentRatings, rating];

    onFiltersChange({
      ...filters,
      rating: newRatings.length > 0 ? newRatings : undefined,
    });
  };

  const handleJobChange = (jobId: string) => {
    onFiltersChange({
      ...filters,
      jobId: jobId || undefined,
    });
  };

  const handleMatchScoreChange = (min: number | undefined, max: number | undefined) => {
    onFiltersChange({
      ...filters,
      minMatchScore: min,
      maxMatchScore: max,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount =
    (filters.status?.length || 0) +
    (filters.rating?.length || 0) +
    (filters.jobId ? 1 : 0) +
    (filters.minMatchScore !== undefined ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-primary-600 text-white rounded-full text-xs">
              {activeFiltersCount}
            </span>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={handleClearFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Job Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Position
            </label>
            <select
              value={filters.jobId || ''}
              onChange={(e) => handleJobChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusToggle(option.value)}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${
                      filters.status?.includes(option.value)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rating
            </label>
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingToggle(rating)}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1
                    ${
                      filters.rating?.includes(rating)
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-2 border-yellow-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <Star
                    className={`w-4 h-4 ${
                      filters.rating?.includes(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : ''
                    }`}
                  />
                  {rating}+
                </button>
              ))}
            </div>
          </div>

          {/* Match Score Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Match Score Range
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Min"
                value={filters.minMatchScore || ''}
                onChange={(e) =>
                  handleMatchScoreChange(
                    e.target.value ? parseInt(e.target.value) : undefined,
                    filters.maxMatchScore
                  )
                }
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Max"
                value={filters.maxMatchScore || ''}
                onChange={(e) =>
                  handleMatchScoreChange(
                    filters.minMatchScore,
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
