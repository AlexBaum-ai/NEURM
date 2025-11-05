import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { newsApi } from '../api/newsApi';
import type { TagOption } from '../types';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search articles...',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<TagOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search for autocomplete suggestions
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await newsApi.searchTags(searchTerm, 8);
      setSuggestions(response.data.tags);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(localValue);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [localValue, fetchSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setIsOpen(true);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(localValue);
    setIsOpen(false);
  };

  const handleSuggestionClick = (suggestion: TagOption) => {
    setLocalValue(suggestion.name);
    onChange(suggestion.name);
    setIsOpen(false);
  };

  const showSuggestions = isOpen && (suggestions.length > 0 || isLoading);

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={localValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={cn(
              'h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm',
              'placeholder:text-gray-400',
              'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500',
              'dark:focus:border-primary-600 dark:focus:ring-primary-600'
            )}
            aria-label="Search articles"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
          />
          {localValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {showSuggestions && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg',
            'dark:border-gray-700 dark:bg-gray-800'
          )}
          role="listbox"
        >
          {isLoading ? (
            <div className="flex items-center justify-center px-4 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Searching...
              </span>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Related tags
              </div>
              <div className="max-h-64 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm',
                      'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                      'transition-colors'
                    )}
                    role="option"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {suggestion.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.usageCount} articles
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
