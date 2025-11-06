import React, { useRef } from 'react';
import { Check, X, Info } from 'lucide-react';
import { Card } from '@/components/common/Card/Card';
import type { Model } from '../types';

interface ComparisonTableProps {
  models: Model[];
  onExport?: () => void;
}

interface ComparisonRow {
  label: string;
  category: string;
  getValue: (model: Model) => string | number | boolean | undefined;
  format?: (value: any) => string;
  compareType?: 'higher-better' | 'lower-better' | 'none';
  info?: string;
}

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return 'N/A';
  return `$${value.toFixed(2)}`;
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return 'N/A';
  return value.toLocaleString();
};

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
};

const formatList = (value?: string[]) => {
  if (!value || value.length === 0) return 'N/A';
  return value.join(', ');
};

const COMPARISON_ROWS: ComparisonRow[] = [
  // Basic Info
  {
    label: 'Provider',
    category: 'Basic Info',
    getValue: (model) => model.provider.name,
  },
  {
    label: 'Status',
    category: 'Basic Info',
    getValue: (model) => model.status,
    format: (value) => value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' '),
  },
  {
    label: 'Category',
    category: 'Basic Info',
    getValue: (model) => model.category,
    format: (value) => value.charAt(0).toUpperCase() + value.slice(1),
  },
  {
    label: 'Release Date',
    category: 'Basic Info',
    getValue: (model) => model.releaseDate,
    format: formatDate,
  },

  // Specifications
  {
    label: 'Context Window',
    category: 'Specifications',
    getValue: (model) => model.specs.contextWindow,
    format: formatNumber,
    compareType: 'higher-better',
    info: 'Maximum number of tokens the model can process in a single request',
  },
  {
    label: 'Max Output Tokens',
    category: 'Specifications',
    getValue: (model) => model.specs.maxOutputTokens,
    format: formatNumber,
    compareType: 'higher-better',
    info: 'Maximum number of tokens the model can generate',
  },
  {
    label: 'Training Data Cutoff',
    category: 'Specifications',
    getValue: (model) => model.specs.trainingDataCutoff,
  },
  {
    label: 'Model Size',
    category: 'Specifications',
    getValue: (model) => model.specs.modelSize,
  },
  {
    label: 'Languages',
    category: 'Specifications',
    getValue: (model) => model.specs.languages,
    format: formatList,
  },
  {
    label: 'Capabilities',
    category: 'Specifications',
    getValue: (model) => model.specs.capabilities,
    format: formatList,
  },

  // Pricing
  {
    label: 'Input Cost',
    category: 'Pricing',
    getValue: (model) => model.pricing?.inputCost,
    format: (value) => value !== undefined ? `${formatCurrency(value)}/1M tokens` : 'N/A',
    compareType: 'lower-better',
    info: 'Cost per 1 million input tokens',
  },
  {
    label: 'Output Cost',
    category: 'Pricing',
    getValue: (model) => model.pricing?.outputCost,
    format: (value) => value !== undefined ? `${formatCurrency(value)}/1M tokens` : 'N/A',
    compareType: 'lower-better',
    info: 'Cost per 1 million output tokens',
  },
];

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ models }) => {
  const tableRef = useRef<HTMLDivElement>(null);

  // Group rows by category
  const categorizedRows = COMPARISON_ROWS.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = [];
    }
    acc[row.category].push(row);
    return acc;
  }, {} as Record<string, ComparisonRow[]>);

  // Determine best/worst values for comparison highlighting
  const getComparisonClass = (row: ComparisonRow, value: any, allValues: any[]) => {
    if (!row.compareType || row.compareType === 'none') return '';

    const numericValues = allValues
      .map((v) => (typeof v === 'number' ? v : undefined))
      .filter((v) => v !== undefined) as number[];

    if (numericValues.length < 2) return '';
    if (typeof value !== 'number') return '';

    const max = Math.max(...numericValues);
    const min = Math.min(...numericValues);

    if (row.compareType === 'higher-better') {
      if (value === max) return 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100';
      if (value === min) return 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100';
    } else if (row.compareType === 'lower-better') {
      if (value === min) return 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100';
      if (value === max) return 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100';
    }

    return '';
  };

  const renderValue = (value: any, row: ComparisonRow) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="text-green-600 mx-auto" size={20} />
      ) : (
        <X className="text-red-600 mx-auto" size={20} />
      );
    }

    const formatted = row.format ? row.format(value) : value?.toString() || 'N/A';
    return formatted;
  };

  return (
    <div className="space-y-6" ref={tableRef} id="comparison-table">
      {/* Model Headers - Sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${models.length}, 1fr)` }}>
          <div className="font-semibold text-gray-900 dark:text-white flex items-end pb-2">
            Feature
          </div>
          {models.map((model) => (
            <Card key={model.id} className="p-4">
              <div className="text-center">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                  {model.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {model.provider.name}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Comparison Rows - Grouped by Category */}
      {Object.entries(categorizedRows).map(([category, rows]) => (
        <div key={category}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 px-2">
            {category}
          </h3>
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((row, rowIndex) => {
                const allValues = models.map((model) => row.getValue(model));

                return (
                  <div
                    key={rowIndex}
                    className="grid gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    style={{ gridTemplateColumns: `200px repeat(${models.length}, 1fr)` }}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {row.label}
                      {row.info && (
                        <div className="group relative">
                          <Info size={14} className="text-gray-400 cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-20">
                            {row.info}
                          </div>
                        </div>
                      )}
                    </div>
                    {models.map((model, modelIndex) => {
                      const value = row.getValue(model);
                      const comparisonClass = getComparisonClass(row, value, allValues);

                      return (
                        <div
                          key={modelIndex}
                          className={`flex items-center justify-center text-sm text-gray-900 dark:text-white p-2 rounded-lg transition-colors ${comparisonClass}`}
                        >
                          {renderValue(value, row)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ))}

      {/* Benchmarks Section */}
      {models.some((model) => model.benchmarks?.length > 0) && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 px-2">
            Benchmarks
          </h3>
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Get all unique benchmark names */}
              {Array.from(
                new Set(
                  models.flatMap((model) =>
                    model.benchmarks?.map((b) => b.name) || []
                  )
                )
              ).map((benchmarkName) => {
                const scores = models.map((model) => {
                  const benchmark = model.benchmarks?.find((b) => b.name === benchmarkName);
                  return benchmark?.score;
                });

                const max = Math.max(...scores.filter((s): s is number => s !== undefined));

                return (
                  <div
                    key={benchmarkName}
                    className="grid gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    style={{ gridTemplateColumns: `200px repeat(${models.length}, 1fr)` }}
                  >
                    <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      {benchmarkName}
                    </div>
                    {models.map((model, modelIndex) => {
                      const benchmark = model.benchmarks?.find((b) => b.name === benchmarkName);
                      const score = benchmark?.score;
                      const isBest = score === max;

                      return (
                        <div
                          key={modelIndex}
                          className={`flex items-center justify-center text-sm text-gray-900 dark:text-white p-2 rounded-lg transition-colors ${
                            isBest && score !== undefined
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 font-bold'
                              : ''
                          }`}
                        >
                          {score !== undefined ? (
                            <>
                              {score.toFixed(1)}
                              {benchmark?.maxScore && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                  /{benchmark.maxScore}
                                </span>
                              )}
                            </>
                          ) : (
                            'N/A'
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Mobile Warning */}
      <div className="md:hidden text-center text-sm text-gray-600 dark:text-gray-400 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        💡 Tip: Swipe horizontally to view all columns, or rotate your device for better viewing.
      </div>
    </div>
  );
};

export default ComparisonTable;
