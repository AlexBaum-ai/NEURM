/**
 * BadgeGallery Component
 * Displays a grid of badges with filtering options
 */

import React, { useState, useMemo } from 'react';
import BadgeCard from './BadgeCard';
import type { BadgeWithProgress, BadgeFilters, BadgeType, BadgeRarity } from '../types/badge';
import { BADGE_RARITY_CONFIG, BADGE_TYPE_CONFIG } from '../types/badge';

interface BadgeGalleryProps {
  badges: BadgeWithProgress[];
  showFilters?: boolean;
  initialFilters?: BadgeFilters;
  onBadgeClick?: (badge: BadgeWithProgress) => void;
  className?: string;
}

const BadgeGallery: React.FC<BadgeGalleryProps> = ({
  badges,
  showFilters = true,
  initialFilters,
  onBadgeClick,
  className = '',
}) => {
  const [filters, setFilters] = useState<BadgeFilters>(
    initialFilters || {
      type: undefined,
      rarity: undefined,
      category: undefined,
      earnedStatus: 'all',
      searchQuery: '',
    }
  );

  // Extract unique categories from badges
  const categories = useMemo(() => {
    const uniqueCategories = new Set(badges.map((b) => b.category));
    return Array.from(uniqueCategories).sort();
  }, [badges]);

  // Filter badges based on current filters
  const filteredBadges = useMemo(() => {
    return badges.filter((badge) => {
      // Type filter
      if (filters.type && badge.type !== filters.type) return false;

      // Rarity filter
      if (filters.rarity && badge.rarity !== filters.rarity) return false;

      // Category filter
      if (filters.category && badge.category !== filters.category) return false;

      // Earned status filter
      if (filters.earnedStatus === 'earned' && !badge.isEarned) return false;
      if (filters.earnedStatus === 'locked' && badge.isEarned) return false;

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = badge.name.toLowerCase().includes(query);
        const matchesDescription = badge.description.toLowerCase().includes(query);
        const matchesCategory = badge.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription && !matchesCategory) return false;
      }

      return true;
    });
  }, [badges, filters]);

  // Count badges by status
  const badgeCounts = useMemo(() => {
    return {
      all: badges.length,
      earned: badges.filter((b) => b.isEarned).length,
      locked: badges.filter((b) => !b.isEarned).length,
    };
  }, [badges]);

  const updateFilter = <K extends keyof BadgeFilters>(key: K, value: BadgeFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: undefined,
      rarity: undefined,
      category: undefined,
      earnedStatus: 'all',
      searchQuery: '',
    });
  };

  const hasActiveFilters =
    filters.type ||
    filters.rarity ||
    filters.category ||
    filters.earnedStatus !== 'all' ||
    filters.searchQuery;

  return (
    <div className={`${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search badges..."
              value={filters.searchQuery || ''}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-4">
            {/* Earned Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {(['all', 'earned', 'locked'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateFilter('earnedStatus', status)}
                    className={`
                      px-3 py-1 text-sm font-medium rounded-md transition-colors
                      ${
                        filters.earnedStatus === status
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    <span className="ml-1 text-xs opacity-75">
                      ({badgeCounts[status]})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
              <select
                value={filters.type || ''}
                onChange={(e) => updateFilter('type', (e.target.value as BadgeType) || undefined)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                {Object.entries(BADGE_TYPE_CONFIG).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rarity Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rarity:</span>
              <select
                value={filters.rarity || ''}
                onChange={(e) => updateFilter('rarity', (e.target.value as BadgeRarity) || undefined)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">All Rarities</option>
                {Object.entries(BADGE_RARITY_CONFIG).map(([rarity, config]) => (
                  <option key={rarity} value={rarity}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category:
                </span>
                <select
                  value={filters.category || ''}
                  onChange={(e) => updateFilter('category', e.target.value || undefined)}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredBadges.length} of {badges.length} badges
      </div>

      {/* Badge Grid */}
      {filteredBadges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBadges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              onClick={onBadgeClick}
              showProgress={true}
              showDescription={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No badges found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : 'No badges available at the moment'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BadgeGallery;
