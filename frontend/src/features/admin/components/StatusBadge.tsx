/**
 * Status Badge Component
 *
 * Displays content status with appropriate color
 */

import React from 'react';
import type { ContentStatus } from '../types';

interface StatusBadgeProps {
  status: ContentStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeConfig = (status: ContentStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending Review',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        };
      case 'approved':
        return {
          label: 'Approved',
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
      case 'flagged':
        return {
          label: 'Flagged',
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        };
      case 'hidden':
        return {
          label: 'Hidden',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        };
      case 'deleted':
        return {
          label: 'Deleted',
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        };
    }
  };

  const config = getBadgeConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
