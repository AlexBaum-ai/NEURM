import React, { Suspense, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import * as Tabs from '@radix-ui/react-tabs';
import { useDashboardData, useDashboardConfig, useUpdateDashboardConfig } from '../hooks/useDashboard';
import { WidgetGrid } from '../components/WidgetGrid';
import { QuickActions } from '../components/QuickActions';
import { CustomizeDashboardModal } from '../components/CustomizeDashboardModal';
import { EmptyState } from '../components/EmptyState';
import { DashboardLoadingSkeleton } from '../components/LoadingSkeletons';
import type { DashboardWidget } from '../types';

const DashboardContent: React.FC = () => {
  const { data: dashboardData } = useDashboardData();
  const { data: config } = useDashboardConfig();
  const updateConfig = useUpdateDashboardConfig();

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'for-you' | 'news' | 'forum' | 'jobs'>(
    config.activeTab || 'for-you'
  );

  // Check if user is new (has minimal activity)
  const isNewUser =
    dashboardData.stats.articlesRead === 0 &&
    dashboardData.stats.savedJobs === 0 &&
    dashboardData.topStories.length === 0;

  const handleLayoutChange = useCallback(
    (updatedWidgets: DashboardWidget[]) => {
      updateConfig.mutate({
        widgets: updatedWidgets,
        activeTab,
      });
    },
    [updateConfig, activeTab]
  );

  const handleSaveCustomization = useCallback(
    (updatedWidgets: DashboardWidget[]) => {
      updateConfig.mutate({
        widgets: updatedWidgets,
        activeTab,
      });
    },
    [updateConfig, activeTab]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      const newTab = value as 'for-you' | 'news' | 'forum' | 'jobs';
      setActiveTab(newTab);
      updateConfig.mutate({
        widgets: config.widgets,
        activeTab: newTab,
      });
    },
    [updateConfig, config.widgets]
  );

  if (isNewUser) {
    return (
      <>
        <Helmet>
          <title>Welcome to Neurmatic</title>
        </Helmet>
        <EmptyState />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Neurmatic</title>
      </Helmet>

      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your personalized LLM community hub
          </p>

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
          <Tabs.List className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
            <Tabs.Trigger
              value="for-you"
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 transition-colors"
            >
              For You
            </Tabs.Trigger>
            <Tabs.Trigger
              value="news"
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 transition-colors"
            >
              News
            </Tabs.Trigger>
            <Tabs.Trigger
              value="forum"
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 transition-colors"
            >
              Forum
            </Tabs.Trigger>
            <Tabs.Trigger
              value="jobs"
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 transition-colors"
            >
              Jobs
            </Tabs.Trigger>
          </Tabs.List>

          {/* For You Tab */}
          <Tabs.Content value="for-you">
            <WidgetGrid
              widgets={config.widgets}
              data={dashboardData}
              onLayoutChange={handleLayoutChange}
              onOpenSettings={() => setIsCustomizeModalOpen(true)}
            />
          </Tabs.Content>

          {/* News Tab */}
          <Tabs.Content value="news">
            <WidgetGrid
              widgets={config.widgets.filter((w) =>
                ['top-stories', 'trending-tags'].includes(w.type)
              )}
              data={dashboardData}
              onLayoutChange={handleLayoutChange}
              onOpenSettings={() => setIsCustomizeModalOpen(true)}
            />
          </Tabs.Content>

          {/* Forum Tab */}
          <Tabs.Content value="forum">
            <WidgetGrid
              widgets={config.widgets.filter((w) =>
                ['trending-discussions', 'trending-tags', 'following-activity'].includes(
                  w.type
                )
              )}
              data={dashboardData}
              onLayoutChange={handleLayoutChange}
              onOpenSettings={() => setIsCustomizeModalOpen(true)}
            />
          </Tabs.Content>

          {/* Jobs Tab */}
          <Tabs.Content value="jobs">
            <WidgetGrid
              widgets={config.widgets.filter((w) =>
                ['job-matches', 'stats'].includes(w.type)
              )}
              data={dashboardData}
              onLayoutChange={handleLayoutChange}
              onOpenSettings={() => setIsCustomizeModalOpen(true)}
            />
          </Tabs.Content>
        </Tabs.Root>

        {/* Customize Modal */}
        <CustomizeDashboardModal
          isOpen={isCustomizeModalOpen}
          onClose={() => setIsCustomizeModalOpen(false)}
          widgets={config.widgets}
          onSave={handleSaveCustomization}
        />
      </div>
    </>
  );
};

const Dashboard: React.FC = () => {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
};

export default Dashboard;
