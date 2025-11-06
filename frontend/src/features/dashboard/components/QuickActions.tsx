import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MessageSquare } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const actions = [
    {
      label: 'New Post',
      icon: Plus,
      to: '/forum/new',
      color: 'bg-primary-600 hover:bg-primary-700 text-white',
    },
    {
      label: 'Search Jobs',
      icon: Search,
      to: '/jobs',
      color:
        'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
    },
    {
      label: 'Browse Forum',
      icon: MessageSquare,
      to: '/forum',
      color:
        'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            to={action.to}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${action.color}`}
          >
            <Icon className="w-4 h-4" />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
};
