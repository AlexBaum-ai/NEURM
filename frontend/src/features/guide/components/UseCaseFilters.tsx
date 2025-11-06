import React from 'react';
import { X } from 'lucide-react';
import { Select } from '@/components/forms';
import type { UseCaseFilters } from '../types';

interface UseCaseFiltersProps {
  filters: UseCaseFilters;
  onFiltersChange: (filters: UseCaseFilters) => void;
  onClearFilters: () => void;
}

const CATEGORIES = [
  { value: 'NLP', label: 'Natural Language Processing' },
  { value: 'COMPUTER_VISION', label: 'Computer Vision' },
  { value: 'AUTOMATION', label: 'Automation & Workflow' },
  { value: 'ANALYTICS', label: 'Analytics & Insights' },
  { value: 'CODE_GENERATION', label: 'Code Generation' },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service' },
  { value: 'CONTENT_CREATION', label: 'Content Creation' },
  { value: 'OTHER', label: 'Other' },
];

const INDUSTRIES = [
  { value: 'TECH', label: 'Technology' },
  { value: 'FINANCE', label: 'Finance & Banking' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'RETAIL', label: 'Retail & E-commerce' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'MEDIA', label: 'Media & Entertainment' },
  { value: 'CONSULTING', label: 'Consulting' },
  { value: 'OTHER', label: 'Other' },
];

const IMPLEMENTATION_TYPES = [
  { value: 'FULL_INTEGRATION', label: 'Full Integration' },
  { value: 'PILOT', label: 'Pilot Program' },
  { value: 'PROOF_OF_CONCEPT', label: 'Proof of Concept' },
  { value: 'RESEARCH', label: 'Research' },
];

const UseCaseFilters: React.FC<UseCaseFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const handleFilterChange = (key: keyof UseCaseFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.category ||
    filters.industry ||
    filters.implementationType ||
    filters.hasCode ||
    filters.hasROI;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <Select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Industry
          </label>
          <Select
            value={filters.industry || ''}
            onChange={(e) => handleFilterChange('industry', e.target.value || undefined)}
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind.value} value={ind.value}>
                {ind.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Implementation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Implementation Type
          </label>
          <Select
            value={filters.implementationType || ''}
            onChange={(e) =>
              handleFilterChange('implementationType', e.target.value || undefined)
            }
          >
            <option value="">All Types</option>
            {IMPLEMENTATION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Checkboxes */}
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hasCode || false}
              onChange={(e) => handleFilterChange('hasCode', e.target.checked || undefined)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Has code examples
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hasROI || false}
              onChange={(e) => handleFilterChange('hasROI', e.target.checked || undefined)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Has ROI data</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default UseCaseFilters;
