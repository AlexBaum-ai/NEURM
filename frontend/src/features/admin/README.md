# Admin User Management Module

This module implements comprehensive user management functionality for administrators.

## Features Implemented

### 1. User Management Page (`/admin/users`)
- **Search**: Real-time filtering by name, email, or username (debounced)
- **Filters**:
  - Role: User, Moderator, Admin
  - Status: Active, Suspended, Banned, Pending Verification
  - Registration Date Range
- **User Table** (TanStack Table):
  - Sortable columns (email, joined date, last login)
  - User avatar/placeholder
  - Role and status badges
  - Pagination (50 users per page)
  - Row selection for bulk operations
- **Bulk Actions**:
  - Select multiple users
  - Export to CSV or JSON
- **Per-User Actions**:
  - Verify email
  - Send message
  - Suspend user
  - Ban user
  - Delete account

### 2. User Detail Page (`/admin/users/:userId`)
- **User Information**:
  - Full profile details
  - Role management (dropdown to update role)
  - Account statistics (articles, topics, replies, applications)
  - Email verification status
- **Activity Timeline**:
  - Chronological list of user activities
  - Activity type icons
  - Timestamps
- **Content Created**:
  - Links to articles
  - Links to forum topics
- **Reports Against User**:
  - Display of pending reports
  - Reporter information
- **Suspension/Ban Information**:
  - Display active suspension details
  - Display ban information
  - Quick actions to remove suspension/ban
- **Quick Actions**:
  - Verify email
  - Send message
  - Suspend user
  - Ban user

### 3. Modals

#### Suspend User Modal
- Reason field (required, min 10 characters)
- Duration selector:
  - 1 day
  - 3 days
  - 7 days
  - 14 days
  - 30 days
  - Indefinite
- Notify user checkbox
- Warning message
- Validation

#### Ban User Modal
- Reason field (required, min 10 characters)
- Username confirmation (must type username to confirm)
- Notify user checkbox
- Warning about permanent action
- Prevention of accidental bans
- Validation

#### Send Message Modal
- Subject field (required, min 3 characters)
- Message field (required, min 10 characters)
- Recipient display
- Validation

### 4. Components

#### UserTable
- TanStack Table integration
- Sortable columns
- Row selection
- Pagination controls
- Responsive design
- Avatar display with fallback
- Badge variants for roles/statuses

#### UserActionsDropdown
- Contextual actions menu
- Conditional actions based on user status
- Inline operations (verify email, unsuspend, unban, delete)
- Modal triggers (suspend, ban, send message)
- Loading states

### 5. TypeScript Types
Complete type definitions for:
- AdminUser
- UserDetailInfo
- UserActivity
- UserContent
- UserReport
- UserFilters
- SuspensionInfo
- BanInfo
- Various payloads (Suspend, Ban, UpdateRole, SendMessage, etc.)

### 6. API Functions
All admin user management endpoints:
- `getUsers` - List users with filters and pagination
- `getUserDetail` - Get detailed user information
- `getUserActivity` - Get user activity history
- `getUserContent` - Get user-created content
- `getUserReports` - Get reports against user
- `updateUserRole` - Change user role
- `verifyUserEmail` - Manually verify email
- `suspendUser` - Suspend user account
- `unsuspendUser` - Remove suspension
- `banUser` - Ban user account
- `unbanUser` - Remove ban
- `deleteUser` - Delete user account
- `sendMessageToUser` - Send admin message
- `exportUsers` - Export users to CSV/JSON

### 7. Custom Hooks
TanStack Query integration:
- `useUsers` - Fetch and cache users list
- `useUserDetail` - Fetch user details
- `useUserActivity` - Fetch user activity
- `useUserContent` - Fetch user content
- `useUserReports` - Fetch user reports
- `useUpdateUserRole` - Mutation for role updates
- `useVerifyUserEmail` - Mutation for email verification
- `useSuspendUser` - Mutation for suspending users
- `useUnsuspendUser` - Mutation for removing suspension
- `useBanUser` - Mutation for banning users
- `useUnbanUser` - Mutation for removing ban
- `useDeleteUser` - Mutation for deleting users
- `useSendMessageToUser` - Mutation for sending messages
- `useExportUsers` - Export functionality

All hooks include:
- Proper cache invalidation
- Optimistic updates where appropriate
- Error handling
- Loading states

## File Structure

```
frontend/src/features/admin/
├── api/
│   └── userManagement.ts      # API functions
├── components/
│   ├── BanUserModal.tsx       # Ban user modal
│   ├── SendMessageModal.tsx   # Send message modal
│   ├── SuspendUserModal.tsx   # Suspend user modal
│   ├── UserActionsDropdown.tsx # Actions dropdown
│   ├── UserTable.tsx          # Main table component
│   └── index.ts               # Component exports
├── hooks/
│   └── useAdminUsers.ts       # Custom hooks
├── pages/
│   ├── UserDetail.tsx         # User detail page
│   ├── UserManagement.tsx     # User list page
│   └── index.ts               # Page exports
├── types/
│   └── index.ts               # TypeScript types
└── README.md                  # This file
```

## Routes

- `/admin/users` - User management list
- `/admin/users/:userId` - User detail page

## Dependencies

- `@tanstack/react-table` - Advanced table functionality
- `@tanstack/react-query` - Data fetching and caching
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `date-fns` - Date formatting
- `lucide-react` - Icons

## Usage

### Accessing User Management
Navigate to `/admin/users` to access the user management interface.

### Searching and Filtering
1. Use the search bar for real-time filtering
2. Apply role and status filters
3. Set date ranges for registration date
4. Click "Apply Filters" to execute
5. Click "Clear Filters" to reset

### Managing Individual Users
1. Click on a user row to view details
2. Use the actions dropdown for quick operations
3. Navigate to `/admin/users/:userId` for full details

### Bulk Operations
1. Select multiple users using checkboxes
2. Click "Export CSV" or "Export JSON" to download

### Suspending Users
1. Click actions → "Suspend User"
2. Fill in reason and select duration
3. Choose whether to notify the user
4. Confirm suspension

### Banning Users
1. Click actions → "Ban User"
2. Fill in reason
3. Type username to confirm
4. Choose whether to notify the user
5. Confirm ban (permanent action)

## Security Considerations

- All actions require admin privileges (enforced by backend)
- Destructive actions require confirmation
- Ban action requires username typing to prevent accidents
- Sensitive operations are logged in activity timeline
- Rate limiting on backend endpoints

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Semantic HTML structure
- Focus management in modals
- Color contrast compliant badges
- Screen reader friendly

## Performance

- Debounced search (500ms)
- Pagination (50 users per page)
- TanStack Query caching
- Optimized re-renders
- Code splitting with React.lazy
- Suspense boundaries

## Testing

To test the user management functionality:

1. **Type Checking**:
   ```bash
   npm run type-check
   ```

2. **Unit Tests** (when implemented):
   ```bash
   npm test
   ```

3. **Manual Testing**:
   - Navigate to `/admin/users`
   - Test search functionality
   - Test filters (role, status, date)
   - Test sorting columns
   - Test pagination
   - Test row selection
   - Test export functionality
   - Test user actions (suspend, ban, message)
   - Navigate to user detail page
   - Test role updates
   - Test activity timeline display

## Future Enhancements

- [ ] Bulk suspend/ban operations
- [ ] Advanced search (by reputation, activity level)
- [ ] User impersonation (for support purposes)
- [ ] User merge functionality
- [ ] Automated suspension rules
- [ ] User activity analytics
- [ ] Export to Excel format
- [ ] Email template customization
- [ ] Audit log for all admin actions

## Notes

- All date/time displays respect user timezone
- Email notifications are sent based on checkbox state
- Suspension can be temporary or indefinite
- Bans are always permanent (but can be removed)
- Deleted users cannot be recovered
- Activity timeline shows last 50 activities
