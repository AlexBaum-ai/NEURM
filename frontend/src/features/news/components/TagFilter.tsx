import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { newsApi } from '../api/newsApi';
import type { TagOption } from '../types';

interface TagFilterProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export const TagFilter: React.FC<TagFilterProps> = ({ selectedTags, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch tags on mount and when search changes
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const response = await newsApi.searchTags(searchTerm);
        setTags(response.data || []);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        setTags([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleTagToggle = (tagSlug: string) => {
    const currentTags = selectedTags || [];
    if (currentTags.includes(tagSlug)) {
      onChange(currentTags.filter((t) => t !== tagSlug));
    } else {
      onChange([...currentTags, tagSlug]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedTagNames = tags
    .filter((tag) => selectedTags.includes(tag.slug))
    .map((tag) => tag.name);

  return (
    <div ref={dropdownRef} className={cn('relative w-full', className)}>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tags
      </label>

      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'hover:border-gray-400',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
        )}
      >
        <span className="truncate text-gray-700 dark:text-gray-300">
          {selectedTags.length === 0
            ? 'Select tags...'
            : `${selectedTags.length} tag${selectedTags.length === 1 ? '' : 's'} selected`}
        </span>
        <div className="flex items-center gap-1">
          {selectedTags.length > 0 && (
            <button
              onClick={handleClear}
              className="rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Clear tags"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-500 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg',
            'dark:border-gray-700 dark:bg-gray-800'
          )}
        >
          {/* Search input */}
          <div className="border-b border-gray-200 p-2 dark:border-gray-700">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tags..."
              className={cn(
                'h-8 w-full rounded border border-gray-300 bg-white px-2 text-sm',
                'placeholder:text-gray-400',
                'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                'dark:border-gray-700 dark:bg-gray-900 dark:text-white'
              )}
            />
          </div>

          {/* Tag list */}
          <div className="max-h-64 overflow-y-auto p-2">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading tags...</div>
            ) : tags.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No tags found</div>
            ) : (
              <div className="space-y-1">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.slug);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.slug)}
                      className={cn(
                        'flex w-full items-center justify-between rounded px-2 py-2 text-sm',
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                        isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                            isSelected
                              ? 'border-primary-600 bg-primary-600'
                              : 'border-gray-300 dark:border-gray-600'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {tag.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {tag.usageCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected tags preview */}
          {selectedTagNames.length > 0 && (
            <div className="border-t border-gray-200 p-2 dark:border-gray-700">
              <div className="flex flex-wrap gap-1">
                {selectedTagNames.map((name) => (
                  <span
                    key={name}
                    className="rounded bg-primary-100 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagFilter;
