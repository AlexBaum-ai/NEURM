import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/common/Badge/Badge';
import type { Application, ApplicationStatus } from '../../types';

interface ApplicationCardProps {
  application: Application;
  onClick: (application: Application) => void;
}

const getStatusConfig = (status: ApplicationStatus) => {
  const configs = {
    submitted: {
      label: 'Submitted',
      variant: 'blue' as const,
    },
    under_review: {
      label: 'Under Review',
      variant: 'yellow' as const,
    },
    interview_scheduled: {
      label: 'Interview Scheduled',
      variant: 'purple' as const,
    },
    interview_completed: {
      label: 'Interview Completed',
      variant: 'purple' as const,
    },
    offer_extended: {
      label: 'Offer Extended',
      variant: 'green' as const,
    },
    offer_accepted: {
      label: 'Offer Accepted',
      variant: 'green' as const,
    },
    offer_declined: {
      label: 'Offer Declined',
      variant: 'gray' as const,
    },
    rejected: {
      label: 'Rejected',
      variant: 'red' as const,
    },
    withdrawn: {
      label: 'Withdrawn',
      variant: 'gray' as const,
    },
  };
  return configs[status] || configs.submitted;
};

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onClick }) => {
  const statusConfig = getStatusConfig(application.status);
  const { job } = application;

  const formattedSalary =
    job.salaryMin && job.salaryMax
      ? `${job.salaryCurrency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
      : job.salaryMin
      ? `${job.salaryCurrency} ${job.salaryMin.toLocaleString()}+`
      : 'Not specified';

  return (
    <div
      onClick={() => onClick(application)}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          {job.company.logoUrl ? (
            <img
              src={job.company.logoUrl}
              alt={job.company.companyName}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-400">
                {job.company.companyName.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {job.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {job.company.companyName}
              </p>
            </div>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>

          {/* Job Details */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formattedSalary}
            </span>
            <span className="capitalize">
              {job.locationType.replace('_', ' ')}
            </span>
            <span className="capitalize">
              {job.employmentType.replace('_', ' ')}
            </span>
          </div>

          {/* Application Dates */}
          <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-500">
            <span>
              Applied: {format(new Date(application.appliedAt), 'MMM d, yyyy')}
            </span>
            <span>
              Updated: {format(new Date(application.updatedAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
