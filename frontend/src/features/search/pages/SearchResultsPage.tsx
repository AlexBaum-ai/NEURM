/**
 * Search Results Page
 *
 * Main page for displaying search results at /search?q=...
 */

import * as React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MagnifyingGlassIcon, StarFilledIcon, StarIcon } from '@radix-ui/react-icons';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button/Button';
import { GlobalSearchBar } from '../components/GlobalSearchBar';
import { SearchResultCard } from '../components/SearchResultCard';
import { SearchFilters } from '../components/SearchFilters';
import { useSearch, useSaveSearch, useDeleteSavedSearch, useSavedSearches } from '../hooks/useSearch';
import type { SearchParams, ContentType, SearchFilters as SearchFiltersType, SearchSortOption } from '../types/search.types';

const contentTypeLabels: Record<ContentType, string> = {
  articles: 'Articles',
  forum_topics: 'Forum Topics',
  forum_replies: 'Forum Replies',
  jobs: 'Jobs',
  users: 'Users',
  companies: 'Companies',
};

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [filters, setFilters] = React.useState<SearchFiltersType>({});
  const [sort, setSort] = React.useState<SearchSortOption>('relevance');
  const [page, setPage] = React.useState(1);
  const [showFilters, setShowFilters] = React.useState(true);

  // Fetch search results
  const searchQuery: SearchParams = {
    q: query,
    type: filters.types,
    sort,
    page,
    limit: 20,
    filters,
  };

  const { data: searchResults, isLoading, isError } = useSearch(searchQuery, query.length > 0);

  // Saved searches
  const { data: savedSearches } = useSavedSearches();
  const saveSearchMutation = useSaveSearch();
  const deleteSavedSearchMutation = useDeleteSavedSearch();

  const isSearchSaved = React.useMemo(() => {
    return savedSearches?.some((s) => s.query === query);
  }, [savedSearches, query]);

  const handleSearchUpdate = (newQuery: string) => {
    setSearchParams({ q: newQuery });
    setPage(1);
  };

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleSortChange = (newSort: SearchSortOption) => {
    setSort(newSort);
    setPage(1);
  };

  const handleSaveSearch = () => {
    if (!isSearchSaved && query) {
      saveSearchMutation.mutate({ query, filters });
    } else if (isSearchSaved) {
      const savedSearch = savedSearches?.find((s) => s.query === query);
      if (savedSearch) {
        deleteSavedSearchMutation.mutate(savedSearch.id);
      }
    }
  };

  // Reset page when query changes
  React.useEffect(() => {
    setPage(1);
  }, [query]);

  if (!query) {
    return (
      <div className="container-custom py-12">
        <Helmet>
          <title>Search - Neurmatic</title>
        </Helmet>
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <MagnifyingGlassIcon className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Search Neurmatic
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search across articles, forum discussions, jobs, users, and companies
          </p>
          <div className="max-w-xl mx-auto">
            <GlobalSearchBar autoFocus placeholder="What are you looking for?" />
          </div>
          <div className="pt-8">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Search Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Use quotes for exact match
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  "machine learning" will find that exact phrase
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Exclude terms with minus
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI -chatbot will exclude "chatbot"
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Filter by type
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use filters to search specific content types
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Keyboard shortcuts
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Press / anywhere to focus search
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-6">
      <Helmet>
        <title>Search: {query} - Neurmatic</title>
      </Helmet>

      {/* Search Bar */}
      <div className="mb-6">
        <GlobalSearchBar
          placeholder="Search articles, jobs, forum..."
          onSearch={handleSearchUpdate}
        />
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside
          className={cn(
            'w-64 flex-shrink-0 transition-all duration-200',
            showFilters ? 'block' : 'hidden'
          )}
        >
          <div className="sticky top-20">
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClear={handleClearFilters}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  Search Results
                </h1>
                {searchResults && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {searchResults.total.toLocaleString()} results for "{query}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveSearch}
                  disabled={saveSearchMutation.isPending || deleteSavedSearchMutation.isPending}
                >
                  {isSearchSaved ? (
                    <>
                      <StarFilledIcon className="h-4 w-4 mr-1 text-primary-600" />
                      Saved
                    </>
                  ) : (
                    <>
                      <StarIcon className="h-4 w-4 mr-1" />
                      Save Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <div className="flex gap-1">
                {(['relevance', 'date', 'popularity'] as SearchSortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSortChange(option)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md transition-colors',
                      sort === option
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-2">
                Something went wrong while searching
              </p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Results */}
          {searchResults && !isLoading && (
            <>
              {/* Grouped Results */}
              {searchResults.total > 0 ? (
                <div className="space-y-8">
                  {Object.entries(searchResults.grouped).map(([type, results]) => {
                    if (results.length === 0) return null;

                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {contentTypeLabels[type as ContentType]} ({results.length})
                          </h2>
                          {results.length >= 3 && (
                            <Link
                              to={`/search?q=${encodeURIComponent(query)}&type=${type}`}
                              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              See all
                            </Link>
                          )}
                        </div>
                        <div className="space-y-3">
                          {results.slice(0, 5).map((result) => (
                            <SearchResultCard key={result.id} result={result} query={query} />
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {searchResults.hasMore && (
                    <div className="flex justify-center pt-6">
                      <Button onClick={() => setPage(page + 1)}>Load More</Button>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No results found
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your search or filters
                  </p>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResultsPage;
