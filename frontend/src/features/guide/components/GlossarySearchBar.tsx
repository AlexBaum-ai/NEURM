import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useGlossarySearch } from '../hooks/useGlossary';

interface GlossarySearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const GlossarySearchBar: React.FC<GlossarySearchBarProps> = ({
  onSearch,
  placeholder = 'Search glossary terms...',
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: searchResults } = useGlossarySearch(debouncedQuery, debouncedQuery.length >= 2);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = () => {
    setShowSuggestions(false);
    setQuery('');
  };

  const hasSuggestions = searchResults && searchResults.terms.length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 pl-11 pr-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="Search glossary terms"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={showSuggestions && hasSuggestions}
          />
          <svg
            className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </form>

      {/* Autocomplete suggestions */}
      {showSuggestions && hasSuggestions && (
        <div
          id="search-suggestions"
          className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {searchResults.total} result{searchResults.total !== 1 ? 's' : ''}
            </div>
            {searchResults.terms.slice(0, 8).map(term => (
              <Link
                key={term.id}
                to={`/guide/glossary/${term.slug}`}
                onClick={handleSuggestionClick}
                className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                role="option"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {term.term}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {term.briefDefinition}
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300">
                    {term.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showSuggestions && query.length >= 2 && !hasSuggestions && (
        <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            No terms found for "{query}"
          </p>
        </div>
      )}
    </div>
  );
};

export default GlossarySearchBar;
