# Endorsement UI Implementation

## Overview
This document describes the implementation of the skill endorsement feature for candidate profiles (SPRINT-13-006).

## Features Implemented

### 1. Type Definitions
**File**: `src/features/jobs/types/candidates.ts`

Added endorsement fields to `CandidateSkill` interface:
- `id?: string` - Skill ID for API operations
- `endorsementCount?: number` - Number of endorsements received
- `hasEndorsed?: boolean` - Whether current user has endorsed

Added new interfaces:
- `Endorser` - User who endorsed a skill
- `EndorsementsListResponse` - API response for endorsers list

### 2. API Client
**File**: `src/features/jobs/api/endorsementsApi.ts`

Created API client with three endpoints:
- `endorseSkill(username, skillId)` - POST endorsement
- `unendorseSkill(username, skillId)` - DELETE endorsement
- `getEndorsements(username, skillId, options)` - GET endorsers list

### 3. React Query Hooks
**File**: `src/features/jobs/hooks/useEndorsements.ts`

Created three custom hooks:
- `useEndorsements(username, skillId, enabled)` - Fetch endorsers list
- `useEndorseSkill()` - Mutation to endorse a skill
- `useUnendorseSkill()` - Mutation to remove endorsement

All hooks include automatic cache invalidation on success.

### 4. EndorseButton Component
**File**: `src/features/jobs/components/candidates/EndorseButton.tsx`

**Features**:
- Shows "+ Endorse" when not endorsed, "Endorsed" when endorsed
- Optimistic UI updates (immediate visual feedback)
- Loading state with spinner
- Success notification (Snackbar)
- Reverts on error
- Small, medium, or large size options
- Callback for parent components (`onEndorsementChange`)

**Props**:
```typescript
interface EndorseButtonProps {
  username: string;
  skillId: string;
  skillName: string;
  hasEndorsed: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  onEndorsementChange?: (hasEndorsed: boolean) => void;
}
```

### 5. EndorsersList Component
**File**: `src/features/jobs/components/candidates/EndorsersList.tsx`

**Features**:
- Modal dialog displaying list of endorsers
- Shows avatar, name, headline, and endorsement date
- Loading state while fetching data
- Error handling with user-friendly message
- Empty state for no endorsements
- Total count display
- Formatted dates using `date-fns`

**Props**:
```typescript
interface EndorsersListProps {
  open: boolean;
  onClose: () => void;
  username: string;
  skillId: string;
  skillName: string;
}
```

### 6. ProfilePreview Integration
**File**: `src/features/jobs/components/candidates/ProfilePreview.tsx`

**Updates**:
- Added state for endorsers modal and selected skill
- Integrated `useAuthStore` to check if viewing own profile
- Replaced simple skills chips with enhanced skill cards
- Each skill card displays:
  - Skill name
  - Endorsement count (clickable to show endorsers)
  - EndorseButton (only shown if not own profile)
- Endorsement count is clickable and opens EndorsersList modal
- Fallback to simple chips display if detailed skills not available

**Key Logic**:
```typescript
const isOwnProfile = user?.username === profile?.username;
```
- EndorseButton is hidden for own profile
- Only shown when skill has an ID (required for API calls)

## User Experience

### Endorsing a Skill
1. User views another user's profile
2. Sees skills section with endorsement counts
3. Clicks "+ Endorse" button
4. Button immediately changes to "Endorsed" (optimistic update)
5. Success message appears: "Successfully endorsed [Skill Name]"
6. Endorsement count increments by 1

### Viewing Endorsers
1. User clicks on endorsement count text
2. Modal opens showing list of endorsers
3. Each endorser shows:
   - Avatar
   - Full name (or username)
   - Headline (if available)
   - Date endorsed
4. Total count displayed at top

### Removing Endorsement
1. User clicks "Endorsed" button
2. Button changes back to "+ Endorse" (optimistic update)
3. Success message: "Endorsement removed from [Skill Name]"
4. Endorsement count decrements by 1

## Responsive Design

All components are fully responsive:
- **EndorseButton**: Adapts button size based on screen
- **EndorsersList**: Modal is full-width on mobile (`xs`), 500px on desktop
- **Skills Section**: Stack layout works well on all screen sizes

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Proper button labels and modal titles
- **Focus Management**: Modal traps focus when open
- **Color Contrast**: Meets WCAG 2.1 AA standards

## Dependencies Added

- `date-fns` - For date formatting in endorsers list

## API Endpoints Used

- `POST /api/v1/profiles/:username/skills/:skillId/endorse` - Create endorsement
- `DELETE /api/v1/profiles/:username/skills/:skillId/endorse` - Remove endorsement
- `GET /api/v1/profiles/:username/skills/:skillId/endorsements` - Get endorsers

## Integration Points

### Auth Integration
Uses `useAuthStore` to:
- Check if user is authenticated
- Get current user's username
- Hide EndorseButton on own profile

### Cache Management
React Query automatically:
- Invalidates endorsements list on endorse/unendorse
- Invalidates candidate profile to refresh counts
- Provides loading and error states

## Testing Considerations

### Unit Tests (Recommended)
- EndorseButton optimistic updates
- EndorsersList data display
- API client functions

### Integration Tests (Recommended)
- Endorse workflow end-to-end
- Endorsers list modal opening/closing
- Own profile detection

### E2E Tests (Recommended)
- Complete endorse/unendorse flow
- View endorsers list
- Error handling scenarios

## Future Enhancements

Potential improvements:
1. Real-time updates using WebSocket when others endorse
2. Endorsement filtering (e.g., by date, by connection)
3. Notification when someone endorses your skill
4. Bulk endorsement (endorse multiple skills at once)
5. Endorsement analytics (who endorses most, trending skills)

## Known Limitations

1. Requires skill to have an `id` field (backend must provide this)
2. No pagination in endorsers list (limited to 50 endorsers)
3. No login prompt yet (just silently fails if not authenticated)
4. No WebSocket for real-time updates

## Acceptance Criteria Status

✅ Endorse button on each skill in profile
✅ Button shows: '+ Endorse' or 'Endorsed' (if already endorsed)
✅ Endorsement count displayed
✅ Click count shows list of endorsers (modal)
✅ Optimistic UI update on endorse/unendorse
✅ Success message on endorsement
✅ Cannot endorse own skills (button hidden)
✅ Responsive design

All acceptance criteria have been met!
