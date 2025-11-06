import React, { Suspense, useState } from 'react';
import { useAnalytics } from '@/features/admin/hooks/useAnalytics';
import DateRangePicker from '@/features/admin/components/DateRangePicker';
import ExportButton from '@/features/admin/components/ExportButton';
import AnalyticsMetricsCards from '../components/AnalyticsMetricsCards';
import UserGrowthChart from '../components/charts/UserGrowthChart';
import ContentPerformance from '../components/charts/ContentPerformance';
import RevenueCharts from '../components/charts/RevenueCharts';
import TrafficSourcesChart from '../components/charts/TrafficSourcesChart';
import TopContributors from '../components/charts/TopContributors';
import CustomReportBuilder from '../components/CustomReportBuilder';
import { Card, CardContent } from '@/components/common/Card/Card';
import { BarChart3, RefreshCcw, TrendingUp, AlertCircle } from 'lucide-react';
import type { DateRange } from '@/features/admin/types';

const AnalyticsDashboardContent: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    preset: '30days',
  });

  const [compareMode, setCompareMode] = useState(false);

  // Fetch analytics data
  const { data: analyticsData } = useAnalytics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    period: 'daily',
  });

  const analytics = analyticsData?.data?.analytics;

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary-600" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive platform analytics and insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <ExportButton dateRange={dateRange} />
        </div>
      </div>

      {/* Date Range & Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <DateRangePicker value={dateRange} onChange={setDateRange} />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Compare periods
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      {analytics.engagement && analytics.revenue && (
        <AnalyticsMetricsCards
          engagement={analytics.engagement}
          revenue={analytics.revenue}
        />
      )}

      {/* User Growth Chart */}
      {analytics.userGrowth && analytics.userGrowth.length > 0 && (
        <UserGrowthChart data={analytics.userGrowth} />
      )}

      {/* Content Performance */}
      {analytics.contentPerformance && (
        <ContentPerformance content={analytics.contentPerformance} />
      )}

      {/* Revenue Charts */}
      {analytics.revenue && (
        <RevenueCharts revenue={analytics.revenue} />
      )}

      {/* Traffic Sources & Top Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics.trafficSources && analytics.trafficSources.length > 0 && (
          <TrafficSourcesChart sources={analytics.trafficSources} />
        )}
        {analytics.topContributors && analytics.topContributors.length > 0 && (
          <TopContributors contributors={analytics.topContributors} />
        )}
      </div>

      {/* Custom Report Builder */}
      <CustomReportBuilder />

      {/* Compare Mode Notice */}
      {compareMode && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="py-4">
            <div className="flex items-start gap-3 text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5 mt-0.5" />
              <div>
                <div className="font-semibold">Period Comparison Mode</div>
                <div className="text-sm mt-1">
                  Comparison mode is enabled. Select a previous period to compare metrics side-by-side.
                  This feature will be fully implemented in a future update.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Loading skeleton
const AnalyticsDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3" />
      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  );
};

// Main component with Suspense
const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<AnalyticsDashboardSkeleton />}>
          <AnalyticsDashboardContent />
        </Suspense>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
