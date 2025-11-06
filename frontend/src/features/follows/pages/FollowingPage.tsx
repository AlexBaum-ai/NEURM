import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import { FollowButton } from '../components/FollowButton';
import { useFollowing } from '../hooks/useFollows';
import type { FollowEntityType, User, Company, Category, Tag, Model, Follow } from '../types';

const FollowingPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [activeFilter, setActiveFilter] = useState<FollowEntityType | 'all'>('all');

  // Mock user ID - in real app, you'd fetch this from user data
  const userId = 1; // Replace with actual user lookup

  const filterType = activeFilter === 'all' ? undefined : activeFilter;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useFollowing(userId, filterType);

  const allFollowing = data?.pages.flatMap((page) => page.following) || [];
  const isEmpty = !isLoading && allFollowing.length === 0;

  const filters: { value: FollowEntityType | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'user', label: 'Users' },
    { value: 'company', label: 'Companies' },
    { value: 'category', label: 'Categories' },
    { value: 'tag', label: 'Tags' },
    { value: 'model', label: 'Models' },
  ];

  const getEntityInfo = (follow: Follow) => {
    const entity = follow.entity;
    if (!entity) return { name: '', link: '', avatar: null, description: null };

    switch (follow.entityType) {
      case 'user':
        const user = entity as User;
        return {
          name: user.displayName,
          username: user.username,
          link: `/profile/${user.username}`,
          avatar: user.avatarUrl,
          description: user.bio,
        };
      case 'company':
        const company = entity as Company;
        return {
          name: company.name,
          link: `/companies/${company.slug}`,
          avatar: company.logoUrl,
          description: company.description,
        };
      case 'category':
        const category = entity as Category;
        return {
          name: category.name,
          link: `/news?category=${category.slug}`,
          avatar: null,
          description: category.description,
        };
      case 'tag':
        const tag = entity as Tag;
        return {
          name: tag.name,
          link: `/news?tag=${tag.slug}`,
          avatar: null,
          description: null,
        };
      case 'model':
        const model = entity as Model;
        return {
          name: model.name,
          link: `/models/${model.slug}`,
          avatar: null,
          description: `by ${model.provider}`,
        };
      default:
        return { name: '', link: '', avatar: null, description: null };
    }
  };

  return (
    <>
      <Helmet>
        <title>{username ? `${username}'s Following` : 'Following'} - Neurmatic</title>
      </Helmet>

      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <Link to={`/profile/${username}`} className="hover:text-primary-600">
                {username}
              </Link>
              <span>•</span>
              <span>Following</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Following
            </h1>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <Button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  variant={activeFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Following List */}
          {isEmpty ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Not following anyone yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {username} isn't following anyone yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allFollowing.map((follow) => {
                const entityInfo = getEntityInfo(follow);

                return (
                  <Card key={follow.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Avatar */}
                          <Link to={entityInfo.link} className="flex-shrink-0">
                            {entityInfo.avatar ? (
                              <img
                                src={entityInfo.avatar}
                                alt={entityInfo.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                  {entityInfo.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </Link>

                          {/* Entity Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                to={entityInfo.link}
                                className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 truncate"
                              >
                                {entityInfo.name}
                              </Link>
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full flex-shrink-0">
                                {follow.entityType}
                              </span>
                            </div>
                            {entityInfo.username && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                @{entityInfo.username}
                              </p>
                            )}
                            {entityInfo.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {entityInfo.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Unfollow Button */}
                        <FollowButton
                          entityType={follow.entityType}
                          entityId={follow.entityId}
                          entityName={entityInfo.name}
                          size="sm"
                          showCount={false}
                          className="flex-shrink-0"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    variant="outline"
                  >
                    {isFetchingNextPage ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FollowingPage;
