# Poll Component Architecture

## Component Hierarchy

```
TopicComposer (Create/Edit Topic)
├── PollBuilder (Poll Creation Widget)
    ├── Input (Question)
    ├── Input[] (Options 2-10)
    ├── Checkbox (Multiple Choice)
    ├── Checkbox (Anonymous Voting) ⭐ NEW
    └── DateTimePicker (Expiration)

TopicDetail (View Topic)
├── TopicHeader
├── TopicContent
├── PollVoting (if poll exists) ⭐ NEW
│   ├── Poll Metadata (votes, deadline, type)
│   ├── PollResults (if voted or ended) ⭐ NEW
│   │   ├── BarChart (Recharts)
│   │   └── DetailedResultsList
│   └── VotingInterface (if can vote)
│       ├── Option[] (Radio/Checkbox)
│       └── SubmitButton
└── ReplyTree
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User Creates Topic                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  TopicComposer with PollBuilder (Optional)                  │
│  - Question: string                                          │
│  - Options: string[]                                         │
│  - allowMultiple: boolean                                    │
│  - isAnonymous: boolean ⭐                                   │
│  - endsAt: datetime (optional)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          POST /api/forum/topics                             │
│          (includes poll data)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend creates Topic + Poll + Options                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    User Views Topic                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  TopicDetail fetches topic with poll data                   │
│  GET /api/forum/topics/:id                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              PollVoting Component                           │
│  - Displays poll question & metadata                        │
│  - Checks: userHasVoted, hasEnded, canVote                 │
│  - Shows VotingInterface OR PollResults                     │
└─────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
        User hasn't voted         User has voted OR poll ended
                 │                         │
                 ▼                         ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   Voting Interface           │  │     PollResults              │
│   - Radio/Checkbox options   │  │     - Bar chart (Recharts)   │
│   - Submit Vote button       │  │     - Percentages            │
└──────────────────────────────┘  │     - Vote counts            │
                 │                 │     - Progress bars          │
                 │                 └──────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  useVoteOnPoll mutation                                     │
│  POST /api/forum/polls/:id/vote                             │
│  { optionIds: string[] }                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend records vote & returns updated poll                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  TanStack Query cache updated                               │
│  - Poll data refreshed                                      │
│  - UI automatically re-renders                              │
│  - Now shows PollResults                                    │
└─────────────────────────────────────────────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                  TanStack Query Cache                       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│   Poll Query Keys        │  │   Mutations                  │
├──────────────────────────┤  ├──────────────────────────────┤
│ ['polls']                │  │ useVoteOnPoll               │
│ ['polls', pollId]        │  │ useCreatePoll               │
│ ['polls', 'topic', id]   │  │ useDeletePoll               │
└──────────────────────────┘  └──────────────────────────────┘
                │                           │
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           Automatic Cache Invalidation                      │
│  - Vote mutation → invalidates poll queries                 │
│  - Create mutation → invalidates topic queries              │
│  - Delete mutation → removes poll from cache                │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### PollBuilder (Creation)
**Purpose**: Allow users to create polls when composing topics

**Responsibilities**:
- Manage poll question input
- Add/remove options (2-10 range)
- Toggle multiple choice setting
- Toggle anonymous voting ⭐
- Set optional expiration date
- Validate all inputs before submission

**State**:
- Local component state (poll object)
- Passed up to TopicComposer via onChange callback

### PollVoting (Display & Interaction)
**Purpose**: Display poll and handle voting interactions

**Responsibilities**:
- Display poll question and metadata
- Calculate time remaining for deadline
- Determine if user can vote (deadline, already voted)
- Handle option selection (radio vs. checkbox)
- Submit votes via API
- Toggle between voting interface and results

**State**:
- selectedOptions: string[] (local state)
- poll data from props
- voteOnPollMutation state (loading, error)

### PollResults (Visualization)
**Purpose**: Display poll results with charts and statistics

**Responsibilities**:
- Render horizontal bar chart (Recharts)
- Calculate percentages for each option
- Sort options by vote count
- Highlight user's vote
- Display detailed vote breakdown
- Show total vote count

**State**:
- Derived from poll prop (no local state)
- Computed chartData from poll.options

## Styling Patterns

### Tailwind Classes Used

**Layout**:
```
w-full              - Full width containers
space-y-{n}         - Vertical spacing
gap-{n}             - Flexbox/Grid gaps
p-{n}               - Padding
rounded-lg          - Rounded corners
border              - Borders
```

**Colors**:
```
bg-primary-{n}      - Primary brand colors
bg-gray-{n}         - Neutral backgrounds
text-{color}-{n}    - Text colors
border-{color}-{n}  - Border colors
```

**States**:
```
hover:              - Hover effects
focus:              - Focus states
disabled:           - Disabled styling
dark:               - Dark mode variants
```

**Responsive**:
```
sm:                 - Small screens (640px+)
md:                 - Medium screens (768px+)
lg:                 - Large screens (1024px+)
```

## Accessibility Features

### Keyboard Navigation
- All buttons/options are focusable
- Tab order follows visual flow
- Enter/Space to select options
- Escape to close modals

### Screen Readers
- Semantic HTML (button, input, label)
- ARIA labels for icons
- Role attributes where needed
- Live regions for dynamic content

### Visual Indicators
- High contrast colors
- Focus outlines (ring-2)
- Multiple visual cues (icon + text + color)
- Loading states clearly indicated

## Performance Considerations

### Query Optimization
- 30-second stale time (good balance)
- Optimistic updates for instant feedback
- Selective cache invalidation
- Prefetching on hover (future enhancement)

### Rendering Optimization
- useCallback for event handlers
- Memo for expensive calculations
- Suspense boundaries for async data
- Code splitting for Recharts

### Bundle Size
- Recharts: ~200KB (lazy loaded)
- Poll components: ~20KB total
- No additional heavy dependencies

## Error Handling

### API Errors
```typescript
try {
  await voteOnPollMutation.mutateAsync({...});
} catch (error) {
  // Error shown in UI
  console.error('Failed to vote:', error);
}
```

### Validation Errors
- Client-side validation prevents invalid submissions
- Server-side validation provides fallback
- Clear error messages shown to user

### Network Errors
- TanStack Query retry mechanism (3 attempts)
- Loading states during requests
- Error boundaries for catastrophic failures

## Testing Strategy

### Unit Tests (Vitest)
```
PollBuilder.test.tsx
- ✓ Renders poll builder
- ✓ Adds/removes options
- ✓ Validates min/max options
- ✓ Toggles multiple choice
- ✓ Toggles anonymous voting
- ✓ Sets expiration date

PollVoting.test.tsx
- ✓ Displays poll metadata
- ✓ Shows voting interface when can vote
- ✓ Shows results when voted
- ✓ Handles single choice voting
- ✓ Handles multiple choice voting
- ✓ Disables voting after deadline

PollResults.test.tsx
- ✓ Renders bar chart
- ✓ Calculates percentages correctly
- ✓ Highlights user's vote
- ✓ Sorts by vote count
```

### Integration Tests
```
poll-workflow.test.tsx
- ✓ Create topic with poll
- ✓ Vote on poll
- ✓ View results
- ✓ Poll expires after deadline
```

### E2E Tests (Playwright)
```
poll.spec.ts
- ✓ Complete poll creation flow
- ✓ Vote submission flow
- ✓ Results visualization
- ✓ Responsive design
- ✓ Accessibility
```

## Future Enhancements

### Real-time Updates
```typescript
// WebSocket integration
useEffect(() => {
  const ws = new WebSocket('ws://...');
  ws.onmessage = (event) => {
    const updatedPoll = JSON.parse(event.data);
    queryClient.setQueryData(['polls', pollId], updatedPoll);
  };
}, [pollId]);
```

### Vote Analytics
```typescript
interface VoteAnalytics {
  totalVotes: number;
  uniqueVoters: number;
  votingRate: number;
  topOption: string;
  voteTimeline: { timestamp: string; count: number }[];
}
```

### Poll Templates
```typescript
const pollTemplates = [
  {
    name: 'Yes/No Question',
    options: ['Yes', 'No'],
    allowMultiple: false,
  },
  {
    name: 'Rating Scale',
    options: ['1', '2', '3', '4', '5'],
    allowMultiple: false,
  },
  // ... more templates
];
```

---

## Summary

The poll UI implementation provides a complete, production-ready feature with:
- ✅ Intuitive component architecture
- ✅ Robust state management
- ✅ Excellent performance
- ✅ Full accessibility
- ✅ Beautiful visualizations
- ✅ Responsive design

All components follow React best practices and are fully typed with TypeScript.
