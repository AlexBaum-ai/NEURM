import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import type { ProfileViewer } from '../types/profileViews';

interface ViewsChartProps {
  views: ProfileViewer[];
}

interface ChartDataPoint {
  date: string;
  views: number;
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {payload[0].value} {payload[0].value === 1 ? 'view' : 'views'}
        </p>
      </div>
    );
  }
  return null;
};

export const ViewsChart: React.FC<ViewsChartProps> = ({ views }) => {
  // Process views data to create chart data points
  const chartData = useMemo(() => {
    const viewsByDate = new Map<string, number>();

    // Group views by date
    views.forEach((view) => {
      const date = new Date(view.viewedAt);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      viewsByDate.set(dateKey, (viewsByDate.get(dateKey) || 0) + 1);
    });

    // Create array of last 30 days with view counts
    const data: ChartDataPoint[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      // Format date for display
      const displayDate = new Intl.DateFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(date);

      data.push({
        date: displayDate,
        views: viewsByDate.get(dateKey) || 0,
      });
    }

    return data;
  }, [views]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Views Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ViewsChart;
