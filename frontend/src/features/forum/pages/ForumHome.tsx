/**
 * ForumHome Page
 * Main forum page displaying all categories with hierarchy
 */

import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, TrendingUp, Clock, HelpCircle } from 'lucide-react';
import { useCategories } from '../hooks';
import { CategoryList, CategorySkeleton, EmptyCategories, SearchBar } from '../components';
import { useForumStore } from '../store/forumStore';
import { Card } from '@/components/common/Card/Card';
import { useQuery } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import { Box } from '@mui/material';

const ForumHomeContent: React.FC = () => {
  const { categories, count } = useCategories();
  const toggleFollowCategory = useForumStore((state) => state.toggleFollowCategory);

  // Fetch unanswered count (non-suspense query for badge)
  const { data: unansweredData } = useQuery({
    queryKey: ['unanswered-count'],
    queryFn: () => forumApi.getUnansweredTopics({ limit: 1 }),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const unansweredCount = unansweredData?.pagination.totalCount ?? 0;

  // Show empty state if no categories
  if (!categories || categories.length === 0) {
    return <EmptyCategories canCreate={false} />;
  }

  return (
    <div className="space-y-6">
      {/* Unanswered Questions Call-to-Action */}
      {unansweredCount > 0 && (
        <Link to="/forum/unanswered" className="block no-underline">
          <Card className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-2 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-orange-500 dark:bg-orange-600 flex items-center justify-center shadow-md">
                  <HelpCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {unansweredCount} Unanswered Question{unansweredCount !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Help the community by answering these questions
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-6 py-3 bg-orange-500 dark:bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors">
                <span>View Questions</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </Link>
      )}

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
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Explore topics, ask questions, and connect with the LLM community
        </p>

        {/* Search Bar */}
        <Box sx={{ maxWidth: 600, mt: 3 }}>
          <SearchBar placeholder="Search forum topics and discussions..." />
        </Box>
      </div>

      {/* Content with Suspense */}
      <Suspense fallback={<CategorySkeleton count={5} showSubcategories={true} />}>
        <ForumHomeContent />
      </Suspense>
    </div>
  );
};

export default ForumHome;
