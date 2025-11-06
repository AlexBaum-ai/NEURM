import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { useBenchmarkComparison } from '../hooks/useModels';

interface BenchmarkComparisonProps {
  modelIds: number[];
  currentModelId?: number;
}

const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

export const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({
  modelIds,
  currentModelId,
}) => {
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(null);
  const { data, isLoading, error } = useBenchmarkComparison(modelIds);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || modelIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            {modelIds.length === 0
              ? 'Select models to compare their benchmarks'
              : 'Unable to load benchmark comparison data'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Assign colors to models
  const modelsWithColors = data.models.map((model, index) => ({
    ...model,
    color: model.color || CHART_COLORS[index % CHART_COLORS.length],
  }));

  // Transform data for Recharts
  const chartData = data.benchmarks.map((benchmark) => {
    const dataPoint: any = {
      name: benchmark.name,
      description: benchmark.description,
    };

    benchmark.scores.forEach((score) => {
      const model = modelsWithColors.find((m) => m.id === score.modelId);
      if (model) {
        dataPoint[model.name] = score.score;
        dataPoint[`${model.name}_maxScore`] = score.maxScore || 100;
      }
    });

    return dataPoint;
  });

  // Filter data if a specific benchmark is selected
  const displayData = selectedBenchmark
    ? chartData.filter((d) => d.name === selectedBenchmark)
    : chartData;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <CardTitle>Benchmark Comparison</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Compare performance across different benchmarks
            </p>
          </div>

          {/* Benchmark Filter */}
          {chartData.length > 5 && (
            <select
              value={selectedBenchmark || ''}
              onChange={(e) => setSelectedBenchmark(e.target.value || null)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Benchmarks</option>
              {data.benchmarks.map((benchmark) => (
                <option key={benchmark.name} value={benchmark.name}>
                  {benchmark.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          {modelsWithColors.map((model) => (
            <div key={model.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: model.color }}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {model.name}
              </span>
              {currentModelId === model.id && (
                <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full">
                  Current
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="w-full h-[400px] md:h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                className="text-xs fill-gray-600 dark:fill-gray-400"
              />
              <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '12px',
                }}
                labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '8px' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;

                  const benchmarkData = chartData.find((d) => d.name === label);

                  return (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">
                        {label}
                      </p>
                      {benchmarkData?.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {benchmarkData.description}
                        </p>
                      )}
                      <div className="space-y-1">
                        {payload.map((entry: any) => {
                          const maxScore = benchmarkData?.[`${entry.dataKey}_maxScore`];
                          return (
                            <div
                              key={entry.dataKey}
                              className="flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {entry.dataKey}:
                                </span>
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {entry.value?.toFixed(1)}
                                {maxScore && ` / ${maxScore}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
              />

              {/* Bars for each model */}
              {modelsWithColors.map((model) => (
                <Bar
                  key={model.id}
                  dataKey={model.name}
                  fill={model.color}
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Benchmark Details Table */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                  Benchmark
                </th>
                {modelsWithColors.map((model) => (
                  <th
                    key={model.id}
                    className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white"
                  >
                    {model.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.benchmarks.map((benchmark, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {benchmark.name}
                      </div>
                      {benchmark.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {benchmark.description}
                        </div>
                      )}
                    </div>
                  </td>
                  {modelsWithColors.map((model) => {
                    const score = benchmark.scores.find((s) => s.modelId === model.id);
                    const maxScore = score?.maxScore || 100;
                    const percentage = score ? (score.score / maxScore) * 100 : 0;

                    return (
                      <td key={model.id} className="px-4 py-3 text-center">
                        {score ? (
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {score.score.toFixed(1)}
                            </div>
                            {score.maxScore && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                / {score.maxScore}
                              </div>
                            )}
                            <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  backgroundColor: model.color,
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">N/A</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BenchmarkComparison;
