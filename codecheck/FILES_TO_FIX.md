# Files That Need Fixes - Detailed List

## 🔴 CRITICAL - Must Fix Before Deploy

### Authentication Module (CREATE NEW)
**Status**: Does not exist - MUST CREATE

**Files to Create**:
```
/home/user/NEURM/backend/src/modules/auth/
├── auth.routes.ts          (NEW - 200+ lines)
├── auth.controller.ts      (NEW - 300+ lines)
├── auth.service.ts         (NEW - 400+ lines)
├── auth.validation.ts      (NEW - 100+ lines)
├── strategies/
│   ├── jwt.strategy.ts     (NEW - 50+ lines)
│   ├── google.strategy.ts  (NEW - 80+ lines)
│   ├── linkedin.strategy.ts(NEW - 80+ lines)
│   └── github.strategy.ts  (NEW - 80+ lines)
└── auth.types.ts          (NEW - 50+ lines)
```

**File to Modify**:
- `/home/user/NEURM/backend/src/app.ts`
  - Line ~23: Add `import authRoutes from '@/modules/auth/auth.routes';`
  - Line ~135: Add `app.use('/api/v1/auth', verifyCsrfToken, authRoutes);`

---

### Frontend CSRF Token Implementation
**File**: `/home/user/NEURM/frontend/src/lib/api.ts`
**Lines**: 1-95 (entire file needs modification)

**Changes Required**:
1. Add CSRF token fetch on app initialization
2. Modify `setupInterceptors()` method (lines 24-73)
3. Add CSRF token to request headers for POST/PUT/PATCH/DELETE
4. Handle 403 errors and token refresh

**Modified Sections**:
```typescript
// Around line 24 - Add CSRF token storage
private csrfToken: string | null = null;

// Around line 28 - New method to fetch CSRF token
async fetchCsrfToken() {
  try {
    const response = await axios.get(`${API_URL}/csrf-token`, { withCredentials: true });
    this.csrfToken = response.data.csrfToken;
    localStorage.setItem('csrfToken', this.csrfToken);
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
}

// Modify lines 27-42 - Add CSRF token to requests
this.client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing methods
    const csrfToken = this.csrfToken || localStorage.getItem('csrfToken');
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);
```

---

### Article Routes - Missing Endpoints
**File**: `/home/user/NEURM/backend/src/modules/news/articles.routes.ts`
**Lines**: Add after line 185

**Changes Required**:
Add these routes:
```typescript
// Around line 186 - Add bookmark routes
router.post(
  '/:id/bookmark',
  authenticate,
  adminWriteLimiter,
  controller.bookmarkArticle
);

router.delete(
  '/:id/bookmark',
  authenticate,
  adminWriteLimiter,
  controller.unbookmarkArticle
);

// Add view tracking route
router.post(
  '/:id/view',
  publicReadLimiter,
  controller.incrementViewCount
);
```

**File**: `/home/user/NEURM/backend/src/modules/news/articles.controller.ts`
**Add Methods**: `bookmarkArticle`, `unbookmarkArticle`, `incrementViewCount`

---

## 🟠 HIGH PRIORITY - Fix This Sprint

### Job Routes - Missing Endpoints
**File**: `/home/user/NEURM/backend/src/modules/jobs/jobs.routes.ts`

**Changes Required**:

1. **Add slug-based match endpoint** (after line 192):
```typescript
router.get(
  '/slug/:slug/match',
  authMiddleware,
  rateLimiterMiddleware({ points: 100, duration: 60 }),
  asyncHandler(jobController.getJobMatchBySlug)
);
```

2. **Add alert test endpoint** (after line 124):
```typescript
router.post(
  '/alerts/:id/test',
  authMiddleware,
  rateLimiterMiddleware({ points: 5, duration: 3600 }),
  asyncHandler(jobController.testJobAlert)
);
```

**File**: `/home/user/NEURM/backend/src/modules/users/users.routes.ts`

3. **Add saved jobs endpoint** (after line 457):
```typescript
router.get(
  '/me/saved-jobs',
  authenticate,
  apiLimiter,
  asyncHandler(userController.getSavedJobs)
);
```

---

### Company Routes - Missing Analytics Export
**File**: `/home/user/NEURM/backend/src/modules/jobs/company.routes.ts`
**Location**: Create file if doesn't exist, or add to existing

**Routes to Add**:
```typescript
// Analytics export routes
router.get(
  '/:companyId/analytics',
  authMiddleware,
  asyncHandler(companyController.getAnalytics)
);

router.get(
  '/:companyId/analytics/export/csv',
  authMiddleware,
  asyncHandler(companyController.exportAnalyticsCSV)
);

router.get(
  '/:companyId/analytics/export/pdf',
  authMiddleware,
  asyncHandler(companyController.exportAnalyticsPDF)
);

router.get(
  '/:companyId/analytics/jobs/:jobId',
  authMiddleware,
  asyncHandler(companyController.getJobAnalytics)
);
```

---

### Forum Moderation Routes
**File**: `/home/user/NEURM/backend/src/modules/forum/routes/moderationRoutes.ts`

**Routes to Add** (if not exist):
```typescript
// User moderation
router.post(
  '/users/:id/warn',
  authenticate,
  requireModerator,
  asyncHandler(moderationController.warnUser)
);

router.post(
  '/users/:id/suspend',
  authenticate,
  requireModerator,
  asyncHandler(moderationController.suspendUser)
);

router.post(
  '/users/:id/ban',
  authenticate,
  requireAdmin,
  asyncHandler(moderationController.banUser)
);
```

---

### Leaderboard Routes
**File**: `/home/user/NEURM/backend/src/modules/forum/routes/leaderboardRoutes.ts`
**Status**: Verify exists and has correct endpoints

**Required Routes**:
```typescript
router.get('/weekly', asyncHandler(leaderboardController.getWeekly));
router.get('/monthly', asyncHandler(leaderboardController.getMonthly));
router.get('/all-time', asyncHandler(leaderboardController.getAllTime));
router.get('/me', authenticate, asyncHandler(leaderboardController.getCurrentUserRanks));
router.get('/hall-of-fame', asyncHandler(leaderboardController.getHallOfFame));
```

**File**: `/home/user/NEURM/backend/src/app.ts`
**Add** (around line 150):
```typescript
import leaderboardRoutes from '@/modules/forum/routes/leaderboardRoutes';
app.use('/api/v1/leaderboards', leaderboardRoutes);
```

---

### Forum Category Following
**File**: `/home/user/NEURM/backend/src/modules/forum/routes/categoryRoutes.ts`

**Routes to Add**:
```typescript
router.post(
  '/:id/follow',
  authenticate,
  asyncHandler(categoryController.followCategory)
);

router.delete(
  '/:id/follow',
  authenticate,
  asyncHandler(categoryController.unfollowCategory)
);
```

**OR Update Frontend**:
**File**: `/home/user/NEURM/frontend/src/features/forum/api/forumApi.ts`
**Lines**: 147-169 - Remove or comment out if not implementing

---

## 🟡 MEDIUM PRIORITY - Fix Next Sprint

### TypeScript Type Safety
**Files with Excessive `any` Usage** (700+ total):

**High Impact Files**:
1. `/home/user/NEURM/backend/src/modules/forum/services/*.service.ts`
2. `/home/user/NEURM/backend/src/modules/jobs/*.service.ts`
3. `/home/user/NEURM/backend/src/modules/admin/*.service.ts`
4. `/home/user/NEURM/backend/src/modules/messaging/*.service.ts`

**Frontend Files**:
1. `/home/user/NEURM/frontend/src/features/forum/api/forumApi.ts`
   - Lines: 654, 665, 779-813 (leaderboard return types)
   - Lines: 407-416 (votes response)
   - Lines: 447-449, 480-492, 500-507, 514-519 (reports)

**Action**: Create proper TypeScript interfaces for all return types

---

### Input Validation
**Files Needing Validation** (20+ files):

**Priority Files**:
1. `/home/user/NEURM/frontend/src/features/news/api/newsApi.ts`
   - Line 66: `getArticleBySlug` - validate slug format
   - Line 73: `bookmarkArticle` - validate articleId UUID

2. `/home/user/NEURM/frontend/src/features/jobs/api/jobsApi.ts`
   - Line 119: `getJobBySlug` - validate slug
   - Line 145: `saveJob` - validate slug
   - Line 159: `applyToJob` - validate data structure

3. `/home/user/NEURM/frontend/src/features/forum/api/forumApi.ts`
   - Line 231: `getTopicById` - validate UUID
   - Line 244: `createTopic` - validate input data
   - Line 319: `createReply` - validate input data

**Action**: Add Zod schemas for validation

---

### Error Handling
**File**: `/home/user/NEURM/frontend/src/lib/api.ts`
**Lines**: 44-73 (response interceptor)

**Changes Required**:
1. Transform errors to standard format
2. Add 429 (rate limit) handling
3. Add timeout error handling
4. Add network error handling

---

### Database Schema
**File**: `/home/user/NEURM/backend/src/prisma/schema.prisma`

**Issues to Fix**:
1. **Line ~1400-1500**: Remove duplicate `SavedSearch` models (keep only one)
2. **Add Indexes**:
```prisma
model Article {
  // Add after existing fields:
  @@index([status, publishedAt])
  @@index([categoryId, status])
  @@index([isFeatured, status])
  @@index([isTrending, status])
}

model Topic {
  // Add after existing fields:
  @@index([categoryId, status, isPinned])
  @@index([authorId, status])
  @@index([status, createdAt])
}

model Job {
  // Add after existing fields:
  @@index([status, publishedAt])
  @@index([companyId, status])
  @@index([location, status])
}

model JobApplication {
  // Add after existing fields:
  @@index([userId, status])
  @@index([jobId, status])
  @@index([status, appliedAt])
}
```

3. **Run After Changes**:
```bash
cd /home/user/NEURM/backend
npx prisma format
npx prisma generate
npx prisma migrate dev --name fix_schema_issues
```

---

### Performance Optimizations
**Files to Optimize**:

1. `/home/user/NEURM/backend/src/modules/news/articles.service.ts`
   - Lines: 148 - Add separate cache for related articles

2. `/home/user/NEURM/backend/src/modules/forum/services/*.service.ts`
   - Add Prisma includes to prevent N+1 queries

3. `/home/user/NEURM/backend/src/modules/jobs/jobs.repository.ts`
   - Add includes for job listings to load related data

---

## 🔵 LOW PRIORITY - Technical Debt

### Documentation
**Files Needing JSDoc**:
- All `*.service.ts` files in backend
- All `*.repository.ts` files in backend
- Public methods in controllers

### Code Consistency
**Files with Magic Numbers**:
1. `/home/user/NEURM/backend/src/modules/news/articles.service.ts`
   - Lines: 25-29 - Move cache TTLs to config

2. All rate limiter configurations
   - Move to centralized rate limit config

---

## Quick Commands

### Run Type Checking
```bash
# Backend
cd /home/user/NEURM/backend
npm run type-check

# Frontend
cd /home/user/NEURM/frontend
npm run type-check
```

### Run Linting
```bash
# Backend
cd /home/user/NEURM/backend
npm run lint

# Frontend
cd /home/user/NEURM/frontend
npm run lint
```

### Test After Fixes
```bash
# Backend tests
cd /home/user/NEURM/backend
npm test

# Frontend tests
cd /home/user/NEURM/frontend
npm test
```

### Database Migrations
```bash
cd /home/user/NEURM/backend
npx prisma migrate dev --name fix_critical_issues
npx prisma generate
```

---

## Estimated Effort Summary

| Priority | Files to Create | Files to Modify | Estimated Time |
|---|---|---|---|
| 🔴 Critical | 10+ files (auth module) | 5 files | 3-5 days |
| 🟠 High | 0 files | 10 files | 2-3 days |
| 🟡 Medium | 0 files | 30+ files | 1-2 weeks |
| 🔵 Low | 0 files | 50+ files | 1-2 weeks |

**Total Estimated Effort**: 3-4 weeks for all issues

---

**Last Updated**: November 6, 2025
