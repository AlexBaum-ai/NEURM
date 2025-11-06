import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import type { ProfileViewer } from '../types/profileViews';

interface ViewersListProps {
  viewers: ProfileViewer[];
  isLoading?: boolean;
}

export const ViewersList: React.FC<ViewersListProps> = ({ viewers, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Viewers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (viewers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Viewers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg
                className="w-8 h-8 text-gray-400 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No views yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              When people view your profile, they'll appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Viewers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {viewers.map((view) => (
            <div
              key={view.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {view.anonymous || !view.viewer ? (
                // Anonymous viewer
                <>
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Someone viewed your profile
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(view.viewedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Anonymous
                    </span>
                  </div>
                </>
              ) : (
                // Known viewer
                <>
                  <Link
                    to={`/profile/${view.viewer.username}`}
                    className="flex-shrink-0"
                  >
                    {view.viewer.avatarUrl ? (
                      <img
                        src={view.viewer.avatarUrl}
                        alt={view.viewer.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                          {view.viewer.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${view.viewer.username}`}
                      className="group"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {view.viewer.displayName}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(view.viewedAt), { addSuffix: true })}
                      </p>
                      {view.viewer.company && (
                        <>
                          <span className="text-gray-400 dark:text-gray-600">•</span>
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3 text-gray-400 dark:text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {view.viewer.company.name}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {view.viewer.company && (
                    <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                        Recruiter
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ViewersList;
