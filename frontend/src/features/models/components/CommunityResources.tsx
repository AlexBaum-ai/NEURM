import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { useCommunityResources } from '../hooks/useModels';
import type { CommunityResource } from '../types';

interface CommunityResourcesProps {
  modelSlug: string;
}

const resourceIcons: Record<CommunityResource['type'], string> = {
  tutorial: '📚',
  use_case: '💡',
  article: '📰',
  video: '🎥',
};

const resourceLabels: Record<CommunityResource['type'], string> = {
  tutorial: 'Tutorial',
  use_case: 'Use Case',
  article: 'Article',
  video: 'Video',
};

const resourceColors: Record<CommunityResource['type'], string> = {
  tutorial: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  use_case: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  article: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  video: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
};

export const CommunityResources: React.FC<CommunityResourcesProps> = ({ modelSlug }) => {
  const { data, isLoading, error } = useCommunityResources(modelSlug);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.resources.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No community resources available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Resources</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Tutorials, use cases, and articles from the community
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
                    {resourceIcons[resource.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                        {resource.title}
                      </h4>
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${resourceColors[resource.type]}`}
                      >
                        {resourceLabels[resource.type]}
                      </span>
                    </div>

                    {resource.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {resource.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {resource.author && (
                        <span>
                          By <span className="font-medium">{resource.author}</span>
                        </span>
                      )}
                      {resource.publishedAt && (
                        <>
                          <span>•</span>
                          <span>
                            {new Date(resource.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </>
                      )}
                      <span className="ml-auto text-primary-600 dark:text-primary-400 group-hover:underline">
                        View →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* View More */}
        {data.total > data.resources.length && (
          <div className="mt-4 text-center">
            <button className="text-primary-600 dark:text-primary-400 hover:underline font-medium text-sm">
              View all {data.total} resources →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityResources;
