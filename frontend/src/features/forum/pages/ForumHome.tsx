/**
 * ForumHome Page
 * Main forum page displaying all categories with hierarchy
 */

import React, { Suspense } from 'react';
import { MessageSquare, TrendingUp, Clock } from 'lucide-react';
import { useCategories } from '../hooks';
import { CategoryList, CategorySkeleton, EmptyCategories } from '../components';
import { useForumStore } from '../store/forumStore';
import { Card } from '@/components/common/Card/Card';

const ForumHomeContent: React.FC = () => {
  const { categories, count } = useCategories();
  const toggleFollowCategory = useForumStore((state) => state.toggleFollowCategory);

  // Show empty state if no categories
  if (!categories || categories.length === 0) {
    return <EmptyCategories canCreate={false} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {categories.reduce((sum, cat) => sum + cat.topicCount, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Topics</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {categories.reduce((sum, cat) => sum + cat.postCount, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Posts</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Categories List */}
      <CategoryList categories={categories} onFollowToggle={toggleFollowCategory} />
    </div>
  );
};

export const ForumHome: React.FC = () => {
  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Forum Categories
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore topics, ask questions, and connect with the LLM community
        </p>
      </div>

      {/* Content with Suspense */}
      <Suspense fallback={<CategorySkeleton count={5} showSubcategories={true} />}>
        <ForumHomeContent />
      </Suspense>
    </div>
  );
};

export default ForumHome;
