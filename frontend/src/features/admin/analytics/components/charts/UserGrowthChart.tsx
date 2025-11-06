import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import type { UserGrowthData } from '../../../types';

interface UserGrowthChartProps {
  data: UserGrowthData[];
  title?: string;
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

const UserGrowthChart: React.FC<UserGrowthChartProps> = ({
  data,
  title = 'User Growth',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  // Aggregate data based on view mode
  const aggregateData = (data: UserGrowthData[], mode: ViewMode): UserGrowthData[] => {
    if (mode === 'daily') return data;

    const groupedData: { [key: string]: UserGrowthData } = {};
    const daysToGroup = mode === 'weekly' ? 7 : 30;

    data.forEach((item, index) => {
      const groupIndex = Math.floor(index / daysToGroup);
      const key = `group-${groupIndex}`;

      if (!groupedData[key]) {
        groupedData[key] = {
          date: item.date,
          totalUsers: 0,
          newUsers: 0,
          activeUsers: 0,
        };
      }

      groupedData[key].totalUsers = item.totalUsers; // Use latest
      groupedData[key].newUsers += item.newUsers;
      groupedData[key].activeUsers += item.activeUsers;
    });

    return Object.values(groupedData);
  };

  const displayData = aggregateData(data, viewMode);

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;
  // const DataComponent = chartType === 'area' ? Area : Line;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Chart Type Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  chartType === 'line'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  chartType === 'area'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Area
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ChartComponent data={displayData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              className="text-xs text-gray-600 dark:text-gray-400"
            />
            <YAxis
              tickFormatter={formatValue}
              className="text-xs text-gray-600 dark:text-gray-400"
            />
            <Tooltip
              labelFormatter={formatDate}
              formatter={(value: number, name: string) => [
                formatValue(value),
                name === 'totalUsers' ? 'Total Users' : name === 'newUsers' ? 'New Users' : 'Active Users',
              ]}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            {chartType === 'area' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="totalUsers"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Total Users"
                />
                <Area
                  type="monotone"
                  dataKey="activeUsers"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Active Users"
                />
                <Area
                  type="monotone"
                  dataKey="newUsers"
                  stackId="3"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                  name="New Users"
                />
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="totalUsers"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Total Users"
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Active Users"
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="New Users"
                />
              </>
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default UserGrowthChart;
