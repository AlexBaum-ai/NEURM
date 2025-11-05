import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModelOption } from '../types';

interface ModelFilterProps {
  value?: string;
  onChange: (modelSlug: string | undefined) => void;
  className?: string;
}

// Mock model data - in production, this would come from API
const MOCK_MODELS: ModelOption[] = [
  { id: '1', name: 'GPT-4', slug: 'gpt-4' },
  { id: '2', name: 'GPT-3.5 Turbo', slug: 'gpt-35-turbo' },
  { id: '3', name: 'Claude 3 Opus', slug: 'claude-3-opus' },
  { id: '4', name: 'Claude 3 Sonnet', slug: 'claude-3-sonnet' },
  { id: '5', name: 'Claude 3 Haiku', slug: 'claude-3-haiku' },
  { id: '6', name: 'Gemini Pro', slug: 'gemini-pro' },
  { id: '7', name: 'Gemini Ultra', slug: 'gemini-ultra' },
  { id: '8', name: 'LLaMA 2', slug: 'llama-2' },
  { id: '9', name: 'Mistral', slug: 'mistral' },
  { id: '10', name: 'PaLM 2', slug: 'palm-2' },
];

export const ModelFilter: React.FC<ModelFilterProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load models (mocked for now)
  useEffect(() => {
    // In production, fetch from API: /api/v1/llm-guide/models
    const filteredModels = MOCK_MODELS.filter((model) =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setModels(filteredModels);
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

  const handleSelect = (modelSlug: string) => {
    onChange(value === modelSlug ? undefined : modelSlug);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const selectedModel = models.find((model) => model.slug === value);

  return (
    <div ref={dropdownRef} className={cn('relative w-full', className)}>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        LLM Model
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
          {selectedModel ? selectedModel.name : 'Select model...'}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button
              onClick={handleClear}
              className="rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Clear model"
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
              placeholder="Search models..."
              className={cn(
                'h-8 w-full rounded border border-gray-300 bg-white px-2 text-sm',
                'placeholder:text-gray-400',
                'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                'dark:border-gray-700 dark:bg-gray-900 dark:text-white'
              )}
            />
          </div>

          {/* Model list */}
          <div className="max-h-64 overflow-y-auto p-2">
            {models.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No models found</div>
            ) : (
              <div className="space-y-1">
                {models.map((model) => {
                  const isSelected = value === model.slug;
                  return (
                    <button
                      key={model.id}
                      onClick={() => handleSelect(model.slug)}
                      className={cn(
                        'flex w-full items-center rounded px-2 py-2 text-sm',
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                        isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                      )}
                    >
                      <span
                        className={cn(
                          'font-medium',
                          isSelected
                            ? 'text-primary-700 dark:text-primary-400'
                            : 'text-gray-900 dark:text-white'
                        )}
                      >
                        {model.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelFilter;
