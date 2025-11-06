import type { DashboardWidget, WidgetType } from '../types';

export interface WidgetMetadata {
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  defaultSize: {
    w: number;
    h: number;
  };
  minSize: {
    w: number;
    h: number;
  };
}

export const WIDGET_METADATA: Record<WidgetType, WidgetMetadata> = {
  'top-stories': {
    type: 'top-stories',
    title: 'Top Stories Today',
    description: 'Latest trending articles and news',
    icon: 'newspaper',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  'trending-discussions': {
    type: 'trending-discussions',
    title: 'Trending Discussions',
    description: 'Hot topics in the forum',
    icon: 'message-circle',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  'job-matches': {
    type: 'job-matches',
    title: 'Job Matches',
    description: 'Personalized job recommendations',
    icon: 'briefcase',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  stats: {
    type: 'stats',
    title: 'Your Stats',
    description: 'Your activity and achievements',
    icon: 'bar-chart',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
  },
  'following-activity': {
    type: 'following-activity',
    title: 'Following Activity',
    description: 'Activity from people you follow',
    icon: 'users',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  'trending-tags': {
    type: 'trending-tags',
    title: 'Trending Tags',
    description: 'Popular topics right now',
    icon: 'tag',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
  events: {
    type: 'events',
    title: 'Events',
    description: 'Upcoming community events (coming soon)',
    icon: 'calendar',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
  recommendations: {
    type: 'recommendations',
    title: 'Recommended for You',
    description: 'Personalized content based on your interests',
    icon: 'sparkles',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
};

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'widget-stats',
    type: 'stats',
    title: 'Your Stats',
    enabled: true,
    position: { x: 0, y: 0, w: 6, h: 3 },
  },
  {
    id: 'widget-top-stories',
    type: 'top-stories',
    title: 'Top Stories Today',
    enabled: true,
    position: { x: 6, y: 0, w: 6, h: 4 },
  },
  {
    id: 'widget-trending-discussions',
    type: 'trending-discussions',
    title: 'Trending Discussions',
    enabled: true,
    position: { x: 0, y: 3, w: 6, h: 4 },
  },
  {
    id: 'widget-job-matches',
    type: 'job-matches',
    title: 'Job Matches',
    enabled: true,
    position: { x: 6, y: 4, w: 6, h: 4 },
  },
  {
    id: 'widget-following-activity',
    type: 'following-activity',
    title: 'Following Activity',
    enabled: true,
    position: { x: 0, y: 7, w: 6, h: 4 },
  },
  {
    id: 'widget-trending-tags',
    type: 'trending-tags',
    title: 'Trending Tags',
    enabled: true,
    position: { x: 6, y: 8, w: 4, h: 3 },
  },
  {
    id: 'widget-events',
    type: 'events',
    title: 'Events',
    enabled: false,
    position: { x: 10, y: 8, w: 4, h: 3 },
  },
  {
    id: 'widget-recommendations',
    type: 'recommendations',
    title: 'Recommended for You',
    enabled: true,
    position: { x: 0, y: 11, w: 6, h: 4 },
  },
];

/**
 * Convert layout from react-grid-layout to our widget position format
 */
export const layoutToWidgets = (
  layout: Array<{ i: string; x: number; y: number; w: number; h: number }>,
  currentWidgets: DashboardWidget[]
): DashboardWidget[] => {
  return currentWidgets.map((widget) => {
    const layoutItem = layout.find((item) => item.i === widget.id);
    if (layoutItem) {
      return {
        ...widget,
        position: {
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        },
      };
    }
    return widget;
  });
};

/**
 * Convert our widget format to react-grid-layout format
 */
export const widgetsToLayout = (widgets: DashboardWidget[]) => {
  return widgets
    .filter((w) => w.enabled)
    .map((widget) => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: WIDGET_METADATA[widget.type].minSize.w,
      minH: WIDGET_METADATA[widget.type].minSize.h,
    }));
};
