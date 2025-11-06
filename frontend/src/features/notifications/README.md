# Notifications Feature

This feature provides a comprehensive notification system for the Neurmatic platform.

## Components

### NotificationBell
Header notification bell icon with unread count badge.

**Props:**
- `className?: string` - Additional CSS classes
- `enableSound?: boolean` - Enable notification sound (default: false)

**Features:**
- Displays unread count badge
- Pulse animation for new notifications
- Opens dropdown on click
- Real-time updates via polling (30s interval)

### NotificationDropdown
Dropdown menu showing recent notifications (last 10).

**Props:**
- `isOpen: boolean` - Controls dropdown visibility
- `onClose: () => void` - Callback when dropdown should close
- `position?: 'left' | 'right'` - Dropdown position (default: 'right')

**Features:**
- Shows last 10 notifications
- Mark all as read button
- Navigate to full notifications page
- Auto-closes on outside click or ESC key

### NotificationItem
Individual notification item with icon, content, and actions.

**Props:**
- `notification: Notification` - Notification object
- `onNavigate?: () => void` - Callback after navigation
- `showDelete?: boolean` - Show delete button (default: true)
- `compact?: boolean` - Compact mode (default: false)

**Features:**
- Icon based on notification type/subtype
- Read/unread indicator
- Click to mark as read and navigate
- Delete button (shown on hover)
- Relative time display

### NotificationsList
Full notification list with infinite scroll and time grouping.

**Props:**
- `filters?: NotificationFilters` - Filter options
- `className?: string` - Additional CSS classes

**Features:**
- Infinite scroll pagination
- Time-based grouping (Today, This Week, Earlier)
- Empty state
- Loading states
- Fetch more trigger

### NotificationsPage
Full-page notifications view with filters.

**Features:**
- Filter tabs (All, Unread, News, Forum, Jobs, Social)
- Mark all as read button
- Link to notification settings
- Responsive design

## Hooks

### useNotifications
Fetch paginated notifications with infinite scroll.

```typescript
const {
  notifications,
  total,
  unreadCount,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
  error,
  refetch,
} = useNotifications(filters);
```

### useUnreadCount
Fetch unread notification count with real-time polling.

```typescript
const { unreadCount, isLoading, refetch } = useUnreadCount(enablePolling);
```

### useMarkNotificationAsRead
Mark a notification as read.

```typescript
const markAsReadMutation = useMarkNotificationAsRead();
markAsReadMutation.mutate(notificationId);
```

### useMarkAllAsRead
Mark all notifications as read.

```typescript
const markAllAsReadMutation = useMarkAllAsRead();
markAllAsReadMutation.mutate();
```

### useDeleteNotification
Delete a notification.

```typescript
const deleteMutation = useDeleteNotification();
deleteMutation.mutate(notificationId);
```

### useNotificationSound
Handle notification sound playback.

```typescript
const { playSound } = useNotificationSound(enabled);
```

### useOptimisticNotificationUpdate
Optimistic UI updates for notifications.

```typescript
const { markAsReadOptimistically, deleteOptimistically } = useOptimisticNotificationUpdate();
```

## API

### Endpoints
- `GET /api/v1/notifications` - Fetch notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### Types

**NotificationType:**
- `news` - News-related notifications
- `forum` - Forum-related notifications
- `jobs` - Job-related notifications
- `social` - Social notifications

**NotificationSubtype:**
News: `new_articles_in_followed_categories`, `trending_article`
Forum: `topic_reply`, `mention`, `upvote`, `accepted_answer`
Jobs: `new_job_match`, `application_status_update`, `profile_view`
Social: `new_follower`, `direct_message`, `badge_earned`, `reputation_milestone`

## Real-time Updates

Notifications are updated in real-time using polling:
- Unread count: Polled every 30 seconds
- Notifications list: Stale time of 1 minute
- New notifications trigger automatic refetch

## Navigation

Notifications automatically generate navigation links based on their data:

- **News**: `/news/:slug` or `/news?category=:category`
- **Forum**: `/forum/t/:slug/:id#reply-:replyId`
- **Jobs**: `/jobs/:slug`, `/applications`, `/profile/views`
- **Social**: `/messages/:conversationId`, `/profile/:username`, `/badges`

## Notification Sound

The notification sound feature:
- Plays when new notifications arrive (if enabled)
- Respects user preferences
- Uses browser Audio API
- Falls back gracefully if playback fails

To enable sound:
```typescript
<NotificationBell enableSound={true} />
```

**Note**: The sound file should be placed at `/public/sounds/notification.mp3`

## Styling

All components use Tailwind CSS with dark mode support:
- Primary color for unread notifications
- Gray tones for read notifications
- Hover effects and transitions
- Responsive design

## Performance

- **Lazy loading**: Components use React.lazy()
- **Code splitting**: Feature-based splitting
- **Optimistic updates**: Instant UI feedback
- **Pagination**: Infinite scroll with 20 items per page
- **Query caching**: TanStack Query for efficient data management

## Accessibility

- ARIA labels for icon buttons
- Keyboard navigation support (ESC to close dropdown)
- Screen reader friendly
- Sufficient color contrast
- Focus management

## Usage Example

```typescript
import { NotificationBell, NotificationsPage } from '@/features/notifications';

// In Header
<NotificationBell enableSound={false} />

// As a route
<Route path="/notifications" element={<NotificationsPage />} />
```

## Testing

Key areas to test:
- Notification display and formatting
- Mark as read functionality
- Delete notification
- Navigation on click
- Infinite scroll
- Real-time updates
- Sound playback
- Responsive design

## Dependencies

- `@tanstack/react-query` - Data fetching and caching
- `react-intersection-observer` - Infinite scroll
- `react-router-dom` - Navigation
- `@radix-ui/react-icons` - Icons
- `axios` - HTTP client

## Future Enhancements

- WebSocket support for instant updates (replace polling)
- Push notifications (Web Push API)
- Notification grouping/bundling
- Custom notification sounds
- Rich notification content
- Notification history archive
