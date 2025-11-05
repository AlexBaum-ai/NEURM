/**
 * PollResults Component
 * Displays poll results with bar charts and percentages using recharts
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2 } from 'lucide-react';
import type { TopicPoll } from '../types';

interface PollResultsProps {
  poll: TopicPoll;
  className?: string;
}

export const PollResults: React.FC<PollResultsProps> = ({ poll, className }) => {
  // Prepare data for recharts
  const chartData = poll.options.map((option) => ({
    name: option.text.length > 30 ? `${option.text.substring(0, 30)}...` : option.text,
    fullName: option.text,
    votes: option.voteCount,
    percentage: poll.totalVotes > 0 ? (option.voteCount / poll.totalVotes) * 100 : 0,
    userVoted: option.userVoted,
  }));

  // Find max votes for scaling
  const maxVotes = Math.max(...poll.options.map((o) => o.voteCount), 1);

  // Color palette for bars
  const colors = [
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#6366f1', // indigo-500
    '#ef4444', // red-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#a855f7', // purple-500
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-gray-900 dark:text-white">{data.fullName}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.votes} {data.votes === 1 ? 'vote' : 'votes'} ({data.percentage.toFixed(1)}%)
          </p>
          {data.userVoted && (
            <p className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              Your vote
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Bar Chart */}
      <div className="w-full overflow-x-auto">
        <ResponsiveContainer width="100%" height={Math.max(200, poll.options.length * 50)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              type="number"
              domain={[0, maxVotes]}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
            <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.userVoted ? '#10b981' : colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Results List */}
      <div className="space-y-2">
        {poll.options
          .sort((a, b) => b.voteCount - a.voteCount)
          .map((option, index) => {
            const percentage = poll.totalVotes > 0 ? (option.voteCount / poll.totalVotes) * 100 : 0;

            return (
              <div
                key={option.id}
                className="rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {option.userVoted && (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.text}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      option.userVoted
                        ? 'bg-green-500'
                        : 'bg-primary-500'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total votes: <span className="font-semibold text-gray-900 dark:text-white">{poll.totalVotes}</span>
        </p>
      </div>
    </div>
  );
};

export default PollResults;
