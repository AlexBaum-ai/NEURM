import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryNode } from '../types';

interface CategorySidebarProps {
  categories: CategoryNode[];
  activeSlug?: string;
  onCategorySelect: (slug: string | undefined) => void;
  className?: string;
}

interface CategoryItemProps {
  category: CategoryNode;
  activeSlug?: string;
  onSelect: (slug: string | undefined) => void;
  level: number;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, activeSlug, onSelect, level }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isActive = activeSlug === category.slug;
  const hasChildren = category.children && category.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelect(isActive ? undefined : category.slug);
  };

  return (
    <div className="w-full">
      <button
        onClick={handleSelect}
        className={cn(
          'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          isActive && 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400',
          !isActive && 'text-gray-700 dark:text-gray-300'
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {hasChildren && (
            <button
              onClick={handleToggle}
              className="flex shrink-0 items-center justify-center"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          <span className="truncate font-medium">{category.name}</span>
        </div>
        <span
          className={cn(
            'ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs',
            isActive
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          {category.articleCount}
        </span>
      </button>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              activeSlug={activeSlug}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  activeSlug,
  onCategorySelect,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Browse articles by topic
        </p>
      </div>

      <div className="space-y-1">
        {/* All Articles option */}
        <button
          onClick={() => onCategorySelect(undefined)}
          className={cn(
            'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            !activeSlug &&
              'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400',
            activeSlug && 'text-gray-700 dark:text-gray-300'
          )}
        >
          <span className="font-medium">All Articles</span>
        </button>

        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            activeSlug={activeSlug}
            onSelect={onCategorySelect}
            level={0}
          />
        ))}
      </div>
    </div>
  );
};

export default CategorySidebar;
