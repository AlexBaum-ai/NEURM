import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import type { ModelBenchmark } from '../types';

interface ModelBenchmarksProps {
  benchmarks: ModelBenchmark[];
}

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];

export const ModelBenchmarks: React.FC<ModelBenchmarksProps> = ({ benchmarks }) => {
  if (!benchmarks || benchmarks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No benchmark data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Transform data for the chart
  const chartData = benchmarks.map((benchmark) => ({
    name: benchmark.name,
    score: benchmark.score,
    maxScore: benchmark.maxScore || 100,
    percentage: benchmark.maxScore ? (benchmark.score / benchmark.maxScore) * 100 : benchmark.score,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benchmark Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart */}
          <div className="w-full h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                />
                <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#374151', fontWeight: 600 }}
                  formatter={(value: number, _name: string, props: any) => {
                    return [
                      `${value.toFixed(1)}${props.payload.maxScore ? ` / ${props.payload.maxScore}` : ''}`,
                      'Score'
                    ];
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Benchmark Details */}
          <div className="space-y-3">
            {benchmarks.map((benchmark, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {benchmark.name}
                    </span>
                  </div>
                  {benchmark.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-5">
                      {benchmark.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {benchmark.score.toFixed(1)}
                  </span>
                  {benchmark.maxScore && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {' '}/ {benchmark.maxScore}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelBenchmarks;
