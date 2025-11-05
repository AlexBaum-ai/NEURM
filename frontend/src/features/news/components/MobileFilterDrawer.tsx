import React, { useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterPanel } from './FilterPanel';
import type { NewsFilters } from '../types';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: NewsFilters;
  onFiltersChange: (filters: NewsFilters) => void;
  categoryName?: string;
  tagNames?: Record<string, string>;
  modelName?: string;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  categoryName,
  tagNames,
  modelName,
}) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl transition-transform dark:bg-gray-900 md:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h2
              id="filter-drawer-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Filters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close filters"
          >
            <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <FilterPanel
            filters={filters}
            onFiltersChange={onFiltersChange}
            categoryName={categoryName}
            tagNames={tagNames}
            modelName={modelName}
          />
        </div>

        {/* Footer with Apply button */}
        <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-800">
          <button
            onClick={onClose}
            className={cn(
              'w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white',
              'hover:bg-primary-700',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'transition-colors'
            )}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileFilterDrawer;
