import React, { useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { useModelVersions } from '../hooks/useModels';
import type { ModelVersion } from '../types';

interface ModelVersionsProps {
  modelSlug: string;
}

export const ModelVersions: React.FC<ModelVersionsProps> = ({ modelSlug }) => {
  const { data, isLoading, error } = useModelVersions(modelSlug);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.versions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No version history available
          </p>
        </CardContent>
      </Card>
    );
  }

  const latestVersion = data.versions.find((v) => v.isLatest) || data.versions[0];
  const currentVersion = selectedVersion
    ? data.versions.find((v) => v.version === selectedVersion)
    : latestVersion;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle>Version History</CardTitle>

          {/* Version Selector Dropdown */}
          <Select.Root
            value={selectedVersion || latestVersion.version}
            onValueChange={setSelectedVersion}
          >
            <Select.Trigger className="inline-flex items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]">
              <Select.Value>
                <span className="font-medium">{currentVersion?.version}</span>
                {currentVersion?.isLatest && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Latest)</span>
                )}
              </Select.Value>
              <Select.Icon className="text-gray-500">▼</Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden z-50">
                <Select.Viewport className="p-1">
                  {data.versions.map((version) => (
                    <Select.Item
                      key={version.id}
                      value={version.version}
                      className="relative flex items-center px-8 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 data-[state=checked]:bg-primary-50 dark:data-[state=checked]:bg-primary-900/20"
                    >
                      <Select.ItemText>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {version.version}
                        </span>
                        {version.isLatest && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            (Latest)
                          </span>
                        )}
                      </Select.ItemText>
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                        <span className="text-primary-600">✓</span>
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </CardHeader>

      <CardContent>
        {/* Selected Version Details */}
        {currentVersion && (
          <div className="mb-8 p-4 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentVersion.version}
                  {currentVersion.isLatest && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full">
                      Latest
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Released on {new Date(currentVersion.releasedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {currentVersion.changelog && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {currentVersion.changelog}
              </p>
            )}

            {currentVersion.features && currentVersion.features.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  ✨ New Features
                </h4>
                <ul className="space-y-1">
                  {currentVersion.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">●</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {currentVersion.improvements && currentVersion.improvements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  🔧 Improvements
                </h4>
                <ul className="space-y-1">
                  {currentVersion.improvements.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">●</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Timeline View */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Release Timeline
          </h3>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Timeline Items */}
            <div className="space-y-6">
              {data.versions.map((version, index) => (
                <div key={version.id} className="relative pl-10">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute left-2 w-4 h-4 rounded-full border-2 ${
                      version.isLatest
                        ? 'bg-primary-500 border-primary-600'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}
                  />

                  {/* Content */}
                  <div
                    className={`p-4 rounded-lg border ${
                      version.version === currentVersion?.version
                        ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    } hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => setSelectedVersion(version.version)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {version.version}
                        {version.isLatest && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full">
                            Latest
                          </span>
                        )}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(version.releasedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {version.changelog && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {version.changelog}
                      </p>
                    )}

                    {(version.features?.length || version.improvements?.length) ? (
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {version.features?.length ? (
                          <span>✨ {version.features.length} new feature{version.features.length > 1 ? 's' : ''}</span>
                        ) : null}
                        {version.improvements?.length ? (
                          <span>🔧 {version.improvements.length} improvement{version.improvements.length > 1 ? 's' : ''}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelVersions;
