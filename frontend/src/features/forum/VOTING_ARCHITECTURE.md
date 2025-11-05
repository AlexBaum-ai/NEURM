# Voting System Architecture

## Component Hierarchy

```
VotingWidget (Main Component)
├── VoteButton (Upvote)
│   └── ChevronUp Icon
├── Score Display (Animated)
│   └── Framer Motion AnimatePresence
└── VoteButton (Downvote)
    └── ChevronDown Icon
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       USER INTERACTION                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      VotingWidget Component                  │
│  • Renders UI                                                │
│  • Handles keyboard shortcuts (U/D)                          │
│  • Manages local animation state                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       useVote Hook                           │
│  • Vote logic (toggle, calculate)                            │
│  • Optimistic updates                                        │
│  • Error rollback                                            │
│  • Reputation checks                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌─────────────────────────┐  ┌──────────────────────────┐
│   TanStack Query        │  │   Zustand Store          │
│  • API mutations        │  │  • userVotes map         │
│  • Cache management     │  │  • setVote()             │
│  • Optimistic updates   │  │  • getUserVote()         │
│  • Query invalidation   │  │  • setUserVotes()        │
└─────────────────────────┘  └──────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│                       forumApi                               │
│  • voteOnTopic(topicId, voteType)                           │
│  • voteOnReply(replyId, voteType)                           │
│  • getUserVotes()                                            │
└─────────────────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                               │
│  POST /api/forum/topics/:id/vote                            │
│  POST /api/forum/replies/:id/vote                           │
│  GET /api/forum/votes/me                                    │
└─────────────────────────────────────────────────────────────┘
```

## State Management Flow

### Initial Load:
```
1. Component mounts
2. useUserVotes hook fetches all user votes
3. Votes stored in Zustand: { "topic:123": 1, "reply:456": -1 }
4. VotingWidget reads current vote from store
```

### Vote Action (Optimistic Update):
```
1. User clicks upvote button
2. useVote calculates new vote (toggle logic)
3. IMMEDIATELY updates:
   - Zustand store (setVote)
   - Query cache (setQueryData)
   - UI rerenders with new state
4. API request sent in background
5. On success:
   - Confirm state with server data
   - Invalidate queries for fresh data
6. On error:
   - Rollback Zustand store
   - Rollback Query cache
   - Show error message
```

## Keyboard Shortcuts Flow

```
User presses 'U' key
        │
        ▼
Window keydown event listener
        │
        ▼
VotingWidget.handleKeyPress()
        │
        ├─ Check: Is target an input? → Skip
        ├─ Check: Is shortcut enabled? → Skip
        └─ Valid? → Call upvote()
                         │
                         ▼
                    useVote.handleUpvote()
                         │
                         ▼
                    Vote mutation executes
```

## Animation Flow

```
Score changes from 42 to 43:
        │
        ▼
AnimatePresence detects key change
        │
        ▼
Exit animation (current score):
  - Slide up 10px
  - Fade out
  - Duration: 200ms
        │
        ▼
Enter animation (new score):
  - Start: 10px above, opacity 0
  - End: Original position, opacity 1
  - Duration: 200ms
```

## Error Handling Flow

```
Vote API call fails
        │
        ▼
useMutation.onError()
        │
        ├─ Rollback optimistic updates
        │   ├─ Restore previous vote in Zustand
        │   └─ Restore previous score in Query cache
        │
        ├─ Call onVoteError callback
        │   └─ Show error notification/toast
        │
        └─ Component rerenders with previous state
```

## Reputation Check Flow

```
User clicks downvote
        │
        ▼
useVote.handleDownvote()
        │
        ├─ Check: Is authenticated?
        │   └─ No → Show login modal (TODO)
        │
        ├─ Check: Has reputation >= 50?
        │   └─ No → Show error tooltip, prevent action
        │
        └─ Yes → Execute vote mutation
```

## Component Props Interface

```typescript
interface VotingWidgetProps {
  voteableType: 'topic' | 'reply';        // What are we voting on?
  voteableId: string;                     // ID of the item
  initialScore: number;                   // Current vote score
  initialUserVote?: number;               // User's current vote (-1, 0, 1)
  enableKeyboardShortcuts?: boolean;      // Enable U/D keys (default: true)
  className?: string;                     // Additional styling
  onVoteSuccess?: () => void;             // Success callback
  onVoteError?: (error: Error) => void;   // Error callback
}
```

## Utility Functions Pipeline

### Vote Count Formatting:
```
Input: 1234
        │
        ▼
formatVoteCount()
        │
        ├─ < 1000? → Return as-is: "42"
        ├─ < 1M? → Format as k: "1.2k"
        └─ >= 1M? → Format as M: "5.5M"
```

### Vote Calculation:
```
Current vote: 1 (upvoted)
User clicks: upvote button
        │
        ▼
calculateNewVote(1, 1)
        │
        └─ Same as current? → Return 0 (remove vote)

Current vote: 1 (upvoted)
User clicks: downvote button
        │
        ▼
calculateNewVote(1, -1)
        │
        └─ Different? → Return -1 (change to downvote)
```

### Score Calculation:
```
Current score: 10
Old vote: 1 (upvote)
New vote: -1 (downvote)
        │
        ▼
calculateNewScore(10, 1, -1)
        │
        ├─ Remove old effect: 10 - 1 = 9
        └─ Add new effect: 9 + (-1) = 8
        │
        └─ Return: 8
```

## Integration Points

### With TopicCard:
```tsx
<div className="flex gap-4">
  <VotingWidget
    voteableType="topic"
    voteableId={topic.id}
    initialScore={topic.voteScore}
    initialUserVote={topic.userVote}
  />
  <TopicContent {...topic} />
</div>
```

### With ReplyCard:
```tsx
<div className="flex gap-4">
  <VotingWidget
    voteableType="reply"
    voteableId={reply.id}
    initialScore={reply.voteScore}
    initialUserVote={reply.userVote}
    enableKeyboardShortcuts={false}
  />
  <ReplyContent {...reply} />
</div>
```

## Cache Strategy

```
Query Key: ['user-votes']
Stale Time: 5 minutes
GC Time: 10 minutes
        │
        ▼
On vote action:
  1. Optimistically update cache
  2. Mutate on server
  3. Invalidate query
  4. Refetch in background
        │
        ▼
Fresh data synced across all components
```

## Accessibility Features

### ARIA Structure:
```html
<div role="group" aria-label="Voting controls">
  <button aria-label="Upvote (U)" title="Upvote this post">
    <!-- Upvote icon -->
  </button>

  <div aria-live="polite" aria-atomic="true">
    <!-- Score -->
  </div>

  <button
    aria-label="Downvote (D)"
    title="Requires reputation 50+ to downvote"
    aria-disabled="true"
  >
    <!-- Downvote icon -->
  </button>

  <div class="sr-only" role="status">
    Press U to upvote, D to downvote.
    Downvoting requires reputation 50 or higher.
  </div>
</div>
```

## Performance Optimizations

1. **Memoization:** useCallback for vote handlers
2. **Code Splitting:** VotingWidget lazy-loaded
3. **Optimistic Updates:** No loading spinners needed
4. **Debouncing:** Not needed (single-click protection)
5. **Cache Strategy:** 5-minute stale time reduces API calls
6. **Bundle Size:** Framer Motion tree-shaken (only used features)

## File Structure

```
frontend/src/features/forum/
├── components/
│   ├── VoteButton.tsx              # Individual vote button
│   ├── VotingWidget.tsx            # Main voting interface
│   ├── VotingWidget.example.tsx    # Usage examples
│   └── index.ts                    # Exports
├── hooks/
│   ├── useVote.ts                  # Vote mutation logic
│   ├── useUserVotes.ts             # Fetch user votes
│   └── index.ts                    # Exports
├── utils/
│   └── voteUtils.ts                # Helper functions
├── api/
│   └── forumApi.ts                 # API client (+ voting)
├── store/
│   └── forumStore.ts               # Zustand store (+ voting)
└── types/
    └── index.ts                    # TypeScript types (+ voting)
```

## Testing Strategy

### Unit Tests:
- `voteUtils.test.ts`: Test all utility functions
- `useVote.test.ts`: Test hook logic and optimistic updates
- `VoteButton.test.tsx`: Test button states and interactions

### Integration Tests:
- `VotingWidget.test.tsx`: Test complete voting flow
- Test keyboard shortcuts
- Test error handling and rollback
- Test reputation checks

### E2E Tests:
- Vote on topic from topic page
- Vote on multiple replies
- Test persistence after reload
- Test concurrent votes (race conditions)

---

**Last Updated:** November 5, 2025
**Status:** ✅ Architecture Complete
