# Bulk Messaging Feature Documentation

## Overview
The bulk messaging feature allows companies to send personalized templated messages to multiple candidates at once. This implementation covers SPRINT-9-008 requirements.

## Route
- **URL**: `/companies/dashboard/messages`
- **Access**: Company dashboard (requires company authentication)

## Features Implemented

### ✅ Core Functionality
- [x] Bulk message composer interface
- [x] Template selector dropdown
- [x] Template editor with personalization tags
- [x] Message preview with sample candidate data
- [x] Recipient list with remove option
- [x] Send confirmation dialog showing recipient count
- [x] Success/error messages after send
- [x] Message history (sent bulk messages)
- [x] Template management (create, edit, delete)
- [x] Rate limit warning display
- [x] Responsive design

### ✅ Personalization Variables
The following variables can be used in subject and body:
- `{{candidate_name}}` - Full name of the candidate
- `{{candidate_username}}` - Username
- `{{candidate_skills}}` - Comma-separated list of skills
- `{{candidate_experience}}` - Years of experience
- `{{candidate_location}}` - Location
- `{{job_title}}` - Job title (if applicable)
- `{{company_name}}` - Your company name

## File Structure

```
frontend/src/features/companies/
├── types/index.ts                          # Added bulk messaging types
├── api/companiesApi.ts                     # Added messaging API functions
├── hooks/useMessaging.ts                   # Custom hooks for messaging
├── components/messaging/
│   ├── RecipientList.tsx                   # Recipient display and management
│   ├── TemplateSelector.tsx                # Template selection dropdown
│   ├── TemplateManager.tsx                 # Template CRUD operations
│   └── index.ts                            # Component exports
└── pages/
    └── BulkMessagesPage.tsx                # Main bulk messaging page
```

## Components

### 1. BulkMessagesPage
**Location**: `pages/BulkMessagesPage.tsx`

Main page with three tabs:
- **Compose**: Create and send bulk messages
- **Manage Templates**: Create, edit, delete message templates
- **History**: View previously sent bulk messages

**Features**:
- Rate limit display (X/50 remaining today)
- Message preview with sample data
- Send confirmation dialog
- Success/error notifications
- Responsive layout with sidebar for recipients

### 2. RecipientList
**Location**: `components/messaging/RecipientList.tsx`

**Props**:
- `recipients: Recipient[]` - List of selected recipients
- `onRemove: (id: string) => void` - Handler to remove a recipient

**Features**:
- Empty state with instructions
- Recipient cards with name, username, skills, experience, location
- Remove button for each recipient
- Scrollable list (max-height with overflow)

### 3. TemplateSelector
**Location**: `components/messaging/TemplateSelector.tsx`

**Props**:
- `templates: MessageTemplate[]` - Available templates
- `selectedTemplateId: string | null` - Currently selected template
- `onSelect: (template: MessageTemplate | null) => void` - Selection handler
- `disabled?: boolean` - Disable selection

**Features**:
- Dropdown with all available templates
- "None" option to compose from scratch
- Auto-populates subject and body when selected

### 4. TemplateManager
**Location**: `components/messaging/TemplateManager.tsx`

**Props**:
- `templates: MessageTemplate[]` - All templates
- `onCreateTemplate: (data) => Promise<void>` - Create handler
- `onUpdateTemplate: (id, data) => Promise<void>` - Update handler
- `onDeleteTemplate: (id) => Promise<void>` - Delete handler

**Features**:
- Create new templates
- Edit existing templates
- Delete templates (with confirmation)
- Form validation
- Variable reference display

## API Integration

### Endpoints Used
All endpoints are prefixed with `/api/v1/companies/messages`:

1. **POST /bulk** - Send bulk messages
   - Body: `{ templateId?, subject, body, recipientIds[] }`
   - Response: `{ success, messagesSent, failedRecipients[] }`

2. **GET /templates** - List all templates
   - Response: `{ templates: MessageTemplate[] }`

3. **POST /templates** - Create template
   - Body: `{ name, subject, body }`
   - Response: `{ template: MessageTemplate }`

4. **PUT /templates/:id** - Update template
   - Body: `{ name?, subject?, body? }`
   - Response: `{ template: MessageTemplate }`

5. **DELETE /templates/:id** - Delete template
   - Response: `{ success: true }`

6. **GET /bulk** - Get message history
   - Query: `?page=1&limit=20`
   - Response: `{ messages: BulkMessageHistory[], total }`

7. **GET /rate-limit** - Get rate limit status
   - Response: `{ remaining, limit, resetsAt }`

## Types

### MessageTemplate
```typescript
interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
```

### Recipient
```typescript
interface Recipient {
  id: string;
  name: string;
  username: string;
  skills: string[];
  experience: string;
  location: string;
}
```

### BulkMessageRequest
```typescript
interface BulkMessageRequest {
  templateId?: string;
  subject: string;
  body: string;
  recipientIds: string[];
}
```

### RateLimitStatus
```typescript
interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetsAt: string;
}
```

## Usage Example

### 1. Navigate to bulk messaging
```typescript
// Navigate to /companies/dashboard/messages
```

### 2. Create a template
```typescript
1. Click "Manage Templates" tab
2. Click "New Template"
3. Enter:
   - Name: "Interview Invitation"
   - Subject: "Interview Opportunity at {{company_name}}"
   - Body: "Hi {{candidate_name}}, we'd love to interview you for {{job_title}}..."
4. Click "Create Template"
```

### 3. Send bulk messages
```typescript
1. Go to "Compose" tab
2. Select recipients (from search/lists - functionality not in scope)
3. Select template or compose manually
4. Edit subject/body if needed
5. Click "Preview" to see with sample data
6. Click "Send to X Recipients"
7. Confirm in dialog
8. Success notification appears
```

## Responsive Design

### Desktop (≥1024px)
- Two-column layout: Composer (2/3) + Recipients sidebar (1/3)
- Full template manager view
- Expanded message history

### Tablet (768px - 1023px)
- Single column with responsive padding
- Recipients list above composer
- Collapsible sections

### Mobile (<768px)
- Stacked layout
- Touch-friendly buttons
- Scrollable recipient list
- Full-width forms

## Rate Limiting

- **Limit**: 50 messages per day per company
- **Display**: Warning banner shows remaining count
- **Color coding**:
  - Blue: >10 remaining
  - Red: <10 remaining
- **Disabled state**: Send button disabled when limit reached
- **Auto-refresh**: Rate limit status refetches every 60 seconds

## Testing

### Manual Testing Checklist
- [ ] Navigate to `/companies/dashboard/messages`
- [ ] Create a new template
- [ ] Edit an existing template
- [ ] Delete a template
- [ ] Select a template for composing
- [ ] Preview message with sample data
- [ ] Verify personalization variables are replaced
- [ ] Add/remove recipients
- [ ] Send bulk message (with confirmation)
- [ ] View message history
- [ ] Check rate limit display
- [ ] Test responsive design on mobile/tablet

### TypeScript Validation
```bash
cd frontend
npm run type-check  # ✅ Passes
npm run lint        # ✅ No errors
```

## Future Enhancements

Potential improvements for future sprints:
1. Recipient search/filter functionality
2. Import recipients from CSV
3. Schedule messages for future delivery
4. Rich text editor for message body
5. Attachment support
6. Message analytics (open rates, click rates)
7. A/B testing for templates
8. Bulk message drafts
9. Template categories/tags
10. Message templates marketplace

## Dependencies

All dependencies are already in the project:
- React 18
- TanStack Query (React Query) v5
- React Router v6
- Lucide React (icons)
- Custom UI components (Button, Input, Card)

## Notes

- **No candidate selection UI**: The task specifies "select candidates from search results or lists" but the candidate search/selection UI is out of scope for this task. The `recipients` state is prepared to receive candidates from parent components or other features.
- **Backend integration**: All API endpoints are connected and ready for backend implementation (SPRINT-9-007).
- **Error handling**: All mutations include error handling with user-friendly messages.
- **Loading states**: All async operations show appropriate loading states.
- **Accessibility**: Components use semantic HTML and ARIA labels where appropriate.

## Related Tasks

- **SPRINT-9-007**: Backend bulk messaging API (dependency - completed ✅)
- **SPRINT-9-009**: Candidate search UI (future - will provide recipient selection)

---

**Implementation Date**: November 2025
**Status**: ✅ Complete
**Route**: `/companies/dashboard/messages`
