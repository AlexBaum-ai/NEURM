/**
 * CategoryList Component
 * Displays forum categories in a hierarchical grid layout
 */

import React from 'react';
import type { ForumCategory } from '../types';
import { CategoryCard } from './CategoryCard';

interface CategoryListProps {
  categories: ForumCategory[];
  onFollowToggle?: (categoryId: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({ categories, onFollowToggle }) => {
  // Separate main categories from subcategories
  const mainCategories = categories.filter((cat) => cat.level === 0);

  return (
    <div className="space-y-6">
      {mainCategories.map((mainCategory) => (
        <div key={mainCategory.id} className="space-y-3">
          {/* Main Category */}
          <CategoryCard
            category={mainCategory}
            isSubcategory={false}
            onFollowToggle={onFollowToggle}
          />

          {/* Subcategories (if any) */}
          {mainCategory.children && mainCategory.children.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {mainCategory.children.map((subCategory) => (
                <CategoryCard
                  key={subCategory.id}
                  category={subCategory}
                  isSubcategory={true}
                  onFollowToggle={onFollowToggle}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CategoryList;
