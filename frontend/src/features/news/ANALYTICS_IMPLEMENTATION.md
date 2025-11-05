# Article Analytics Tracking Implementation

## Overview

This document describes the implementation of SPRINT-3-012: Article analytics tracking UI. The system tracks user engagement with articles including view duration, scroll depth, reading progress, and completion status.

## Features

### ✅ Implemented Features

1. **View Tracking**
   - Automatically tracks when users view an article
   - Minimum 3-second view duration required to count as a view
   - Prevents spam by debouncing analytics calls

2. **Reading Time Calculation**
   - Backend-calculated reading time based on word count
   - Displayed in article header with clock icon
   - Average reading speed: 200 words per minute

3. **Active Time Tracking**
   - Only tracks time when the browser tab is visible
   - Uses Page Visibility API to detect tab switches
   - Pauses tracking when user switches tabs
   - Resumes tracking when user returns to the tab

4. **Scroll Depth Measurement**
   - Tracks maximum scroll depth (0-100%)
   - Uses IntersectionObserver for efficient tracking
   - Updates in real-time as user scrolls
   - Throttled to update max once per second

5. **Debounced Analytics Submission**
   - Sends analytics data maximum once per 30 seconds
   - Reduces server load and API calls
   - Ensures data is saved on page unmount

6. **Page Refresh Handling**
   - Saves analytics state to localStorage
   - Restores state on page reload
   - Continues tracking from where user left off
   - Clears old state (> 1 hour) automatically

7. **Privacy Compliance**
   - Respects navigator.doNotTrack setting
   - No tracking when DNT is enabled
   - Optional enable/disable flag in hook

8. **Reading Completion Detection**
   - Considers 90% scroll depth as "completed reading"
   - Sends completion status to backend
   - Clears localStorage state on completion

## Architecture

### File Structure

```
frontend/src/features/news/
├── types/
│   └── analytics.ts              # Analytics TypeScript types
├── utils/
│   └── analyticsUtils.ts         # Utility functions
├── api/
│   └── analyticsApi.ts           # API service for analytics
├── hooks/
│   ├── useArticleAnalytics.ts    # Main analytics hook
│   └── useArticleAnalytics.test.ts  # Hook tests
├── components/
│   └── ReadingTimeBadge.tsx      # Reading time badge component
└── pages/
    └── ArticleDetailPage.tsx     # Integration point
```

### Component Hierarchy

```
ArticleDetailPage
├── useArticleAnalytics (hook)
│   ├── Analytics Tracking
│   ├── IntersectionObserver
│   ├── Page Visibility API
│   └── localStorage Management
├── ArticleHeader
│   └── Reading Time Display
└── ArticleContent (tracked element)
```

## API Endpoints

The frontend integrates with the following backend endpoints:

### POST /api/v1/analytics/articles/:id/view

Track article view with engagement metrics.

**Request Body:**
```typescript
{
  viewDuration: number;      // seconds
  scrollDepth: number;       // 0-100
  readingProgress: number;   // 0-100
  completedReading: boolean;
  timestamp: string;         // ISO 8601
}
```

**Response:**
```typescript
{
  success: boolean;
}
```

### GET /api/v1/analytics/articles/:id

Get analytics data for a specific article.

**Response:**
```typescript
{
  success: boolean;
  data: {
    totalViews: number;
    averageViewDuration: number;
    averageScrollDepth: number;
    completionRate: number;
  }
}
```

### GET /api/v1/analytics/articles/popular

Get popular articles based on analytics.

**Response:**
```typescript
{
  success: boolean;
  data: Array<{
    id: string;
    slug: string;
    title: string;
    viewCount: number;
    averageViewDuration: number;
    completionRate: number;
  }>
}
```

### GET /api/v1/analytics/articles/trending

Get trending articles based on recent analytics.

**Response:** Same as popular endpoint

## Usage

### Basic Integration

```typescript
import { useArticleAnalytics } from '@/features/news/hooks';

const ArticleDetailPage: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  useArticleAnalytics({
    articleId: 'article-123',
    contentRef,
    enabled: true,
  });

  return (
    <div ref={contentRef}>
      {/* Article content */}
    </div>
  );
};
```

### With State Inspection (Debugging)

```typescript
const { getCurrentState } = useArticleAnalytics({
  articleId: 'article-123',
  contentRef,
  enabled: true,
});

// Get current tracking state
const state = getCurrentState();
console.log('View Duration:', state.viewDuration);
console.log('Scroll Depth:', state.scrollDepth);
console.log('Is Tracking:', state.isTracking);
```

### Conditional Tracking

```typescript
// Disable tracking for preview mode
const isPreviewMode = /* ... */;

useArticleAnalytics({
  articleId: 'article-123',
  contentRef,
  enabled: !isPreviewMode,
});
```

## Configuration

### Configurable Constants

Located in `useArticleAnalytics.ts`:

```typescript
const ANALYTICS_DEBOUNCE_MS = 30000;  // 30 seconds
const SCROLL_THROTTLE_MS = 1000;      // 1 second
const MIN_VIEW_DURATION = 3;          // 3 seconds
```

### localStorage Keys

Analytics state is stored with the prefix:
```
neurmatic_analytics_{articleId}
```

State is automatically cleared after 1 hour of inactivity.

## Privacy & Compliance

### Do Not Track Support

The hook respects the browser's Do Not Track setting:

```typescript
// Checks navigator.doNotTrack
if (navigator.doNotTrack === '1') {
  // No tracking occurs
}
```

### Data Collected

- Article ID (identifies which article was read)
- View duration (in seconds)
- Scroll depth (percentage 0-100)
- Reading completion status (boolean)
- Timestamp (when data was sent)

### Data NOT Collected

- User IP address (handled by backend)
- Personal identifying information
- Cross-site tracking data
- Third-party cookies

## Performance Optimizations

### 1. Throttling

Scroll events are throttled to max once per second:

```typescript
const handleScroll = throttle(() => {
  updateScrollDepth();
}, 1000);
```

### 2. Debouncing

Analytics are sent max once per 30 seconds:

```typescript
const timeSinceLastSent = now - lastSentTime;
if (timeSinceLastSent < 30000) {
  return; // Skip sending
}
```

### 3. IntersectionObserver

Efficient content visibility tracking:

```typescript
const observer = new IntersectionObserver(callback, {
  threshold: [0, 0.25, 0.5, 0.75, 1.0],
});
```

### 4. Passive Event Listeners

Scroll events use passive listeners:

```typescript
window.addEventListener('scroll', handleScroll, { passive: true });
```

## Testing

### Unit Tests

Run tests with:

```bash
npm test useArticleAnalytics.test.ts
```

Test coverage includes:
- Hook initialization
- Do Not Track compliance
- View tracking after minimum duration
- State management
- IntersectionObserver setup
- localStorage persistence
- Unmount cleanup

### Manual Testing

1. **Basic Tracking**
   - Open article
   - Wait 3 seconds
   - Check network tab for POST request
   - Verify request body contains correct data

2. **Scroll Depth**
   - Scroll down the article
   - Check that scrollDepth increases
   - Verify maximum depth is tracked

3. **Tab Switching**
   - Open article
   - Switch to another tab
   - Return after 10 seconds
   - Verify viewDuration doesn't include time away

4. **Page Refresh**
   - Start reading article
   - Scroll to 50%
   - Refresh page
   - Verify state is restored from localStorage

5. **Do Not Track**
   - Enable DNT in browser settings
   - Open article
   - Verify no analytics requests are sent

## Troubleshooting

### Analytics Not Sending

1. Check if Do Not Track is enabled:
   ```javascript
   console.log(navigator.doNotTrack);
   ```

2. Verify minimum view duration:
   - Analytics only send after 3 seconds

3. Check console for errors:
   ```javascript
   // Look for "Failed to send analytics" warnings
   ```

### State Not Persisting

1. Check localStorage quota:
   ```javascript
   console.log(localStorage.length);
   ```

2. Verify state is being saved:
   ```javascript
   const key = 'neurmatic_analytics_{articleId}';
   console.log(localStorage.getItem(key));
   ```

### IntersectionObserver Not Working

1. Check browser support:
   ```javascript
   if ('IntersectionObserver' in window) {
     console.log('Supported');
   }
   ```

2. Verify contentRef is attached:
   ```javascript
   console.log(contentRef.current);
   ```

## Future Enhancements

### Potential Improvements

1. **Reading Speed Detection**
   - Calculate actual reading speed
   - Compare to estimated reading time
   - Adjust recommendations

2. **Engagement Heatmap**
   - Track which sections get most attention
   - Identify where readers drop off
   - Optimize content structure

3. **A/B Testing Integration**
   - Test different article formats
   - Compare engagement metrics
   - Data-driven content optimization

4. **Advanced Metrics**
   - Return visits tracking
   - Share rate correlation
   - Conversion funnel analysis

5. **Real-time Dashboard**
   - Live analytics for authors
   - Popular articles widget
   - Trending topics detection

## Dependencies

- **React 18+**: Hooks API
- **Page Visibility API**: Tab switching detection
- **IntersectionObserver API**: Content visibility tracking
- **localStorage**: State persistence

## Browser Support

- Chrome 58+
- Firefox 55+
- Safari 12.1+
- Edge 79+

All major browsers with IntersectionObserver and Page Visibility API support.

## Related Documentation

- [SPRINT-3-011: Analytics Backend](../../backend/docs/SPRINT-3-011.md)
- [Privacy Policy](../../docs/PRIVACY.md)
- [API Documentation](../../projectdoc/03-API_ENDPOINTS.md)

## Change Log

### v1.0.0 (2025-11-05)
- Initial implementation
- View tracking
- Scroll depth measurement
- Reading time display
- Privacy compliance (DNT)
- localStorage persistence
- IntersectionObserver integration
- Page Visibility API support

---

**Implementation Date**: November 5, 2025
**Sprint**: SPRINT-3-012
**Status**: ✅ Complete
