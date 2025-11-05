import React, { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Select } from '@/components/forms/Select';
import { Label } from '@/components/forms/Label';
import PromptCard from '../components/PromptCard';
import { usePrompts } from '../hooks/usePrompts';
import type { PromptsQueryParams, PromptSortOptions } from '../types/prompt';
import { PROMPT_CATEGORIES, PROMPT_USE_CASES, LLM_MODELS } from '../types/prompt';

const PromptLibraryContent: React.FC = () => {
  const [filters, setFilters] = useState<PromptsQueryParams>({
    page: 1,
    limit: 12,
    sortBy: 'top_rated',
    order: 'desc',
  });

  const [searchTerm, setSearchTerm] = useState('');

  const { data } = usePrompts(filters);

  const handleFilterChange = (key: keyof PromptsQueryParams, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      search: searchTerm || undefined,
      page: 1,
    }));
  };

  const handleSortChange = (sortBy: PromptSortOptions['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Prompt Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and discover community-created prompts for various use cases
          </p>
        </div>
        <Link to="/forum/prompts/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Prompt
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Category Filter */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {PROMPT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Use Case Filter */}
          <div>
            <Label htmlFor="useCase">Use Case</Label>
            <Select
              id="useCase"
              value={filters.useCase || ''}
              onChange={(e) => handleFilterChange('useCase', e.target.value)}
            >
              <option value="">All Use Cases</option>
              {PROMPT_USE_CASES.map((uc) => (
                <option key={uc.value} value={uc.value}>
                  {uc.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Model Filter */}
          <div>
            <Label htmlFor="model">Model</Label>
            <Select
              id="model"
              value={filters.model || ''}
              onChange={(e) => handleFilterChange('model', e.target.value)}
            >
              <option value="">All Models</option>
              {LLM_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </Select>
          </div>

          {/* Rating Filter */}
          <div>
            <Label htmlFor="rating">Minimum Rating</Label>
            <Select
              id="rating"
              value={filters.rating?.toString() || ''}
              onChange={(e) =>
                handleFilterChange('rating', e.target.value)
              }
            >
              <option value="">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Stars</option>
            </Select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'top_rated', label: 'Top Rated' },
              { value: 'most_voted', label: 'Most Voted' },
              { value: 'newest', label: 'Newest' },
              { value: 'most_forked', label: 'Most Forked' },
              { value: 'most_viewed', label: 'Most Viewed' },
            ].map((sort) => (
              <button
                key={sort.value}
                onClick={() =>
                  handleSortChange(sort.value as PromptSortOptions['sortBy'])
                }
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filters.sortBy === sort.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Count */}
        {(filters.category || filters.useCase || filters.model || filters.rating) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.pagination.total} prompts found
            </p>
            <button
              onClick={() =>
                setFilters({
                  page: 1,
                  limit: 12,
                  sortBy: 'top_rated',
                  order: 'desc',
                })
              }
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Prompts Grid */}
      {data.prompts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {data.prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(data.pagination.page - 1)}
                disabled={data.pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(data.pagination.page + 1)}
                disabled={data.pagination.page === data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            No prompts found matching your filters
          </p>
          <Button
            variant="outline"
            onClick={() =>
              setFilters({
                page: 1,
                limit: 12,
                sortBy: 'top_rated',
                order: 'desc',
              })
            }
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

const PromptLibrary: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="container-custom py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"
                ></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <PromptLibraryContent />
    </Suspense>
  );
};

export default PromptLibrary;
