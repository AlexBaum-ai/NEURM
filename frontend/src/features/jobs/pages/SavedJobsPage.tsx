import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Bookmark, Briefcase, Clock, AlertCircle } from 'lucide-react';
import { useSavedJobs, useSaveJob, useUnsaveJob } from '../hooks';
import { JobCard } from '../components/JobCard';
import { Card } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import type { JobListItem } from '../types';

export const SavedJobsPage: React.FC = () => {
  const { data: savedJobs, isLoading, error } = useSavedJobs();
  const saveJobMutation = useSaveJob();
  const unsaveJobMutation = useUnsaveJob();

  const handleSaveJob = (job: JobListItem) => {
    saveJobMutation.mutate({ slug: job.slug });
  };

  const handleUnsaveJob = (job: JobListItem) => {
    unsaveJobMutation.mutate(job.slug);
  };

  // Filter jobs by deadline status
  const jobsWithDeadline = savedJobs?.filter((job) => job.applicationDeadline) || [];
  const urgentJobs = jobsWithDeadline.filter((job) => {
    const daysUntilDeadline = differenceInDays(
      new Date(job.applicationDeadline!),
      new Date()
    );
    return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
  });

  return (
    <>
      <Helmet>
        <title>Saved Jobs | Neurmatic</title>
        <meta
          name="description"
          content="View and manage your saved job opportunities."
        />
      </Helmet>

      <div className="container-custom py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Saved Jobs
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Keep track of jobs you're interested in
          </p>
        </div>

        {/* Urgent Deadline Warning */}
        {!isLoading && urgentJobs.length > 0 && (
          <Card className="mb-6 border-orange-500 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20">
            <div className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  Deadlines Approaching
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  {urgentJobs.length} saved job{urgentJobs.length !== 1 ? 's' : ''} with
                  deadline{urgentJobs.length !== 1 ? 's' : ''} in the next 3 days
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 text-center">
            <p className="text-accent-600 dark:text-accent-400 mb-4">
              Failed to load saved jobs. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && savedJobs?.length === 0 && (
          <Card className="p-12 text-center">
            <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Saved Jobs Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Start building your collection by clicking the bookmark icon on any job
              listing that interests you.
            </p>
            <Link to="/jobs">
              <Button size="lg">
                <Briefcase className="w-5 h-5 mr-2" />
                Browse Jobs
              </Button>
            </Link>
          </Card>
        )}

        {/* Jobs Grid */}
        {!isLoading && !error && savedJobs && savedJobs.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''}
              </p>
              <Link
                to="/jobs/alerts"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Create job alert
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {savedJobs.map((job) => {
                const daysUntilDeadline = job.applicationDeadline
                  ? differenceInDays(new Date(job.applicationDeadline), new Date())
                  : null;

                return (
                  <div key={job.id} className="relative">
                    <JobCard
                      job={{ ...job, isSaved: true }}
                      onSave={handleSaveJob}
                      onUnsave={handleUnsaveJob}
                      isSaving={
                        saveJobMutation.isPending || unsaveJobMutation.isPending
                      }
                    />

                    {/* Deadline Badge */}
                    {daysUntilDeadline !== null && daysUntilDeadline <= 7 && daysUntilDeadline >= 0 && (
                      <div className="absolute top-2 left-2 z-10">
                        <div
                          className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                            daysUntilDeadline <= 3
                              ? 'bg-orange-500 text-white'
                              : 'bg-yellow-500 text-gray-900'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {daysUntilDeadline === 0
                            ? 'Closes today'
                            : daysUntilDeadline === 1
                            ? 'Closes tomorrow'
                            : `Closes in ${daysUntilDeadline} days`}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SavedJobsPage;
