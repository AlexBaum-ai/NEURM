import React, { Suspense, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Select } from '@/components/forms';
import UseCaseCard from '../components/UseCaseCard';
import UseCaseFilters from '../components/UseCaseFilters';
import FeaturedUseCases from '../components/FeaturedUseCases';
import { useUseCases } from '../hooks/useUseCases';
import type { UseCaseFilters as Filters, UseCaseSortOption } from '../types';

const UseCasesLibraryPage: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [sortBy, setSortBy] = useState<UseCaseSortOption>('publishedAt-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useUseCases({
    sortBy,
    filters: { ...filters, search: debouncedSearch || undefined },
  });

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const allUseCases = data?.pages.flatMap((page) => page.data) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Use Cases Library
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-world LLM implementations and success stories
              </p>
            </div>
            <Link
              to="/guide/use-cases/submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Submit Use Case
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Section */}
        <Suspense fallback={<div className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg mb-8" />}>
          <FeaturedUseCases />
        </Suspense>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <UseCaseFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Use Cases Grid */}
          <div className="lg:col-span-3">
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search use cases..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as UseCaseSortOption)}>
                  <option value="publishedAt-desc">Most Recent</option>
                  <option value="publishedAt-asc">Oldest First</option>
                  <option value="viewCount-desc">Most Popular</option>
                  <option value="commentCount-desc">Most Discussed</option>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            {data && (
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {data.pages[0]?.pagination.total || 0} use cases found
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
                ))}
              </div>
            )}

            {/* Use Cases Grid */}
            {!isLoading && allUseCases.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allUseCases.map((useCase) => (
                  <UseCaseCard key={useCase.id} useCase={useCase} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && allUseCases.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No use cases found matching your criteria.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Load More Button */}
            {hasNextPage && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseCasesLibraryPage;
