import React, { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '../api/profileApi';
import { PremiumUpsell } from '../components/PremiumUpsell';
import { ViewersList } from '../components/ViewersList';
import { ViewsChart } from '../components/ViewsChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';

const ProfileViewsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const limit = 20;

  // Check if user has premium access
  const isPremium = user?.role && ['premium', 'admin', 'company'].includes(user.role);

  // Fetch profile views data (only if premium)
  const { data, isLoading } = useSuspenseQuery({
    queryKey: ['profileViews', page],
    queryFn: () => profileApi.getMyProfileViewers(page, limit),
    enabled: isPremium,
  });

  // If not premium, show upsell
  if (!isPremium) {
    return (
      <>
        <Helmet>
          <title>Who Viewed My Profile | Neurmatic</title>
        </Helmet>

        <div className="container-custom py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Who Viewed My Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Upgrade to Premium to see who's checking out your profile
              </p>
            </div>

            <PremiumUpsell feature="Who Viewed My Profile" />
          </div>
        </div>
      </>
    );
  }

  const profileViewsData = data;
  const hasViews = profileViewsData.views.length > 0;

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < profileViewsData.pagination.totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <>
      <Helmet>
        <title>Who Viewed My Profile | Neurmatic</title>
      </Helmet>

      <div className="container-custom py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Who Viewed My Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              See who's been checking out your profile in the last 30 days
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">
                    {profileViewsData.totalViews}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    in the last 30 days
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Unique Viewers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">
                    {profileViewsData.uniqueViewers}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    people viewed your profile
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Views Chart */}
          {hasViews && (
            <div className="mb-8">
              <ViewsChart views={profileViewsData.views} />
            </div>
          )}

          {/* Viewers List */}
          <div className="mb-8">
            <ViewersList viewers={profileViewsData.views} isLoading={isLoading} />
          </div>

          {/* Pagination */}
          {profileViewsData.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <Button
                onClick={handlePreviousPage}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {profileViewsData.pagination.totalPages}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={page === profileViewsData.pagination.totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}

          {/* Tips Card */}
          {hasViews && (
            <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Pro Tip
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      Keep your profile up-to-date to make a great impression on visitors.
                      Add your latest projects, skills, and experience to stand out!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileViewsPage;
