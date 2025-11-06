# Recommendations Feature

AI-powered personalized recommendations throughout the Neurmatic platform.

## Overview

The recommendations feature provides intelligent, personalized content suggestions to users based on their activity, interests, and behavior. It uses a hybrid recommendation algorithm combining collaborative filtering, content-based filtering, and trending/diversity boosts.

## Components

### RecommendationsWidget

Main widget component for dashboard integration.

**Features:**
- Shows 5-10 personalized recommendations
- Expandable to show all recommendations
- Feedback buttons (like, dislike, dismiss)
- Real-time updates after feedback
- Loading skeleton

**Usage:**
```tsx
import { RecommendationsWidget } from '@/features/recommendations';

<RecommendationsWidget
  types={['article', 'job']}  // Optional: filter by types
  limit={10}
  title="Recommended for You"
  showExplanation={true}
/>
```

### RecommendationsSidebar

Sidebar component for article and job detail pages.

**Features:**
- Compact vertical layout
- Type-specific recommendations
- Exclude current item
- Explanation badges
- Click tracking

**Usage:**
```tsx
import { RecommendationsSidebar } from '@/features/recommendations';

<RecommendationsSidebar
  type="article"
  excludeIds={[currentArticleId]}
  limit={5}
  title="Recommended Articles"
/>
```

### RecommendationsSection

Full-width grid section for displaying multiple recommendations.

**Features:**
- Grid layout (responsive)
- Type-specific recommendations
- Feedback buttons
- Click tracking

**Usage:**
```tsx
import { RecommendationsSection } from '@/features/recommendations';

<RecommendationsSection
  type="job"
  excludeIds={[currentJobId]}
  limit={6}
  title="Recommended Jobs for You"
/>
```

### RecommendationCard

Individual recommendation card component.

**Features:**
- Type-specific rendering (article, forum topic, job, user)
- Explanation badge
- Feedback buttons
- Click tracking
- Hover effects

## Recommendation Types

### Article Recommendations
- Based on reading history
- Category and tag preferences
- Similar users' interests
- Trending topics

### Forum Topic Recommendations
- Based on participation history
- Category preferences
- Similar users' activity
- Active discussions

### Job Recommendations
- Based on profile skills
- Experience level matching
- Location preferences
- Salary expectations
- Company preferences

### User Recommendations
- Common interests
- Similar activity patterns
- Mutual connections
- Reputation levels

## API Integration

### Endpoints

**GET /api/v1/recommendations**
- Query params: `types`, `limit`, `excludeIds`, `includeExplanations`
- Returns: Array of recommendations with relevance scores

**POST /api/v1/recommendations/feedback**
- Body: `{ itemType, itemId, feedback }`
- Feedback types: `like`, `dislike`, `dismiss`, `not_interested`

**POST /api/v1/recommendations/clicks** (internal)
- Body: `{ itemType, itemId, position, relevanceScore }`
- Fire-and-forget tracking

### Hooks

**useRecommendations(params)**
```tsx
const { data } = useRecommendations({
  types: ['article', 'job'],
  limit: 10,
  includeExplanations: true,
});
```

**useRecommendationsByType(type, limit, excludeIds)**
```tsx
const { data } = useRecommendationsByType('article', 5, [currentId]);
```

**useRecommendationFeedback()**
```tsx
const feedbackMutation = useRecommendationFeedback();
feedbackMutation.mutate({
  itemType: 'article',
  itemId: '123',
  feedback: 'like',
});
```

**useRecommendationClick()**
```tsx
const clickMutation = useRecommendationClick();
clickMutation.mutate({
  itemType: 'article',
  itemId: '123',
  position: 0,
  relevanceScore: 85,
});
```

## Integration Points

### Dashboard
- **Location**: For You tab
- **Component**: `DashboardRecommendationsWidget`
- **Features**: Mixed content types, expandable, feedback

### Article Detail Page
- **Location**: Sidebar
- **Component**: `RecommendationsSidebar`
- **Type**: Articles only
- **Features**: Exclude current article, compact view

### Job Detail Page
- **Location**: Below job details (for authenticated users)
- **Component**: `RecommendationsSection`
- **Type**: Jobs only
- **Features**: Grid layout, exclude current job

### Profile Pages
- **Location**: Left sidebar (when viewing others' profiles)
- **Component**: `RecommendationsSidebar`
- **Type**: Users only
- **Features**: Suggested users to follow

## Feedback System

Users can provide feedback on recommendations to improve future suggestions:

- **Like (👍)**: Show more content like this
- **Dislike (👎)**: Show less content like this
- **Dismiss (✕)**: Remove this specific recommendation
- **Not Interested**: Not interested in this type of content

Feedback is immediately processed and recommendations are refetched automatically.

## Click Tracking

All recommendation clicks are tracked for effectiveness measurement:
- Position in list
- Relevance score
- Item type and ID
- Timestamp

This data is used to improve the recommendation algorithm over time.

## Performance Considerations

### Caching
- Recommendations are cached for 10 minutes
- Invalidated after feedback
- Prefetched on page load

### Loading States
- Skeleton loaders for all components
- Suspense boundaries
- Graceful fallbacks

### Optimizations
- Lazy loading with React.lazy()
- Optimistic UI updates for feedback
- Fire-and-forget click tracking
- Debounced feedback submissions

## Accessibility

- Semantic HTML structure
- ARIA labels for feedback buttons
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Responsive Design

### Mobile
- Stacked layout
- Touch-friendly buttons
- Reduced content density

### Tablet
- 2-column grid
- Optimized spacing
- Swipe gestures

### Desktop
- 3-column grid
- Hover effects
- Larger images

## Error Handling

- Graceful fallback for API errors
- Empty state for no recommendations
- Retry logic for failed requests
- Silent failures for click tracking

## Future Enhancements

- [ ] Real-time recommendations
- [ ] A/B testing framework
- [ ] Recommendation explanations improvement
- [ ] Collaborative filtering enhancements
- [ ] Machine learning model integration
- [ ] Personalization settings
- [ ] Recommendation history
- [ ] "Why this recommendation?" tooltips

## Testing

### Unit Tests
- Component rendering
- Feedback submission
- Click tracking
- State management

### Integration Tests
- API interactions
- Cache invalidation
- Error handling
- Loading states

### E2E Tests
- Full user journeys
- Feedback workflows
- Multi-page navigation
- Cross-feature integration

## Related Documentation

- Backend API: `/backend/src/modules/recommendations/`
- Algorithm details: Backend README
- Analytics: Click tracking and effectiveness metrics
- Privacy: User data handling and GDPR compliance
