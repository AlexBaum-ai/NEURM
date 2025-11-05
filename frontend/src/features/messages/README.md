# Private Messaging Feature

## Overview

The private messaging feature provides one-on-one communication between users with real-time updates, read receipts, file attachments, and a responsive UI.

## Features

### Core Functionality
- **Conversations List**: View all conversations with last message preview and unread counts
- **Real-time Updates**: Automatic polling every 5 seconds for new messages
- **Infinite Scroll**: Load older messages as you scroll up
- **Rich Text Editing**: Format messages with bold, italic, lists, and links
- **File Attachments**: Attach images, PDFs, and documents (max 10MB, up to 5 files)
- **Read Receipts**: Single check (sent) and double check (read)
- **Typing Indicators**: See when the other person is typing
- **Auto-scroll**: Automatically scroll to newest message
- **Responsive Design**: Stacked layout on mobile, split view on desktop

### User Actions
- **Send Messages**: Text messages with rich formatting
- **Delete Conversation**: Remove entire conversation history
- **Block User**: Prevent user from sending messages
- **Mark as Read**: Automatically mark messages as read when viewing

## File Structure

```
features/messages/
├── api/
│   └── messagesApi.ts          # API client for messaging endpoints
├── components/
│   ├── ConversationList.tsx    # Sidebar with conversation list
│   ├── ChatView.tsx            # Main chat interface with messages
│   ├── MessageComposer.tsx     # Rich text message editor
│   └── index.ts
├── hooks/
│   ├── useConversations.ts     # Conversation management hooks
│   ├── useMessages.ts          # Message fetching and reading
│   ├── useSendMessage.ts       # Send message mutation
│   └── index.ts
├── pages/
│   ├── MessagesPage.tsx        # Main messages page
│   └── index.ts
├── types/
│   └── index.ts                # TypeScript types
├── index.ts
└── README.md                   # This file
```

## Usage

### Accessing Messages

Navigate to `/messages` to view all conversations, or `/messages/:conversationId` to view a specific conversation.

```tsx
import { Link } from 'react-router-dom';

// Link to messages page
<Link to="/messages">Messages</Link>

// Link to specific conversation
<Link to={`/messages/${conversationId}`}>View Conversation</Link>
```

### Starting a New Conversation

From a user's profile, click "Send Message" to start a new conversation. The system will:
1. Check if a conversation already exists
2. If yes, navigate to existing conversation
3. If no, create a new conversation

```tsx
import { messagesApi } from '@/features/messages';

// Get or create conversation
const conversation = await messagesApi.getOrCreateConversation(userId);
navigate(`/messages/${conversation.id}`);
```

### Using the Hooks

#### Fetch Conversations

```tsx
import { useConversations } from '@/features/messages';

const { data, isLoading } = useConversations({
  refetchInterval: 5000, // Poll every 5 seconds
});
```

#### Fetch Messages

```tsx
import { useMessages } from '@/features/messages';

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useMessages({
  conversationId: 'conv-123',
  refetchInterval: 5000,
});

// Access messages
const allMessages = data?.pages.flatMap(page => page.messages) ?? [];
```

#### Send a Message

```tsx
import { useSendMessage } from '@/features/messages';

const sendMessage = useSendMessage();

await sendMessage.mutateAsync({
  conversationId: 'conv-123',
  content: '<p>Hello!</p>',
  attachments: [file1, file2],
});
```

#### Delete Conversation

```tsx
import { useDeleteConversation } from '@/features/messages';

const deleteConversation = useDeleteConversation();

await deleteConversation.mutateAsync('conv-123');
```

#### Block User

```tsx
import { useBlockUser } from '@/features/messages';

const blockUser = useBlockUser();

await blockUser.mutateAsync('user-456');
```

## API Endpoints

### Conversations

- **GET** `/api/v1/conversations` - Get all conversations
  - Query params: `page`, `limit`
  - Returns: `ConversationsResponse`

- **GET** `/api/v1/conversations/:id/messages` - Get conversation messages
  - Query params: `page`, `limit`
  - Returns: `MessagesResponse`

- **DELETE** `/api/v1/conversations/:id` - Delete conversation
  - Returns: `{ success: boolean }`

### Messages

- **POST** `/api/v1/messages` - Send a new message
  - Body: `{ recipientId?, conversationId?, content, attachments? }`
  - Returns: `Message`

- **PUT** `/api/v1/messages/:id/read` - Mark message as read
  - Returns: `{ success: boolean }`

- **GET** `/api/v1/messages/unread-count` - Get unread message count
  - Returns: `{ unreadCount: number }`

### User Actions

- **POST** `/api/v1/users/:id/block` - Block user
  - Returns: `{ success: boolean }`

- **DELETE** `/api/v1/users/:id/block` - Unblock user
  - Returns: `{ success: boolean }`

## Components

### MessagesPage

Main container component that handles:
- Responsive layout (split view on desktop, stacked on mobile)
- Route parameters (conversation ID)
- Conversation selection
- Empty state when no conversation selected

### ConversationList

Displays all conversations with:
- Avatar (image or initials)
- Username and last message preview
- Timestamp (relative, e.g., "2 hours ago")
- Unread badge with count
- Active state highlighting

### ChatView

Main chat interface with:
- Header with participant info and actions menu
- Messages container with infinite scroll
- Message bubbles (styled differently for sent/received)
- Read receipts (single/double check marks)
- Auto-scroll to newest message
- Message composer at bottom

### MessageComposer

Rich text editor with:
- Formatting toolbar (bold, italic, lists, links)
- File attachment button
- Character count (if needed)
- Send button
- Keyboard shortcut (Ctrl+Enter to send)

## Styling

The messaging UI follows the project's design system:

- **Colors**: Primary blue for sent messages, gray for received
- **Dark Mode**: Full support with appropriate color schemes
- **Typography**: Consistent with app typography scale
- **Spacing**: 4px grid system
- **Borders**: Subtle borders for separation
- **Shadows**: Minimal, only for elevation when needed

## Responsive Behavior

### Desktop (≥768px)
- Split layout: conversation list (320px) + chat view (flex)
- Conversation list always visible
- Chat view shows selected conversation or empty state

### Mobile (<768px)
- Stacked layout: show one view at a time
- `/messages` shows conversation list
- `/messages/:id` shows chat view with back button
- Back button navigates to conversation list

## Performance Optimizations

1. **Lazy Loading**: Messages page and components are lazy loaded
2. **Infinite Scroll**: Load older messages on demand (50 per page)
3. **Polling Interval**: 5 seconds for messages, 10 seconds for unread count
4. **Query Caching**: TanStack Query caches conversations and messages
5. **Optimistic Updates**: Sent messages appear immediately in UI
6. **Debounced Typing**: Typing indicators debounced to reduce API calls

## Keyboard Shortcuts

- **Ctrl+Enter** (or **Cmd+Enter** on Mac): Send message
- **Arrow Keys**: Navigate through conversation list
- **Escape**: Close modals/menus

## Accessibility

- **Semantic HTML**: Proper use of headings, lists, and buttons
- **ARIA Labels**: Screen reader support for icons and actions
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling in modals
- **Color Contrast**: WCAG AA compliant contrast ratios
- **Alt Text**: All images have descriptive alt text

## Future Enhancements

Potential improvements for future sprints:

1. **WebSocket Integration**: Replace polling with real-time WebSocket updates
2. **Message Reactions**: Add emoji reactions to messages
3. **Message Search**: Search within conversation history
4. **Group Messaging**: Support for group conversations
5. **Voice Messages**: Record and send audio messages
6. **Video Calls**: Integrate video calling functionality
7. **Message Drafts**: Save unsent messages as drafts
8. **Message Editing**: Allow editing sent messages
9. **Message Forwarding**: Forward messages to other conversations
10. **Push Notifications**: Browser push notifications for new messages

## Testing

### Unit Tests

Test individual components and hooks:

```bash
npm test features/messages
```

### Integration Tests

Test API integration:

```bash
npm test features/messages/api
```

### E2E Tests

Test complete user flows:

```bash
npm run test:e2e -- messages
```

Key test scenarios:
1. Send and receive messages
2. View conversation list
3. Delete conversation
4. Block user
5. Mark messages as read
6. Load older messages (infinite scroll)
7. Attach files
8. Responsive layout switching

## Troubleshooting

### Messages not updating in real-time

- Check that refetchInterval is set (default: 5000ms)
- Verify API endpoints are responding correctly
- Check browser network tab for failed requests

### Infinite scroll not loading older messages

- Verify IntersectionObserver is supported in browser
- Check that hasNextPage is true
- Ensure loadMoreRef is properly attached

### Rich text editor not working

- Verify TipTap packages are installed
- Check console for TipTap errors
- Ensure editor extensions are properly configured

### File attachments failing

- Check file size (max 10MB per file)
- Verify accepted file types
- Check backend endpoint accepts multipart/form-data

## Support

For issues or questions about the messaging feature:
- Check this README
- Review the code comments
- Check the sprint documentation in `.claude/sprints/sprint-5.json`
- Contact the development team

---

**Status**: Completed in Sprint 5
**Last Updated**: November 2025
**Task ID**: SPRINT-5-008
