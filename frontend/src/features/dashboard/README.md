# Dashboard Feature

Personalized dashboard with drag-drop widgets for the Neurmatic platform.

## Overview

The dashboard provides users with a customizable, widget-based interface to access personalized content across News, Forum, and Jobs modules. Users can rearrange widgets, toggle visibility, and switch between different tab views.

## Features

### Core Features
- **Customizable Widget Grid**: Drag-and-drop widgets using react-grid-layout
- **Four Tab Views**: For You, News, Forum, Jobs
- **7 Widget Types**: Top Stories, Trending Discussions, Job Matches, Stats, Following Activity, Trending Tags, Events
- **Quick Actions**: Fast access to New Post, Search Jobs, Browse Forum
- **Responsive Design**: Grid on desktop, stacked on mobile
- **Empty State**: Onboarding guide for new users
- **Loading States**: Skeleton loaders for all widgets
- **Dark Mode**: Full dark mode support

### Widget Details

1. **Top Stories Today** - Latest articles with images, categories, and reading time
2. **Trending Discussions** - Hot forum topics with reply counts and votes
3. **Job Matches** - Personalized job recommendations with match scores
4. **Your Stats** - User statistics (reputation, articles read, saved jobs, applications)
5. **Following Activity** - Activity from followed users and topics
6. **Trending Tags** - Popular tags with trend indicators
7. **Events** - Placeholder for future events feature

## File Structure

```
dashboard/
├── api/
│   └── dashboardApi.ts          # API client methods
├── components/
│   ├── widgets/                 # Individual widget components
│   │   ├── TopStoriesWidget.tsx
│   │   ├── TrendingDiscussionsWidget.tsx
│   │   ├── JobMatchesWidget.tsx
│   │   ├── StatsWidget.tsx
│   │   ├── FollowingActivityWidget.tsx
│   │   ├── TrendingTagsWidget.tsx
│   │   ├── EventsWidget.tsx
│   │   └── index.ts
│   ├── WidgetGrid.tsx           # Grid layout with react-grid-layout
│   ├── QuickActions.tsx         # Quick action buttons
│   ├── CustomizeDashboardModal.tsx  # Widget settings modal
│   ├── EmptyState.tsx           # Onboarding for new users
│   └── LoadingSkeletons.tsx     # Loading states
├── hooks/
│   └── useDashboard.ts          # React Query hooks
├── pages/
│   └── Dashboard.tsx            # Main dashboard page
├── styles/
│   └── dashboard.css            # Grid layout styles
├── types/
│   └── index.ts                 # TypeScript types
├── utils/
│   └── widgetConfigs.ts         # Widget metadata and helpers
├── index.ts                     # Feature exports
└── README.md                    # This file
```

## API Integration

### Endpoints

- `GET /api/v1/dashboard` - Get all dashboard data (widgets content)
- `GET /api/v1/dashboard/config` - Get dashboard configuration
- `PUT /api/v1/dashboard/config` - Update widget configuration

### Data Types

```typescript
interface DashboardData {
  topStories: TopStory[];
  trendingDiscussions: TrendingDiscussion[];
  jobMatches: JobMatch[];
  stats: UserStats;
  followingActivity: FollowingActivity[];
  trendingTags: TrendingTag[];
}

interface DashboardConfig {
  widgets: DashboardWidget[];
  activeTab: 'for-you' | 'news' | 'forum' | 'jobs';
}
```

## Usage

### Basic Usage

```tsx
import { Dashboard } from '@/features/dashboard';

// In routes
<Route path="/" element={<Dashboard />} />
```

### Customization

Users can customize their dashboard by:
1. Clicking the "Customize" button
2. Toggling widgets on/off
3. Dragging widgets to reorder
4. Configuration is saved automatically

## Dependencies

- **react-grid-layout** - Drag-drop grid system
- **@radix-ui/react-tabs** - Accessible tabs component
- **lucide-react** - Icons
- **date-fns** - Date formatting
- **@tanstack/react-query** - Data fetching and caching

## Responsive Behavior

### Desktop (lg: 1200px+)
- 12-column grid
- Widgets displayed side-by-side
- Full drag-and-drop functionality

### Tablet (md: 996px+)
- 12-column grid (adjusted sizing)
- Widgets may stack based on configuration

### Mobile (xs: < 480px)
- Single column layout
- Widgets stacked vertically
- Drag disabled for better UX

## Performance Optimizations

1. **Lazy Loading**: Dashboard page is lazy-loaded
2. **Code Splitting**: Each widget can be code-split if needed
3. **Suspense Boundaries**: Proper loading states with Suspense
4. **Query Caching**: 5-10 minute stale times for dashboard data
5. **Optimistic Updates**: Widget configuration updates optimistically

## Accessibility

- **Keyboard Navigation**: Full keyboard support for tabs and links
- **ARIA Labels**: Proper labels for interactive elements
- **Focus Management**: Focus trap in customize modal
- **Screen Reader**: Semantic HTML for screen reader support
- **Color Contrast**: WCAG AA compliant colors

## Future Enhancements

- [ ] Widget analytics (track engagement)
- [ ] More widget types (bookmarks, notifications, etc.)
- [ ] Widget-level refresh buttons
- [ ] Export/import dashboard configurations
- [ ] Dashboard templates (preset layouts)
- [ ] Real-time updates via WebSocket
- [ ] Widget resize constraints per widget type
- [ ] Mobile-specific widgets

## Testing

### Unit Tests
```bash
npm test src/features/dashboard
```

### E2E Tests
- [ ] Drag and drop widget reordering
- [ ] Toggle widget visibility
- [ ] Switch between tabs
- [ ] Load dashboard as new user (empty state)
- [ ] Widget data rendering

## Troubleshooting

### Widgets not draggable
- Check if `isEditing` prop is true in WidgetGrid
- Ensure `.widget-drag-handle` class is on draggable element

### Layout not responsive
- Verify breakpoints in ResponsiveGridLayout config
- Check column counts for different screen sizes

### Dark mode styles not applied
- Import dashboard.css in WidgetGrid component
- Check CSS custom properties in globals.css

## Related Features

- `/features/news` - Top Stories widget
- `/features/forum` - Trending Discussions widget
- `/features/jobs` - Job Matches widget
- `/features/follows` - Following Activity widget

## Sprint

**Task**: SPRINT-10-006 - Personalized dashboard UI
**Status**: ✅ Completed
**Dependencies**: SPRINT-10-005 (✅ completed)
