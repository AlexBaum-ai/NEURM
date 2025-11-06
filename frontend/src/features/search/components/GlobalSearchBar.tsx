/**
 * Global Search Bar Component
 *
 * Main search input that appears in the header
 * Includes autocomplete, keyboard shortcuts, and voice search
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, Cross2Icon } from '@radix-ui/react-icons';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { SearchAutocomplete } from './SearchAutocomplete';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

export interface GlobalSearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  showVoiceSearch?: boolean;
  onSearch?: (query: string) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  className,
  placeholder = 'Search articles, jobs, forum...',
  autoFocus = false,
  showVoiceSearch = false,
  onSearch,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const [showAutocomplete, setShowAutocomplete] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Voice search
  const {
    isListening,
    isSupported: isVoiceSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceSearch({
    onResult: (result) => {
      if (result.isFinal) {
        setQuery(result.transcript);
        handleSearch(result.transcript);
        stopListening();
      } else {
        setQuery(result.transcript);
      }
    },
    onError: (error) => {
      console.error('Voice search error:', error);
      stopListening();
    },
  });

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/' key
      if (e.key === '/' && !isFocused && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Clear on Escape
      if (e.key === 'Escape' && isFocused) {
        setQuery('');
        setShowAutocomplete(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update query when transcript changes
  React.useEffect(() => {
    if (transcript && isListening) {
      setQuery(transcript);
    }
  }, [transcript, isListening]);

  const handleSearch = React.useCallback(
    (searchQuery?: string) => {
      const queryToSearch = searchQuery || query;
      if (!queryToSearch.trim()) return;

      setShowAutocomplete(false);
      onSearch?.(queryToSearch);
      navigate(`/search?q=${encodeURIComponent(queryToSearch)}`);
    },
    [query, navigate, onSearch]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowAutocomplete(value.length >= 2);
  };

  const handleClear = () => {
    setQuery('');
    setShowAutocomplete(false);
    resetTranscript();
    inputRef.current?.focus();
  };

  const handleVoiceSearch = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSuggestionSelect = React.useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      handleSearch(suggestion);
    },
    [handleSearch]
  );

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Search Icon */}
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            setIsFocused(true);
            if (query.length >= 2) {
              setShowAutocomplete(true);
            }
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'w-full h-10 pl-10 pr-20 rounded-lg border border-gray-300 dark:border-gray-700',
            'bg-white dark:bg-gray-900',
            'text-sm text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-500 dark:placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-all duration-200',
            isListening && 'ring-2 ring-accent-500 border-accent-500'
          )}
          aria-label="Search"
        />

        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Voice Search Button (Mobile) */}
          {showVoiceSearch && isVoiceSupported && (
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={cn(
                'p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800',
                'transition-colors duration-200',
                isListening && 'bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-400'
              )}
              aria-label={isListening ? 'Stop listening' : 'Start voice search'}
              title={isListening ? 'Stop listening' : 'Voice search'}
            >
              <MicrophoneIcon className={cn('h-4 w-4', isListening && 'animate-pulse')} />
            </button>
          )}

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              aria-label="Clear search"
              title="Clear"
            >
              <Cross2Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}

          {/* Keyboard Hint */}
          {!isFocused && !query && (
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
              /
            </kbd>
          )}
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {showAutocomplete && query.length >= 2 && (
        <SearchAutocomplete query={query} onSelect={handleSuggestionSelect} />
      )}
    </div>
  );
};
