import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import { FollowButton } from '../components/FollowButton';
import { useFollowers } from '../hooks/useFollows';

const FollowersPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();

  // Mock user ID - in real app, you'd fetch this from user data
  const userId = 1; // Replace with actual user lookup

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useFollowers(userId);

  const allFollowers = data?.pages.flatMap((page) => page.followers) || [];
  const isEmpty = !isLoading && allFollowers.length === 0;

  return (
    <>
      <Helmet>
        <title>{username ? `${username}'s Followers` : 'Followers'} - Neurmatic</title>
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
              <span>Followers</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Followers
            </h1>
          </div>

          {/* Followers List */}
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    No followers yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {username} doesn't have any followers yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allFollowers.map((follower) => (
                <Card key={follower.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <Link
                          to={`/profile/${follower.username}`}
                          className="flex-shrink-0"
                        >
                          {follower.avatarUrl ? (
                            <img
                              src={follower.avatarUrl}
                              alt={follower.displayName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                              <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                {follower.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </Link>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/profile/${follower.username}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 block truncate"
                          >
                            {follower.displayName}
                          </Link>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            @{follower.username}
                          </p>
                          {follower.bio && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {follower.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Follow Button */}
                      <FollowButton
                        entityType="user"
                        entityId={follower.id}
                        entityName={follower.displayName}
                        size="sm"
                        showCount={false}
                        className="flex-shrink-0"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

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

export default FollowersPage;
