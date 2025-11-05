import React, { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import { Input } from '@/components/common/Input/Input';
import { useModels } from '../hooks/useModels';
import type { ModelStatus, ModelCategory, ModelFilters, Model } from '../types';

const ModelCard: React.FC<{ model: Model }> = ({ model }) => {
  const statusColors: Record<ModelStatus, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    beta: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    deprecated: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    coming_soon: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <Link to={`/models/${model.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Provider Logo */}
            {model.provider.logo && (
              <div className="flex-shrink-0">
                <img
                  src={model.provider.logo}
                  alt={model.provider.name}
                  className="w-12 h-12 rounded-lg object-contain bg-white dark:bg-gray-800 p-1"
                />
              </div>
            )}

            {/* Model Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {model.name}
                </h3>
                <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${statusColors[model.status]}`}>
                  {model.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                by {model.provider.name}
              </p>

              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-4">
                {model.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                {model.specs.contextWindow && (
                  <span>
                    📝 {(model.specs.contextWindow / 1000).toLocaleString()}K context
                  </span>
                )}
                {model.followerCount > 0 && (
                  <span>
                    👥 {model.followerCount.toLocaleString()} followers
                  </span>
                )}
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded capitalize">
                  {model.category}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const ModelListContent: React.FC<{ filters: ModelFilters }> = ({ filters }) => {
  const { data } = useModels(filters);

  if (data.models.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No models found matching your criteria.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Try adjusting your filters or search terms.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Showing {data.models.length} of {data.total} models
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </>
  );
};

export const ModelListPage: React.FC = () => {
  const [filters, setFilters] = useState<ModelFilters>({});
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput }));
  };

  const statusOptions: { value: ModelStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'beta', label: 'Beta' },
    { value: 'deprecated', label: 'Deprecated' },
    { value: 'coming_soon', label: 'Coming Soon' },
  ];

  const categoryOptions: { value: ModelCategory; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'multimodal', label: 'Multimodal' },
    { value: 'image', label: 'Image' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Video' },
    { value: 'code', label: 'Code' },
  ];

  return (
    <>
      <Helmet>
        <title>Model Tracker - All LLM Models | Neurmatic</title>
        <meta
          name="description"
          content="Browse and compare 47+ large language models. Track specs, pricing, benchmarks, and related content."
        />
      </Helmet>

      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Model Tracker
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Browse and compare 47+ large language models from leading providers
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search models by name, provider, or description..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  Search
                </button>
              </form>

              {/* Filter Pills */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => {
                      const isSelected = filters.status?.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilters((prev) => {
                              const currentStatus = prev.status || [];
                              const newStatus = isSelected
                                ? currentStatus.filter((s) => s !== option.value)
                                : [...currentStatus, option.value];
                              return { ...prev, status: newStatus.length > 0 ? newStatus : undefined };
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((option) => {
                      const isSelected = filters.category?.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilters((prev) => {
                              const currentCategory = prev.category || [];
                              const newCategory = isSelected
                                ? currentCategory.filter((c) => c !== option.value)
                                : [...currentCategory, option.value];
                              return { ...prev, category: newCategory.length > 0 ? newCategory : undefined };
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Clear Filters */}
                {(filters.status?.length || filters.category?.length || filters.search) && (
                  <button
                    onClick={() => {
                      setFilters({});
                      setSearchInput('');
                    }}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model List */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <ModelListContent filters={filters} />
        </Suspense>
      </div>
    </>
  );
};

export default ModelListPage;
