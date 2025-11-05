import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import ModelPricing from '../ModelPricing';
import ModelBenchmarks from '../ModelBenchmarks';
import type { Model } from '../../types';

interface ModelSpecsProps {
  model: Model;
}

export const ModelSpecs: React.FC<ModelSpecsProps> = ({ model }) => {
  return (
    <div className="space-y-6">
      {/* Technical Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {model.specs.contextWindow && (
              <>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Context Window
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white font-mono">
                  {model.specs.contextWindow.toLocaleString()} tokens
                </dd>
              </>
            )}
            {model.specs.maxOutputTokens && (
              <>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Max Output Tokens
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white font-mono">
                  {model.specs.maxOutputTokens.toLocaleString()} tokens
                </dd>
              </>
            )}
            {model.specs.modelSize && (
              <>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Model Size
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {model.specs.modelSize}
                </dd>
              </>
            )}
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
              Category
            </dt>
            <dd className="text-sm text-gray-900 dark:text-white capitalize">
              {model.category}
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

      {/* Capabilities */}
      {model.specs.capabilities && model.specs.capabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Capabilities & Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {model.specs.capabilities.map((capability, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-green-500 dark:text-green-400">✓</span>
                  <span className="text-sm text-gray-900 dark:text-white">{capability}</span>
                </div>
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
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                >
                  {language}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing */}
      <ModelPricing pricing={model.pricing} />

      {/* Benchmarks */}
      <ModelBenchmarks benchmarks={model.benchmarks} />

      {/* API Reference */}
      {(model.apiEndpoint || model.documentationUrl) && (
        <Card>
          <CardHeader>
            <CardTitle>API & Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {model.apiEndpoint && (
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    API Endpoint
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {model.apiEndpoint}
                  </dd>
                </div>
              )}
              {model.documentationUrl && (
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Documentation
                  </dt>
                  <dd>
                    <a
                      href={model.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                    >
                      {model.documentationUrl}
                    </a>
                  </dd>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModelSpecs;
