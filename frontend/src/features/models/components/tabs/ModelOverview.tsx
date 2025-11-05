import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import ModelAPIQuickstart from '../ModelAPIQuickstart';
import type { Model } from '../../types';

interface ModelOverviewProps {
  model: Model;
}

export const ModelOverview: React.FC<ModelOverviewProps> = ({ model }) => {
  return (
    <div className="space-y-6">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>About {model.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {model.description}
          </p>
        </CardContent>
      </Card>

      {/* Capabilities */}
      {model.specs.capabilities && model.specs.capabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {model.specs.capabilities.map((capability, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 rounded-full text-sm font-medium"
                >
                  {capability}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Languages */}
      {model.specs.languages && model.specs.languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Supported Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {model.specs.languages.map((language, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm"
                >
                  {language}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Quickstart */}
      <ModelAPIQuickstart model={model} />

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {model.specs.trainingDataCutoff && (
              <>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Training Data Cutoff
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {model.specs.trainingDataCutoff}
                </dd>
              </>
            )}
            {model.releaseDate && (
              <>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Release Date
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {new Date(model.releaseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </>
            )}
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Provider
            </dt>
            <dd className="text-sm text-gray-900 dark:text-white">
              <a
                href={model.provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                {model.provider.name}
              </a>
            </dd>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Status
            </dt>
            <dd className="text-sm text-gray-900 dark:text-white capitalize">
              {model.status.replace('_', ' ')}
            </dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelOverview;
