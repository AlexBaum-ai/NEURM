import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/common/Card/Card';
import type { MatchFactor } from '../../types';

interface MatchBreakdownProps {
  factors: MatchFactor[];
  matchScore: number;
}

/**
 * Get color based on factor score
 */
const getBarColor = (score: number): string => {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#f59e0b'; // yellow
  return '#6b7280'; // gray
};

/**
 * Custom tooltip for the bar chart
 */
const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {data.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Score: <span className="font-medium">{data.score}%</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Weight: {data.weight}%
        </p>
        {data.details && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
            {data.details}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const MatchBreakdown: React.FC<MatchBreakdownProps> = ({
  factors,
  matchScore,
}) => {
  if (factors.length === 0) {
    return null;
  }

  // Prepare data for the chart
  const chartData = factors.map((factor) => ({
    name: factor.name,
    score: factor.score,
    weight: factor.weight,
    details: factor.details,
  }));

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Match Score Breakdown
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Overall Match: <span className="font-semibold text-xl text-primary-600 dark:text-primary-400">{matchScore}%</span>
        </p>
      </div>

      {/* Bar Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Factor List with Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Factor Details
        </h4>
        {factors.map((factor, index) => (
          <div
            key={index}
            className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {factor.name}
                </span>
                <span
                  className="text-sm font-semibold ml-2"
                  style={{ color: getBarColor(factor.score) }}
                >
                  {factor.score}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${factor.score}%`,
                      backgroundColor: getBarColor(factor.score),
                    }}
                  />
                </div>
              </div>
              {factor.details && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {factor.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Color Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Excellent (80%+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Good (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6b7280' }}></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Fair (&lt;60%)</span>
        </div>
      </div>
    </Card>
  );
};

export default MatchBreakdown;
