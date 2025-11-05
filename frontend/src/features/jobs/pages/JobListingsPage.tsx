import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, SlidersHorizontal, Briefcase } from 'lucide-react';
import { useJobs, useSaveJob, useUnsaveJob } from '../hooks';
import { JobCard } from '../components/JobCard';
import { JobFilters } from '../components/JobFilters';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import type { JobFilters as IJobFilters, JobListItem } from '../types';
import { cn } from '@/lib/utils';

const sortOptions = [
  { value: 'newest', label: 'Most Recent' },
  { value: 'highest_salary', label: 'Highest Salary' },
  { value: 'best_match', label: 'Best Match' },
] as const;

export const JobListingsPage: React.FC = () => {
  const [filters, setFilters] = useState<IJobFilters>({
    sort: 'newest',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useJobs({
    filters: { ...filters, search: searchQuery || undefined },
  });

  const saveJobMutation = useSaveJob();
  const unsaveJobMutation = useUnsaveJob();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the query hook watching searchQuery
  };

  const handleResetFilters = () => {
    setFilters({ sort: 'newest' });
    setSearchQuery('');
  };

  const handleSaveJob = (job: JobListItem) => {
    saveJobMutation.mutate({ slug: job.slug });
  };

  const handleUnsaveJob = (job: JobListItem) => {
    unsaveJobMutation.mutate(job.slug);
  };

  const allJobs = data?.pages.flatMap((page) => page.jobs) || [];
  const totalJobs = data?.pages[0]?.total || 0;

  return (
    <>
      <Helmet>
        <title>LLM Jobs - Find Your Next Role | Neurmatic</title>
        <meta
          name="description"
          content="Browse LLM and AI engineering jobs. Find roles working with GPT, Claude, Llama, and other large language models."
        />
      </Helmet>

      <div className="container-custom py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            LLM Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find your next role working with large language models
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search jobs by title, company, or tech stack..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </form>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside
            className={cn(
              'w-full md:w-80 flex-shrink-0',
              showFilters ? 'block' : 'hidden md:block'
            )}
          >
            <div className="sticky top-4">
              <JobFilters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isLoading ? (
                  'Loading jobs...'
                ) : (
                  `${totalJobs} job${totalJobs !== 1 ? 's' : ''} found`
                )}
              </p>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort"
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  Sort by:
                </label>
                <select
                  id="sort"
                  value={filters.sort || 'newest'}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      sort: e.target.value as IJobFilters['sort'],
                    })
                  }
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-4 mb-6">
                <p className="text-accent-800 dark:text-accent-200">
                  Failed to load jobs. Please try again later.
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Jobs Grid */}
            {!isLoading && allJobs.length > 0 && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {allJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onSave={handleSaveJob}
                      onUnsave={handleUnsaveJob}
                      isSaving={
                        saveJobMutation.isPending || unsaveJobMutation.isPending
                      }
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {hasNextPage && (
                  <div className="mt-8 text-center">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      size="lg"
                    >
                      {isFetchingNextPage ? 'Loading...' : 'Load More Jobs'}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!isLoading && allJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your filters or search query
                </p>
                <Button variant="outline" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};
