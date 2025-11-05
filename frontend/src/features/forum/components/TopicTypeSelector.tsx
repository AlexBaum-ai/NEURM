import React from 'react';
import { cn } from '@/lib/utils';
import type { TopicType } from '../types';

interface TopicTypeSelectorProps {
  value: TopicType | '';
  onChange: (type: TopicType) => void;
  error?: string;
}

const topicTypes: Array<{
  type: TopicType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    type: 'discussion',
    label: 'Discussion',
    description: 'General discussion on any LLM topic',
    icon: '💬',
  },
  {
    type: 'question',
    label: 'Question',
    description: 'Ask for help or clarification',
    icon: '❓',
  },
  {
    type: 'showcase',
    label: 'Showcase',
    description: 'Show off your project or implementation',
    icon: '🎨',
  },
  {
    type: 'tutorial',
    label: 'Tutorial',
    description: 'Share a guide or how-to',
    icon: '📚',
  },
  {
    type: 'announcement',
    label: 'Announcement',
    description: 'Important news or updates',
    icon: '📢',
  },
  {
    type: 'paper',
    label: 'Paper',
    description: 'Discuss a research paper',
    icon: '📄',
  },
];

export const TopicTypeSelector: React.FC<TopicTypeSelectorProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <div className="w-full">
      <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Topic Type <span className="text-accent-500">*</span>
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topicTypes.map((type) => (
          <button
            key={type.type}
            type="button"
            onClick={() => onChange(type.type)}
            className={cn(
              'relative flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all hover:border-primary-500',
              value === type.type
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
              error && value !== type.type && 'border-accent-300'
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">{type.icon}</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {type.label}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{type.description}</p>
            {value === type.type && (
              <div className="absolute right-2 top-2 h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-accent-600 dark:text-accent-400">{error}</p>}
    </div>
  );
};

export default TopicTypeSelector;
