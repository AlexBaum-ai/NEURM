import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, TrendingUp, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { JobMatch } from '../../types';

interface JobMatchesWidgetProps {
  jobs: JobMatch[];
}

const REMOTE_TYPE_LABELS = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

export const JobMatchesWidget: React.FC<JobMatchesWidgetProps> = ({ jobs }) => {
  return (
    <div className="space-y-3">
      {jobs.slice(0, 5).map((job) => (
        <Link
          key={job.id}
          to={`/jobs/${job.slug}`}
          className="block group hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 py-3 rounded-lg transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-1">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                  {job.title}
                </h4>
                <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                  <TrendingUp className="w-3 h-3" />
                  {job.matchScore}%
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {job.companyName}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {job.location}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {REMOTE_TYPE_LABELS[job.remoteType]}
                </span>
                {job.salaryRange && (
                  <span>
                    {job.salaryRange.currency}{' '}
                    {job.salaryRange.min.toLocaleString()}-
                    {job.salaryRange.max.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}

      {jobs.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No job matches yet</p>
          <Link
            to="/jobs"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block"
          >
            Browse all jobs
          </Link>
        </div>
      )}

      {jobs.length > 0 && (
        <Link
          to="/jobs"
          className="flex items-center justify-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors pt-2"
        >
          See all jobs
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};
