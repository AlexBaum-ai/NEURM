import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { useRelatedModels } from '../hooks/useModels';
import ModelStatusBadge from './ModelStatusBadge';

interface RelatedModelsProps {
  modelSlug: string;
}

export const RelatedModels: React.FC<RelatedModelsProps> = ({ modelSlug }) => {
  const { data, isLoading, error } = useRelatedModels(modelSlug);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Related Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.models.length) {
    return null; // Don't show the section if no related models
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Models</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Similar models you might be interested in
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.models.map((model) => (
            <Link
              key={model.id}
              to={`/models/${model.slug}`}
              className="group block"
            >
              <div className="h-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all">
                {/* Provider Logo & Name */}
                <div className="flex items-center gap-3 mb-3">
                  {model.provider.logo ? (
                    <img
                      src={model.provider.logo}
                      alt={model.provider.name}
                      className="w-8 h-8 rounded object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                      {model.provider.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                      {model.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {model.provider.name}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 min-h-[2.5rem]">
                  {model.description}
                </p>

                {/* Category Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full capitalize">
                    {model.category}
                  </span>

                  {/* Similarity Score */}
                  {model.similarity && (
                    <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                      {model.similarity}% match
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        {data.total > data.models.length && (
          <div className="mt-6 text-center">
            <Link
              to={`/models?category=${data.models[0]?.category || ''}`}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium text-sm"
            >
              View all {data.total} related models →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RelatedModels;
