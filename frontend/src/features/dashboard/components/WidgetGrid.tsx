import React, { useState, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Settings } from 'lucide-react';
import type { DashboardWidget, DashboardData } from '../types';
import { widgetsToLayout, layoutToWidgets } from '../utils/widgetConfigs';
import {
  TopStoriesWidget,
  TrendingDiscussionsWidget,
  JobMatchesWidget,
  StatsWidget,
  FollowingActivityWidget,
  TrendingTagsWidget,
  EventsWidget,
  DashboardRecommendationsWidget,
} from './widgets';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../styles/dashboard.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetGridProps {
  widgets: DashboardWidget[];
  data: DashboardData;
  onLayoutChange: (widgets: DashboardWidget[]) => void;
  onOpenSettings: () => void;
  isEditing?: boolean;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  data,
  onLayoutChange,
  onOpenSettings,
  isEditing = false,
}) => {
  const handleLayoutChange = useCallback(
    (layout: Layout[]) => {
      const updatedWidgets = layoutToWidgets(layout, widgets);
      onLayoutChange(updatedWidgets);
    },
    [widgets, onLayoutChange]
  );

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'top-stories':
        return <TopStoriesWidget stories={data.topStories} />;
      case 'trending-discussions':
        return <TrendingDiscussionsWidget discussions={data.trendingDiscussions} />;
      case 'job-matches':
        return <JobMatchesWidget jobs={data.jobMatches} />;
      case 'stats':
        return <StatsWidget stats={data.stats} />;
      case 'following-activity':
        return <FollowingActivityWidget activities={data.followingActivity} />;
      case 'trending-tags':
        return <TrendingTagsWidget tags={data.trendingTags} />;
      case 'events':
        return <EventsWidget />;
      case 'recommendations':
        return <DashboardRecommendationsWidget />;
      default:
        return null;
    }
  };

  const layout = widgetsToLayout(widgets);

  return (
    <div className="relative">
      <button
        onClick={onOpenSettings}
        className="absolute top-0 right-0 z-10 flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        aria-label="Customize dashboard"
      >
        <Settings className="w-4 h-4" />
        Customize
      </button>

      <div className="mt-14">
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout, md: layout, sm: layout, xs: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 1 }}
          rowHeight={80}
          isDraggable={isEditing}
          isResizable={isEditing}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".widget-drag-handle"
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {widgets
            .filter((w) => w.enabled)
            .map((widget) => (
              <div
                key={widget.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="h-full flex flex-col">
                  <div
                    className={`flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${
                      isEditing ? 'widget-drag-handle cursor-move' : ''
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {widget.title}
                    </h3>
                    {isEditing && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Drag to reorder
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {renderWidget(widget)}
                  </div>
                </div>
              </div>
            ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};
