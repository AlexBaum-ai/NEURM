import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import type { DateRange } from '../types';
import AdminSidebar from '../components/AdminSidebar';
import MetricsCards from '../components/MetricsCards';
import GrowthChart from '../components/GrowthChart';
import ActivityFeed from '../components/ActivityFeed';
import AlertsPanel from '../components/AlertsPanel';
import SystemHealthIndicator from '../components/SystemHealthIndicator';
import QuickActions from '../components/QuickActions';
import DateRangePicker from '../components/DateRangePicker';
import ExportButton from '../components/ExportButton';
import DashboardSkeleton from '../components/DashboardSkeleton';

const AdminDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    preset: '30days',
  });

  const { data: dashboard, isLoading, error, isRefetching } = useDashboard(dateRange);

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  if (error) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                Error Loading Dashboard
              </h2>
              <p className="text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />

      <div className="flex-1 overflow-x-hidden">
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Platform overview and management
                  {isRefetching && (
                    <span className="ml-2 text-sm text-primary-600 dark:text-primary-400">
                      (Updating...)
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
                <ExportButton dateRange={dateRange} />
              </div>
            </div>

            {isLoading ? (
              <DashboardSkeleton />
            ) : dashboard ? (
              <>
                {/* Metrics Cards */}
                <MetricsCards
                  metrics={dashboard.keyMetrics}
                  quickStats={dashboard.quickStats}
                  realTimeStats={dashboard.realTimeStats}
                />

                {/* Growth Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GrowthChart
                    title="User Growth"
                    data={dashboard.growthCharts.users}
                    color="#3b82f6"
                  />
                  <GrowthChart
                    title="Content Growth"
                    data={dashboard.growthCharts.content}
                    color="#10b981"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  <GrowthChart
                    title="Revenue Growth"
                    data={dashboard.growthCharts.revenue}
                    color="#8b5cf6"
                  />
                </div>

                {/* Quick Actions */}
                <QuickActions />

                {/* Activity & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ActivityFeed activities={dashboard.recentActivity} />
                  <AlertsPanel alerts={dashboard.alerts} />
                </div>

                {/* System Health */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <SystemHealthIndicator health={dashboard.systemHealth} />
                  </div>
                  <div className="lg:col-span-2">
                    {/* Placeholder for additional widgets */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Additional widgets coming soon
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
