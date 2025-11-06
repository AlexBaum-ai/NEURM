/**
 * Content Type Badge Component
 *
 * Displays content type with appropriate icon and color
 */

import React from 'react';
import type { ContentType } from '../types';

interface ContentTypeBadgeProps {
  type: ContentType;
}

const ContentTypeBadge: React.FC<ContentTypeBadgeProps> = ({ type }) => {
  const getBadgeConfig = (type: ContentType) => {
    switch (type) {
      case 'article':
        return {
          label: 'Article',
          icon: '📄',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        };
      case 'topic':
        return {
          label: 'Topic',
          icon: '💬',
          className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        };
      case 'reply':
        return {
          label: 'Reply',
          icon: '↩️',
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        };
      case 'job':
        return {
          label: 'Job',
          icon: '💼',
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        };
      default:
        return {
          label: type,
          icon: '📌',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        };
    }
  };

  const config = getBadgeConfig(type);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default ContentTypeBadge;
