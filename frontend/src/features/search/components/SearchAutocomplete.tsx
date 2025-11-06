/**
 * Search Autocomplete Component
 *
 * Displays search suggestions grouped by type
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, MagnifyingGlassIcon, StarIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { useSearchSuggestions, useSearchHistory, useSavedSearches } from '../hooks/useSearch';
import type { ContentType } from '../types/search.types';

interface SearchAutocompleteProps {
  query: string;
  onSelect: (query: string) => void;
}

const contentTypeIcons: Record<ContentType, string> = {
  articles: '📰',
  forum_topics: '💬',
  forum_replies: '💭',
  jobs: '💼',
  users: '👤',
  companies: '🏢',
};

const contentTypeLabels: Record<ContentType, string> = {
  articles: 'Articles',
  forum_topics: 'Forum Topics',
  forum_replies: 'Forum Replies',
  jobs: 'Jobs',
  users: 'Users',
  companies: 'Companies',
};

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({ query, onSelect }) => {
  const navigate = useNavigate();

  // Fetch suggestions
  const { data: suggestionsData, isLoading } = useSearchSuggestions(query);

  // Fetch history only if query is empty
  const { data: historyData } = useSearchHistory();

  // Fetch saved searches only if query is empty
  const { data: savedSearchesData } = useSavedSearches();

  const handleSuggestionClick = (text: string) => {
    onSelect(text);
  };

  const handleHistoryClick = (queryText: string) => {
    onSelect(queryText);
  };

  const handleSavedSearchClick = (id: string) => {
    const savedSearch = savedSearchesData?.find((s) => s.id === id);
    if (savedSearch) {
      onSelect(savedSearch.query);
    }
  };

  // Group suggestions by type
  const groupedSuggestions = React.useMemo(() => {
    if (!suggestionsData?.suggestions) return {};

    return suggestionsData.suggestions.reduce(
      (acc, suggestion) => {
        if (!acc[suggestion.type]) {
          acc[suggestion.type] = [];
        }
        acc[suggestion.type].push(suggestion);
        return acc;
      },
      {} as Record<ContentType, typeof suggestionsData.suggestions>
    );
  }, [suggestionsData]);

  const hasSuggestions =
    suggestionsData && Object.keys(groupedSuggestions).length > 0;
  const hasHistory = historyData && historyData.length > 0 && query.length === 0;
  const hasSavedSearches =
    savedSearchesData && savedSearchesData.length > 0 && query.length === 0;

  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-4 z-50">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 dark:border-gray-700 border-t-primary-600"></div>
          <span>Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (!hasSuggestions && !hasHistory && !hasSavedSearches) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 max-h-[400px] overflow-y-auto z-50">
      {/* Saved Searches */}
      {hasSavedSearches && (
        <div className="p-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            <StarIcon className="h-3.5 w-3.5" />
            <span>Saved Searches</span>
          </div>
          {savedSearchesData?.slice(0, 3).map((savedSearch) => (
            <button
              key={savedSearch.id}
              onClick={() => handleSavedSearchClick(savedSearch.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 text-left"
            >
              <StarIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {savedSearch.name || savedSearch.query}
                </p>
                {savedSearch.name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {savedSearch.query}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Recent Searches */}
      {hasHistory && (
        <div className="p-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            <ClockIcon className="h-3.5 w-3.5" />
            <span>Recent Searches</span>
          </div>
          {historyData?.slice(0, 5).map((historyItem) => (
            <button
              key={historyItem.id}
              onClick={() => handleHistoryClick(historyItem.query)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 text-left"
            >
              <ClockIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {historyItem.query}
                </p>
                {historyItem.resultsCount > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {historyItem.resultsCount} results
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Suggestions by Type */}
      {hasSuggestions && (
        <div className="p-2">
          {Object.entries(groupedSuggestions).map(([type, suggestions]) => (
            <div key={type} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                <span>{contentTypeIcons[type as ContentType]}</span>
                <span>{contentTypeLabels[type as ContentType]}</span>
              </div>
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={`${type}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 text-left"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {suggestion.text}
                    </p>
                    {suggestion.count !== undefined && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.count} results
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Search Tips */}
      {query.length === 0 && !hasHistory && !hasSavedSearches && (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">Search across articles, forum, jobs, and more</p>
          <p className="text-xs">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
              /
            </kbd> to focus search
          </p>
        </div>
      )}
    </div>
  );
};
