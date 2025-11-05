import React from 'react';
import type { Model } from '../types';

interface ModelHeroProps {
  model: Model;
}

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  beta: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  deprecated: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  coming_soon: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
};

const statusLabels = {
  active: 'Active',
  beta: 'Beta',
  deprecated: 'Deprecated',
  coming_soon: 'Coming Soon',
};

export const ModelHero: React.FC<ModelHeroProps> = ({ model }) => {
  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container-custom py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Provider Logo */}
          {model.provider.logo && (
            <div className="flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-3 flex items-center justify-center">
                <img
                  src={model.provider.logo}
                  alt={model.provider.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Model Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[model.status]}`}>
                {statusLabels[model.status]}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {model.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              {model.name}
            </h1>

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
              <span className="text-sm md:text-base">by</span>
              <a
                href={model.provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium text-sm md:text-base"
              >
                {model.provider.name}
              </a>
            </div>

            <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg leading-relaxed max-w-3xl">
              {model.description}
            </p>

            {model.releaseDate && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Released: {new Date(model.releaseDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelHero;
