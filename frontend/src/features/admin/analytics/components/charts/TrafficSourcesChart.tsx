import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import { Globe, Search, Share2, Mail, ExternalLink } from 'lucide-react';
import type { TrafficSource } from '../../../types';

interface TrafficSourcesChartProps {
  sources: TrafficSource[];
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const sourceIcons: { [key: string]: React.ElementType } = {
  direct: Globe,
  google: Search,
  social: Share2,
  email: Mail,
  referral: ExternalLink,
};

const TrafficSourcesChart: React.FC<TrafficSourcesChartProps> = ({ sources }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const totalSessions = sources.reduce((sum, source) => sum + source.sessions, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Pie Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${(percentage * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="sessions"
                >
                  {sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatNumber(value)}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Source List */}
          <div className="flex-1 space-y-3">
            {sources.map((source, index) => {
              const Icon = sourceIcons[source.source.toLowerCase()] || Globe;
              const percentage = (source.sessions / totalSessions) * 100;

              return (
                <div
                  key={source.source}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-lg"
                      style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: COLORS[index % COLORS.length] }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white capitalize">
                        {source.source}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatNumber(source.sessions)} sessions • {source.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>

                  {/* Bounce rate */}
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Bounce</div>
                    <div
                      className={`text-sm font-semibold ${
                        source.bounceRate > 0.6
                          ? 'text-red-600 dark:text-red-400'
                          : source.bounceRate > 0.4
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {(source.bounceRate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(totalSessions)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {sources.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Traffic Sources</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {sources[0]?.source || 'N/A'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Top Source</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(
                sources.reduce((sum, s) => sum + s.bounceRate, 0) / sources.length
              ).toFixed(1)}
              %
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Bounce Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficSourcesChart;
