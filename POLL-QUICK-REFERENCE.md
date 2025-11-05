# Poll UI - Quick Reference Guide

## 🚀 Quick Start

### Import Components
```typescript
import { PollBuilder, PollVoting, PollResults } from '@/features/forum/components';
import { useVoteOnPoll, usePollByTopic } from '@/features/forum/hooks';
```

### Create a Poll (in TopicComposer)
```typescript
import { PollBuilder } from '@/features/forum/components';

const [poll, setPoll] = useState<Poll | null>(null);

<PollBuilder
  poll={poll}
  onChange={setPoll}
  error={errors.poll?.message}
/>
```

### Display & Vote on Poll (in TopicDetail)
```typescript
import { PollVoting } from '@/features/forum/components';

{topic.poll && (
  <PollVoting poll={topic.poll} />
)}
```

### Show Results Only
```typescript
import { PollResults } from '@/features/forum/components';

<PollResults poll={poll} />
```

---

## 📦 Component Props

### PollBuilder
```typescript
interface PollBuilderProps {
  poll: Poll | null;
  onChange: (poll: Poll | null) => void;
  error?: string;
}

interface Poll {
  question: string;
  options: Array<{ text: string; votes: number }>;
  multipleChoice: boolean;
  isAnonymous: boolean;
  expiresAt?: string;
}
```

### PollVoting
```typescript
interface PollVotingProps {
  poll: TopicPoll;
  className?: string;
}
```

### PollResults
```typescript
interface PollResultsProps {
  poll: TopicPoll;
  className?: string;
}
```

---

## 🎣 Hook Usage

### Vote on a Poll
```typescript
const voteOnPollMutation = useVoteOnPoll();

await voteOnPollMutation.mutateAsync({
  pollId: 'poll-uuid',
  optionIds: ['option-uuid-1', 'option-uuid-2'],
});
```

### Get Poll by Topic
```typescript
// With Suspense
const { data: poll } = usePollByTopic({ topicId: 'topic-uuid' });

// Without Suspense
const { data: poll, isLoading } = usePollByTopicQuery({ topicId: 'topic-uuid' });
```

### Create Poll
```typescript
const createPollMutation = useCreatePoll();

await createPollMutation.mutateAsync({
  topicId: 'topic-uuid',
  question: 'What is your favorite LLM?',
  allowMultiple: false,
  isAnonymous: true,
  endsAt: '2025-11-12T17:00:00Z', // Optional
  options: ['GPT-4', 'Claude', 'Gemini', 'Llama'],
});
```

---

## 🔌 API Endpoints

```
POST   /api/forum/polls                  - Create poll
GET    /api/forum/polls/:id              - Get poll by ID
GET    /api/forum/polls/topic/:topicId   - Get poll by topic
POST   /api/forum/polls/:id/vote         - Submit vote
DELETE /api/forum/polls/:id              - Delete poll (admin)
```

---

## 🎨 Styling Examples

### Custom Styling
```typescript
<PollVoting
  poll={poll}
  className="my-4 rounded-xl bg-blue-50 p-6"
/>
```

### Dark Mode Support
All components automatically support dark mode via Tailwind's `dark:` variants.

---

## ✅ Validation Rules

### PollBuilder
- Question: 5-255 characters (required)
- Options: 2-10 items (required)
- Option text: non-empty, max 200 chars each
- Expiration: must be future date (optional)

### Voting
- At least 1 option selected
- Cannot vote after deadline
- Single choice locks after voting

---

## 🐛 Common Issues & Solutions

### Issue: Poll not showing after creation
**Solution**: Check if `topic.poll` exists and has data
```typescript
console.log('Poll data:', topic.poll);
```

### Issue: Vote not submitting
**Solution**: Check network tab for API errors, verify optionIds format
```typescript
console.log('Submitting:', { pollId, optionIds });
```

### Issue: Recharts not rendering
**Solution**: Ensure container has explicit height
```typescript
<div style={{ height: 400 }}>
  <PollResults poll={poll} />
</div>
```

### Issue: TypeScript errors with poll types
**Solution**: Import types from forum types
```typescript
import type { TopicPoll, PollOption } from '@/features/forum/types';
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile: Default */
- Full width layout
- Stacked elements
- Touch-optimized tap targets

/* Tablet: sm (640px+) */
- Optimized chart size
- Better spacing

/* Desktop: lg (1024px+) */
- Multi-column layout options
- Enhanced typography
```

---

## ♿ Accessibility Checklist

- ✅ Keyboard navigation (Tab, Enter, Space)
- ✅ Focus indicators (ring-2)
- ✅ Screen reader labels
- ✅ High contrast colors
- ✅ Touch targets (min 44x44px)
- ✅ Error announcements

---

## 🧪 Testing Examples

### Unit Test
```typescript
import { render, screen } from '@testing-library/react';
import { PollVoting } from './PollVoting';

test('displays poll question', () => {
  const poll = {
    question: 'Test question?',
    // ... other required fields
  };

  render(<PollVoting poll={poll} />);
  expect(screen.getByText('Test question?')).toBeInTheDocument();
});
```

### E2E Test (Playwright)
```typescript
test('user can vote on poll', async ({ page }) => {
  await page.goto('/forum/topics/123');
  await page.click('text=Option 1');
  await page.click('button:has-text("Submit Vote")');
  await expect(page.locator('text=You voted')).toBeVisible();
});
```

---

## 🔧 Configuration

### Stale Time (TanStack Query)
```typescript
// In usePolls.ts
staleTime: 30000, // 30 seconds

// To change:
staleTime: 60000, // 1 minute
```

### Chart Colors
```typescript
// In PollResults.tsx
const colors = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  // ... add more
];
```

---

## 📊 Data Flow Summary

```
User Creates Poll
    ↓
PollBuilder Component
    ↓
TopicComposer → createTopic()
    ↓
Backend creates Topic + Poll
    ↓
User Views Topic
    ↓
TopicDetail → PollVoting
    ↓
User Votes
    ↓
useVoteOnPoll() → voteOnPoll()
    ↓
Backend records vote
    ↓
Cache updated → UI refreshes
    ↓
PollResults shown
```

---

## 🎯 Best Practices

1. **Always validate poll data before display**
   ```typescript
   {topic.poll && <PollVoting poll={topic.poll} />}
   ```

2. **Handle loading states**
   ```typescript
   {isLoading ? <Skeleton /> : <PollVoting poll={poll} />}
   ```

3. **Show error messages**
   ```typescript
   {error && <Alert severity="error">{error.message}</Alert>}
   ```

4. **Use Suspense boundaries**
   ```typescript
   <Suspense fallback={<PollSkeleton />}>
     <PollVoting poll={poll} />
   </Suspense>
   ```

5. **Optimize re-renders**
   ```typescript
   const handleVote = useCallback(async () => {
     await voteOnPoll({ pollId, optionIds });
   }, [pollId, optionIds]);
   ```

---

## 🔗 Related Components

- **TopicComposer** - Contains PollBuilder
- **TopicDetail** - Displays PollVoting
- **ReplyTree** - Could integrate poll discussion
- **VotingWidget** - Similar voting patterns
- **ReputationBadge** - Could track poll participation

---

## 📚 Further Reading

- [React Hook Form Docs](https://react-hook-form.com/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

---

## 💡 Tips & Tricks

### Tip 1: Pre-populate poll options
```typescript
const commonOptions = ['Yes', 'No', 'Maybe'];
const poll = {
  question: '',
  options: commonOptions.map(text => ({ text, votes: 0 })),
  multipleChoice: false,
  isAnonymous: false,
};
```

### Tip 2: Auto-save poll drafts
```typescript
useEffect(() => {
  if (poll) {
    localStorage.setItem('poll-draft', JSON.stringify(poll));
  }
}, [poll]);
```

### Tip 3: Calculate winning option
```typescript
const winningOption = poll.options.reduce((prev, current) =>
  current.voteCount > prev.voteCount ? current : prev
);
```

### Tip 4: Format deadline countdown
```typescript
const timeRemaining = useMemo(() => {
  if (!poll.endsAt) return null;
  return formatDistanceToNow(new Date(poll.endsAt), { addSuffix: true });
}, [poll.endsAt]);
```

---

## 🎉 You're Ready!

You now have everything you need to work with the poll UI components. Happy coding!

**Questions?** Check the implementation summary or architecture docs.
**Issues?** Review the troubleshooting section above.
**New features?** Extend the components while maintaining the existing patterns.
