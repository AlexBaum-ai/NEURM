import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card/Card';
import { useModelJobs } from '../../hooks/useModels';
import type { ModelJob } from '../../types';

interface ModelJobsProps {
  modelSlug: string;
}

const ModelJobsContent: React.FC<ModelJobsProps> = ({ modelSlug }) => {
  const { data } = useModelJobs(modelSlug);

  if (!data || data.jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No job listings found for this model yet.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Check back later for opportunities!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.jobs.map((job: ModelJob) => (
        <Card key={job.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Company Logo */}
              {job.company.logo && (
                <div className="flex-shrink-0">
                  <img
                    src={job.company.logo}
                    alt={job.company.name}
                    className="w-12 h-12 rounded-lg object-contain bg-white dark:bg-gray-800 p-1"
                  />
                </div>
              )}

              {/* Job Content */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/jobs/${job.slug}`}
                  className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {job.title}
                </Link>
                <p className="mt-1 text-base text-gray-700 dark:text-gray-300 font-medium">
                  {job.company.name}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    📍 {job.location}
                  </span>
                  <span>•</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                    {job.jobType}
                  </span>
                  {job.salaryRange && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        💰 {job.salaryRange}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <time dateTime={job.postedAt}>
                    Posted{' '}
                    {new Date(job.postedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex-shrink-0">
                <Link
                  to={`/jobs/${job.slug}`}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {data.total > data.jobs.length && (
        <div className="text-center py-4">
          <Link
            to={`/jobs?model=${modelSlug}`}
            className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            View all {data.total} jobs →
          </Link>
        </div>
      )}
    </div>
  );
};

export const ModelJobs: React.FC<ModelJobsProps> = (props) => {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    >
      <ModelJobsContent {...props} />
    </Suspense>
  );
};

export default ModelJobs;
