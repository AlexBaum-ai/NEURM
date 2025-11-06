import React from 'react';
import type { ModelStatus } from '../types';

interface ModelStatusBadgeProps {
  status: ModelStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<ModelStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  active: {
    label: 'Active',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: '✓',
  },
  deprecated: {
    label: 'Deprecated',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: '⚠',
  },
  beta: {
    label: 'Beta',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: '🔬',
  },
  coming_soon: {
    label: 'Coming Soon',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    icon: '🚀',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const ModelStatusBadge: React.FC<ModelStatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default ModelStatusBadge;
