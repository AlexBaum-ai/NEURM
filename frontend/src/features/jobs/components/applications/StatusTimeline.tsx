import React from 'react';
import { format } from 'date-fns';
import type { ApplicationStatusHistoryItem, ApplicationStatus } from '../../types';

interface StatusTimelineProps {
  statusHistory: ApplicationStatusHistoryItem[];
  currentStatus: ApplicationStatus;
}

const getStatusConfig = (status: ApplicationStatus) => {
  const configs = {
    submitted: {
      label: 'Submitted',
      color: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    under_review: {
      label: 'Under Review',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    interview_scheduled: {
      label: 'Interview Scheduled',
      color: 'bg-purple-500',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    interview_completed: {
      label: 'Interview Completed',
      color: 'bg-purple-500',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    offer_extended: {
      label: 'Offer Extended',
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400',
    },
    offer_accepted: {
      label: 'Offer Accepted',
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400',
    },
    offer_declined: {
      label: 'Offer Declined',
      color: 'bg-gray-500',
      textColor: 'text-gray-600 dark:text-gray-400',
    },
    rejected: {
      label: 'Rejected',
      color: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400',
    },
    withdrawn: {
      label: 'Withdrawn',
      color: 'bg-gray-500',
      textColor: 'text-gray-600 dark:text-gray-400',
    },
  };
  return configs[status] || configs.submitted;
};

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ statusHistory, currentStatus }) => {
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status History</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {sortedHistory.map((item, index) => {
            const config = getStatusConfig(item.status);
            const isLast = index === sortedHistory.length - 1;

            return (
              <div key={index} className="relative flex items-start">
                {/* Timeline dot */}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${config.color} ${
                    isLast ? 'ring-4 ring-white dark:ring-gray-900' : ''
                  }`}
                >
                  {isLast && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>

                {/* Content */}
                <div className="ml-4 flex-1 pb-6">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold ${config.textColor}`}>{config.label}</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  {item.note && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
