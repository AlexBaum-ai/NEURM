import React from 'react';
import { useGlossaryCategories } from '../hooks/useGlossary';

interface CategoryFilterProps {
  selectedCategory?: string;
  onCategoryChange: (category?: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, onCategoryChange }) => {
  const { data: categories } = useGlossaryCategories();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
        Filter by Category
      </h3>
      <div className="space-y-2">
        <button
          onClick={() => onCategoryChange(undefined)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            !selectedCategory
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>All Categories</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {categories.reduce((sum, cat) => sum + cat.count, 0)}
            </span>
          </div>
        </button>
        {categories.map(category => (
          <button
            key={category.category}
            onClick={() => onCategoryChange(category.category)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              selectedCategory === category.category
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{category.category}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{category.count}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
