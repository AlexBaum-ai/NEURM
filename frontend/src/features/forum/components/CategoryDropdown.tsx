import React from 'react';
import { cn } from '@/lib/utils';
import type { ForumCategory } from '../types';

interface CategoryDropdownProps {
  categories: ForumCategory[];
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

/**
 * Flattens hierarchical categories for dropdown display
 */
const flattenCategories = (categories: ForumCategory[]): Array<ForumCategory & { depth: number }> => {
  const result: Array<ForumCategory & { depth: number }> = [];

  const flatten = (cats: ForumCategory[], depth: number = 0) => {
    cats.forEach((cat) => {
      // Only show active and public categories
      if (cat.isActive && cat.visibility === 'public') {
        result.push({ ...cat, depth });
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, depth + 1);
        }
      }
    });
  };

  flatten(categories);
  return result;
};

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  value,
  onChange,
  error,
  label = 'Category',
  required = true,
}) => {
  const flatCategories = React.useMemo(() => flattenCategories(categories), [categories]);
  const inputId = React.useId();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="ml-1 text-accent-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900',
            error && 'border-accent-500 focus-visible:ring-accent-500'
          )}
        >
          <option value="">Select a category</option>
          {flatCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {'  '.repeat(category.depth)}
              {category.icon && `${category.icon} `}
              {category.name}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && <p className="mt-1 text-sm text-accent-600 dark:text-accent-400">{error}</p>}
    </div>
  );
};

export default CategoryDropdown;
