# SPRINT-7-007 Quick Start Guide

## What Was Built

✅ **Candidate Profile System** for Jobs Module (Frontend Only)

This extends the existing user profile system with:
1. **LLM Experience** - Models, frameworks, vector databases, cloud platforms
2. **Community Stats** - Forum reputation, badges, contributions
3. **Job Preferences** - Availability, roles, location, salary, company preferences

---

## New Components

### Display Sections (Public Profile)
- `LLMExperienceSection.tsx` - Shows LLM technology experience
- `CommunityStatsSection.tsx` - Shows community contributions
- `JobPreferencesSection.tsx` - Shows job search preferences (privacy-aware)

### Edit Forms
- `LLMExperienceForm.tsx` - Edit LLM experience with star ratings
- `JobPreferencesForm.tsx` - Edit job preferences with multi-select

---

## How to Use

### 1. View Enhanced Profile

Navigate to: `http://localhost:5173/u/:username`

You'll see new sections (if data exists):
- LLM Experience (left column)
- Community Stats (right column)
- Job Preferences (right column, conditional)

### 2. Edit Profile

Click "Edit Profile" button to access forms for:
- LLM Experience
- Job Preferences

### 3. Privacy Controls

Job preferences visibility:
- Owner: Always visible
- Recruiters: Only if "looking for work" + "visible to recruiters"
- Public: Never visible

---

## File Locations

```
frontend/src/features/user/
├── types/index.ts                       # Extended types
├── api/profileApi.ts                    # New API functions
├── components/
│   ├── LLMExperienceSection.tsx         # NEW
│   ├── CommunityStatsSection.tsx        # NEW
│   ├── JobPreferencesSection.tsx        # NEW
│   ├── ProfileHeader.tsx                # Updated
│   ├── ProfileContent.tsx               # Updated
│   └── forms/
│       ├── LLMExperienceForm.tsx        # NEW
│       └── JobPreferencesForm.tsx       # NEW
```

---

## Backend Integration Status

⚠️ **BACKEND NOT READY YET**

This is frontend-only implementation. Backend API (SPRINT-7-006) is blocked pending Sprint 1 completion.

**Required Backend Endpoints:**
```
PUT /api/users/me/llm-experience
GET /api/users/me/llm-experience
PUT /api/users/me/job-preferences
GET /api/users/me/job-preferences
GET /api/users/:username/community-stats
```

**Workaround for Testing:**
Use mock data or API mocking library (MSW) until backend is ready.

---

## Testing

### Quick Visual Test
1. Start dev server: `npm run dev`
2. Navigate to profile page
3. Check for TypeScript errors: `npm run type-check` ✅ PASSES
4. Verify responsive layout on mobile/desktop

### Component Import Test
```typescript
import {
  LLMExperienceSection,
  CommunityStatsSection,
  JobPreferencesSection,
  LLMExperienceForm,
  JobPreferencesForm,
} from '@/features/user/components';

// All imports should work without errors
```

---

## Next Steps

1. **Backend Team (SPRINT-7-006)**
   - Implement candidate profile API endpoints
   - Create database tables/migrations
   - Add validation logic

2. **QA Team (SPRINT-7-008)**
   - Test with real data once backend ready
   - Verify privacy rules
   - Test responsive design
   - Validate forms

3. **Optional Enhancements**
   - Add drag-drop reordering (@hello-pangea/dnd installed)
   - Implement skills endorsements
   - Add autocomplete for locations

---

## Dependencies Added

```json
{
  "@hello-pangea/dnd": "^16.3.0"  // For future drag-drop feature
}
```

---

## Key Features

✨ **Type-Safe** - Full TypeScript + Zod validation
📱 **Responsive** - Mobile-first design
🌙 **Dark Mode** - Complete dark mode support
🔒 **Privacy-Aware** - Conditional rendering based on viewer role
♿ **Accessible** - ARIA labels, keyboard navigation
🎨 **Beautiful** - Modern UI with Tailwind CSS

---

## Documentation

See `SPRINT-7-007-IMPLEMENTATION-SUMMARY.md` for complete technical documentation.

---

**Status:** ✅ FRONTEND COMPLETE (Awaiting backend from SPRINT-7-006)
**Date:** 2025-11-05
