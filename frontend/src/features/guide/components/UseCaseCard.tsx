import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Eye, MessageSquare, Code, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseCaseListItem } from '../types';

interface UseCaseCardProps {
  useCase: UseCaseListItem;
  className?: string;
}

const UseCaseCard: React.FC<UseCaseCardProps> = ({ useCase, className }) => {
  return (
    <Link
      to={`/guide/use-cases/${useCase.slug}`}
      className={cn(
        'block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'hover:shadow-lg transition-shadow duration-200 p-6',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {useCase.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {useCase.summary}
        </p>
      </div>

      {/* Company and Industry */}
      {useCase.companyName && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-700 dark:text-gray-300">
          <Building2 className="h-4 w-4" />
          <span className="font-medium">{useCase.companyName}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 dark:text-gray-400">{useCase.industry}</span>
        </div>
      )}

      {/* Tech Stack Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {useCase.techStack.slice(0, 5).map((tech) => (
          <span
            key={tech.id}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
          >
            {tech.name}
          </span>
        ))}
        {useCase.techStack.length > 5 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            +{useCase.techStack.length - 5} more
          </span>
        )}
      </div>

      {/* Results Metrics */}
      {useCase.resultsMetrics && useCase.resultsMetrics.length > 0 && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              {useCase.resultsMetrics.slice(0, 2).map((metric, idx) => (
                <div key={idx} className="text-sm text-green-700 dark:text-green-300">
                  <span className="font-medium">{metric.metric}:</span> {metric.value}
                  {metric.improvement && (
                    <span className="text-xs ml-1">({metric.improvement})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{useCase.viewCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{useCase.commentCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {useCase.hasCode && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
              title="Includes code examples"
            >
              <Code className="h-3 w-3" />
              Code
            </span>
          )}
          {useCase.hasROI && (
            <span
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
              title="Includes ROI data"
            >
              ROI
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default UseCaseCard;
