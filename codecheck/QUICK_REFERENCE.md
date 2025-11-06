# NEURM Bug Report - Quick Reference

## Critical Blockers (Fix Immediately)

| ID | Issue | Files Affected | Estimated Effort |
|---|---|---|---|
| CRITICAL-001 | **Missing Auth Routes** | `backend/src/app.ts`, Need to create `auth` module | 2-3 days |
| CRITICAL-002 | **Missing CSRF Tokens** | `frontend/src/lib/api.ts` | 4-6 hours |
| CRITICAL-003 | **Broken Token Refresh** | `frontend/src/lib/api.ts`, `authApi.ts` | Depends on CRITICAL-001 |
| CRITICAL-004 | **Bookmark API Mismatch** | `news/articles.routes.ts`, `newsApi.ts` | 2-4 hours |

## High Priority Endpoint Mismatches

| Frontend Calls | Backend Status | Fix Required |
|---|---|---|
| `POST /news/articles/:id/view` | ❌ Missing | Add route + controller |
| `GET /jobs/:slug/match` | ⚠️ Uses ID not slug | Add slug support |
| `POST /forum/categories/:id/follow` | ❌ Missing | Implement or remove |
| `POST /forum/users/:id/warn` | ❌ Missing | Add moderation routes |
| `GET /leaderboards/*` | ❌ Missing | Add leaderboard routes |
| `POST /jobs/alerts/:id/test` | ❌ Missing | Add test endpoint |
| `GET /companies/:id/analytics/export/*` | ❌ Missing | Add export routes |
| `GET /users/me/saved-jobs` | ❌ Missing | Add or redirect to `/jobs/saved` |

## Quick Wins (< 2 hours each)

1. **Add Article Bookmark Routes** (1 hour)
   ```typescript
   // In articles.routes.ts
   router.post('/:id/bookmark', authenticate, controller.bookmarkArticle);
   router.delete('/:id/bookmark', authenticate, controller.unbookmarkArticle);
   ```

2. **Add Article View Tracking** (1 hour)
   ```typescript
   // In articles.routes.ts
   router.post('/:id/view', publicReadLimiter, controller.incrementViewCount);
   ```

3. **Fix CSRF Token in Frontend** (2 hours)
   - Fetch token on app load
   - Add interceptor to include in requests
   - Handle token refresh on 403

4. **Add Input Validation** (1-2 hours per module)
   - Use Zod schemas in frontend API calls
   - Validate params before sending

5. **Fix Prisma Schema Duplicate** (30 mins)
   - Remove duplicate `SavedSearch` models
   - Run `npx prisma generate`

## Architecture Issues Summary

| Category | Count | Priority |
|---|---|---|
| Missing Routes | 15+ | 🔴 Critical/High |
| Endpoint Mismatches | 8 | 🟠 High |
| Type Safety (`any`) | 700+ | 🟡 Medium |
| Missing Validation | 20+ | 🟡 Medium |
| N+1 Query Risks | 5+ | 🟡 Medium |
| Missing Indexes | 10+ | 🟡 Medium |

## Files Requiring Most Changes

### Backend
1. `backend/src/app.ts` - Add auth routes
2. `backend/src/modules/auth/` - **CREATE ENTIRE MODULE**
3. `backend/src/modules/news/articles.routes.ts` - Add bookmark & view routes
4. `backend/src/modules/jobs/jobs.routes.ts` - Add missing endpoints
5. `backend/src/modules/forum/routes/` - Add moderation routes
6. `backend/src/prisma/schema.prisma` - Fix duplicates, add indexes

### Frontend
1. `frontend/src/lib/api.ts` - **ADD CSRF TOKEN HANDLING**
2. `frontend/src/features/auth/api/authApi.ts` - Wait for backend auth
3. `frontend/src/features/*/api/*.ts` - Add validation (multiple files)
4. `frontend/src/features/forum/api/forumApi.ts` - Remove unimplemented features

## Testing Checklist After Fixes

### Authentication Flow
- [ ] Register new user
- [ ] Login with credentials
- [ ] OAuth login (Google, LinkedIn, GitHub)
- [ ] Logout
- [ ] Token refresh on expiry
- [ ] Password reset flow
- [ ] Email verification

### News Module
- [ ] View article (check view count increments)
- [ ] Bookmark article
- [ ] Unbookmark article
- [ ] List articles with filters

### Forum Module
- [ ] Create topic
- [ ] Reply to topic
- [ ] Vote on topic/reply
- [ ] Follow category (if implemented)
- [ ] Moderation actions (pin, lock, warn, suspend, ban)

### Jobs Module
- [ ] View job details
- [ ] Save job
- [ ] Apply to job
- [ ] View match score
- [ ] Create job alert
- [ ] Test job alert
- [ ] View saved jobs

### CSRF Protection
- [ ] All POST requests include X-CSRF-Token
- [ ] All PUT requests include X-CSRF-Token
- [ ] All PATCH requests include X-CSRF-Token
- [ ] All DELETE requests include X-CSRF-Token
- [ ] Token refresh on 403 errors

## Metrics to Monitor After Fixes

1. **Error Rate**
   - Should drop from ~80% to <5%
   - Monitor 404 errors (should decrease significantly)
   - Monitor 403 errors (CSRF-related)

2. **Performance**
   - Article page load time: Target <200ms (p95)
   - Job search results: Target <300ms (p95)
   - Forum topic list: Target <250ms (p95)

3. **Database**
   - Query count per request (should decrease with includes)
   - Slow query log (should improve with indexes)
   - Connection pool usage

4. **Cache Hit Rate**
   - Article cache: Target >70%
   - Related articles cache: Target >80%
   - List cache: Target >60%

## Development Priority Order

### Week 1: Critical Blockers
1. Day 1-2: Create auth module (CRITICAL-001)
2. Day 3: Implement CSRF tokens (CRITICAL-002)
3. Day 4: Fix article bookmarks (CRITICAL-004)
4. Day 5: Test & fix authentication flow

### Week 2: High Priority Fixes
1. Day 1: Add missing news endpoints (views, bookmarks)
2. Day 2: Add missing job endpoints (match, alerts, saved jobs)
3. Day 3: Add forum moderation endpoints
4. Day 4: Add leaderboard routes
5. Day 5: Testing & bug fixes

### Week 3: Quality Improvements
1. Remove 'any' types (start with services)
2. Add input validation
3. Add database indexes
4. Fix N+1 queries
5. Improve error handling

### Week 4: Polish & Optimization
1. Add missing documentation
2. Performance optimization
3. Security audit
4. Code consistency improvements

## Contact Points

**Authentication Issues**: Backend team (create auth module)
**API Mismatches**: Full-stack coordination required
**Frontend CSRF**: Frontend team (add interceptor)
**Database**: DevOps + Backend (indexes, migrations)
**Performance**: Backend team (caching, N+1 fixes)

---

**Last Updated**: November 6, 2025
**Next Review**: After Critical Issues Resolved
