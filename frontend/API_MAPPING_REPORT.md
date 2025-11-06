# Frontend API Calls Comprehensive Mapping

## Executive Summary
- **Total API files found**: 28
- **Base API URL**: `vps-1a707765.vps.ovh.net:3000/api/v1`
- **HTTP Client**: Axios with token-based authentication
- **Authentication**: Bearer token (JWT) via `Authorization` header
- **Timeout**: 30 seconds
- **Features Covered**: 20+ modules with 150+ endpoints

---

## API Configuration

### Main API Client (`/src/lib/api.ts`)
- **Type**: Axios instance
- **Base URL**: `vps-1a707765.vps.ovh.net:3000/api/v1`
- **Timeout**: 30000ms
- **Credentials**: withCredentials enabled
- **Authentication Method**: Bearer token (from localStorage)
- **Key Interceptors**:
  - **Request**: Adds Authorization header with access token
  - **Response**: Handles 401 errors, attempts token refresh, redirects to login on failure

### Methods Available
```
- apiClient.get<T>(url, config?)
- apiClient.post<T>(url, data?, config?)
- apiClient.put<T>(url, data?, config?)
- apiClient.patch<T>(url, data?, config?)
- apiClient.delete<T>(url, config?)
```

---

## API Endpoints by Feature Module

### 1. AUTHENTICATION MODULE (`/features/auth/api/authApi.ts`)

#### Endpoints:
| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/auth/login` | POST | Email/password login | `{email, password}` | `AuthResponse` |
| `/auth/register` | POST | User registration | `{username, email, password}` | `AuthResponse` |
| `/auth/logout` | POST | Logout user | - | void |
| `/auth/refresh` | POST | Refresh access token | - | `{accessToken}` |
| `/auth/me` | GET | Get current user | - | `User` |
| `/auth/{provider}` | GET | OAuth flow (Google, GitHub, LinkedIn) | - | OAuth popup |
| `/auth/forgot-password` | POST | Request password reset | `{email}` | void |
| `/auth/reset-password` | POST | Reset password | `{token, newPassword}` | void |
| `/auth/verify-email` | POST | Verify email with token | `{token}` | void |
| `/auth/resend-verification` | POST | Resend verification email | - | void |

---

### 2. NEWS MODULE

#### News API (`/features/news/api/newsApi.ts`)
| Endpoint | Method | Query Params | Response |
|----------|--------|--------------|----------|
| `/news/articles` | GET | `page, limit, sortBy, sortOrder, search, category, difficulty, model, tags[]` | `ArticlesResponse` |
| `/news/articles?featured=true&limit=5` | GET | - | `ArticlesResponse` |
| `/news/articles?trending=true&limit=5` | GET | - | `ArticlesResponse` |
| `/news/articles/{slug}` | GET | - | `ArticleDetailResponse` |
| `/news/articles/{id}/bookmark` | POST | - | `{success: boolean}` |
| `/news/articles/{id}/bookmark` | DELETE | - | `{success: boolean}` |
| `/news/articles/{id}/view` | POST | - | void |
| `/news/categories` | GET | - | `CategoriesResponse` |
| `/news/tags` | GET | `search, limit` | `TagsResponse` |

#### Analytics API (`/features/news/api/analyticsApi.ts`)
| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/analytics/articles/{id}/view` | POST | Track article view | `AnalyticsTrackingData` | `{success}` |
| `/analytics/articles/{id}` | GET | Get article analytics | - | `AnalyticsResponse` |
| `/analytics/articles/popular` | GET | Get popular articles (limit=10) | - | `PopularArticlesResponse` |
| `/analytics/articles/trending` | GET | Get trending articles (limit=10) | - | `PopularArticlesResponse` |

#### Revisions API (`/features/news/api/revisions.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/articles/{id}/revisions` | GET | Get all revisions for article |
| `/articles/{id}/revisions/{revisionId}` | GET | Get specific revision |
| `/articles/{id}/revisions/compare/{fromId}/{toId}` | GET | Compare two revisions |
| `/articles/{id}/revisions/{revisionId}/restore` | POST | Restore specific revision |

---

### 3. FORUM MODULE

#### Main Forum API (`/features/forum/api/forumApi.ts`) - ~800+ lines
**Categories (7 endpoints)**:
- `GET /forum/categories` - Get all categories with hierarchy
- `GET /forum/categories/{slug}` - Get single category by slug
- `GET /forum/categories/{id}/moderators` - Get category moderators
- `POST /forum/categories` - Create category (admin)
- `PUT /forum/categories/{id}` - Update category (admin)
- `DELETE /forum/categories/{id}` - Delete category (admin)
- `PUT /forum/categories/reorder` - Reorder categories (admin)
- `POST /forum/categories/{id}/moderators` - Assign moderator (admin)
- `DELETE /forum/categories/{id}/moderators/{userId}` - Remove moderator (admin)
- `POST /forum/categories/{id}/follow` - Follow category
- `DELETE /forum/categories/{id}/follow` - Unfollow category

**Topics (10+ endpoints)**:
- `GET /forum/topics` - Get topics with filters, pagination
- `GET /forum/topics/unanswered` - Get unanswered questions
- `GET /forum/topics/{id}` - Get single topic
- `POST /forum/topics` - Create topic
- `PUT /forum/topics/{id}` - Update topic
- `DELETE /forum/topics/{id}` - Delete topic
- `POST /forum/topics/{id}/pin` - Pin/unpin topic (moderator)
- `POST /forum/topics/{id}/lock` - Lock/unlock topic (moderator)
- `PUT /forum/topics/{id}/move` - Move to different category (moderator)
- `POST /forum/topics/{id}/merge` - Merge duplicate topics (moderator)
- `DELETE /forum/topics/{id}/hard` - Hard delete topic (admin)

**Replies (6+ endpoints)**:
- `GET /forum/topics/{topicId}/replies` - Get replies (nested tree)
- `POST /forum/topics/{topicId}/replies` - Create reply
- `PUT /forum/replies/{id}` - Update reply
- `DELETE /forum/replies/{id}` - Delete reply (soft)
- `POST /forum/topics/{topicId}/accept-answer` - Accept answer for questions
- `POST /forum/replies/{id}/hide` - Hide reply (moderator)
- `PUT /forum/replies/{id}/moderate` - Edit reply as moderator

**Voting (3 endpoints)**:
- `POST /forum/topics/{id}/vote` - Vote on topic (1, -1, 0)
- `POST /forum/replies/{id}/vote` - Vote on reply (1, -1, 0)
- `GET /forum/votes/me` - Get user's votes

**Reports (6 endpoints)**:
- `POST /forum/reports` - Create report
- `GET /forum/reports` - Get all reports (moderator)
- `GET /forum/reports/statistics` - Get report statistics (moderator)
- `GET /forum/reports/{id}` - Get single report (moderator)
- `PUT /forum/reports/{id}/resolve` - Resolve report (moderator)
- `POST /forum/reports/batch-resolve` - Batch resolve reports (moderator)

**Moderation (7 endpoints)**:
- `POST /forum/users/{id}/warn` - Warn user (moderator)
- `POST /forum/users/{id}/suspend` - Suspend user temporarily (moderator)
- `POST /forum/users/{id}/ban` - Ban user (admin)
- `GET /forum/moderation/logs` - Get moderation logs
- `GET /forum/moderation/stats` - Get moderation statistics
- `GET /users/{userId}/reputation` - Get user reputation with breakdown

**Search (5 endpoints)**:
- `GET /forum/search` - Search topics/replies with extensive filters
- `GET /forum/search/suggest` - Get autocomplete suggestions
- `GET /forum/search/popular` - Get popular searches
- `POST /forum/search/saved` - Save a search
- `GET /forum/search/saved` - Get saved searches
- `DELETE /forum/search/saved/{id}` - Delete saved search
- `GET /forum/search/history` - Get search history

**Leaderboards (5 endpoints)**:
- `GET /leaderboards/weekly` - Weekly leaderboard
- `GET /leaderboards/monthly` - Monthly leaderboard
- `GET /leaderboards/all-time` - All-time leaderboard
- `GET /leaderboards/me` - Current user's ranks
- `GET /leaderboards/hall-of-fame` - Hall of fame

**Polls (4 endpoints)**:
- `POST /forum/polls` - Create poll
- `GET /forum/polls/{id}` - Get poll by ID
- `GET /forum/polls/topic/{topicId}` - Get poll by topic ID
- `POST /forum/polls/{id}/vote` - Vote on poll
- `DELETE /forum/polls/{id}` - Delete poll (admin)

#### Badges API (`/features/forum/api/badgeApi.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/forum/badges` | GET | Get all badges with filters |
| `/forum/badges/{badgeId}` | GET | Get badge details |
| `/forum/badges/categories` | GET | Get badge categories |
| `/users/{userId}/badges` | GET | Get user's earned badges |
| `/users/{userId}/badges/progress` | GET | Get user's badge progress |
| `/users/me/badges` | GET | Get current user's badges |
| `/users/me/badges/progress` | GET | Get current user's badge progress |
| `/users/{userId}/badges/stats` | GET | Get user badge statistics |
| `/users/{userId}/badges/{badgeId}/share` | GET | Generate shareable badge image |

#### Prompts API (`/features/forum/api/promptsApi.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/forum/prompts` | GET | Get prompts with filters/pagination |
| `/forum/prompts` | POST | Create new prompt |
| `/forum/prompts/{id}` | GET | Get single prompt |
| `/forum/prompts/{id}` | PUT | Update prompt (author only) |
| `/forum/prompts/{id}` | DELETE | Delete prompt (author only) |
| `/forum/prompts/{id}/fork` | POST | Fork/create variation |
| `/forum/prompts/{id}/rate` | POST | Rate prompt (1-5 stars) |
| `/forum/prompts/{id}/vote` | POST | Vote prompt (up/down) |
| `/forum/prompts/{id}/comments` | GET | Get comments/replies |
| `/forum/prompts/{id}/comments` | POST | Add comment |
| `/users/{username}/prompts` | GET | Get user's prompts |
| `/forum/prompts/{id}/forks` | GET | Get prompt forks |

---

### 4. JOBS MODULE

#### Main Jobs API (`/features/jobs/api/jobsApi.ts`) - ~500 lines
**Job Listing (6 endpoints)**:
- `GET /jobs` - Get jobs with filters (location, salary, tech stack, visa, search, match)
- `GET /jobs/{slug}` - Get job details by slug
- `GET /jobs/{slug}/save` - Save/bookmark job
- `DELETE /jobs/{slug}/save` - Unsave job
- `POST /jobs/{slug}/apply` - Apply to job
- `GET /users/me/saved-jobs` - Get user's saved jobs
- `GET /jobs/{slug}/match` - Get match score

**Applications (5 endpoints)**:
- `GET /applications` - Get user's applications with filter (all, pending, accepted, rejected)
- `GET /applications/{id}` - Get single application details
- `PUT /applications/{id}/withdraw` - Withdraw application
- `GET /applications/export` - Export applications as CSV
- `POST /jobs/{slug}/apply` - Apply to job

**Job Alerts (4 endpoints)**:
- `GET /jobs/alerts` - Get all job alerts
- `POST /jobs/alerts` - Create job alert
- `PATCH /jobs/alerts/{id}` - Update job alert
- `DELETE /jobs/alerts/{id}` - Delete job alert
- `POST /jobs/alerts/{id}/test` - Test job alert (sample email)

**ATS (Applicant Tracking System) (5 endpoints)**:
- `GET /companies/applications` - Get company's applications with filters
- `GET /companies/applications/{id}` - Get application details for ATS
- `PUT /companies/applications/{id}/status` - Update application status
- `POST /companies/applications/{id}/notes` - Add note to application
- `PUT /companies/applications/{id}/rating` - Rate applicant (1-5)
- `POST /companies/applications/{id}/share` - Share application with team
- `GET /companies/applications/{id}/activity` - Get activity log

**Analytics (3 endpoints)**:
- `GET /companies/{companyId}/analytics` - Get company-wide analytics
- `GET /companies/{companyId}/analytics/jobs/{jobId}` - Get job-specific analytics
- `GET /companies/{companyId}/analytics/export/csv` - Export analytics as CSV
- `GET /companies/{companyId}/analytics/export/pdf` - Export analytics as PDF

#### Candidates API (`/features/jobs/api/candidatesApi.ts`)
**Search & Filters**:
- `GET /candidates/search` - Search candidates with extensive filters
  - Skills, models, frameworks, languages, location, experience, reputation
  - Sorting options

**Candidate Management**:
- `GET /candidates/{id}` - Get candidate profile (premium)
- `POST /candidates/track-view` - Track profile view
- `POST /candidates/save-search` - Save search
- `GET /candidates/saved-searches` - Get saved searches
- `DELETE /candidates/saved-searches/{id}` - Delete saved search
- `POST /candidates/save` - Save candidate to list
- `GET /candidates/saved` - Get saved candidates
- `DELETE /candidates/saved/{id}` - Remove candidate from saved

**Communication & Export**:
- `POST /candidates/export` - Export candidates (Blob)
- `POST /candidates/message` - Send message to candidate
- `GET /candidates/suggestions` - Get autocomplete suggestions

#### Endorsements API (`/features/jobs/api/endorsementsApi.ts`)
- `POST /profiles/{username}/skills/{skillId}/endorse` - Endorse skill
- `DELETE /profiles/{username}/skills/{skillId}/endorse` - Remove endorsement
- `GET /profiles/{username}/skills/{skillId}/endorsements` - Get endorsements list

---

### 5. PROFILE & USER MANAGEMENT

#### Profile API (`/features/profile/api/profileApi.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/me` | GET | Get current user profile |
| `/profiles/me/views` | GET | Get profile viewers (premium) |
| `/profiles/{username}/view-count` | GET | Get profile view count |
| `/profiles/{username}/view` | POST | Track profile view |

#### User Profile API (`/features/user/api/profileApi.ts`) - ~280 lines
**Basic Profile**:
- `GET /users/{username}` - Get user profile by username
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update user profile
- `POST /users/me/avatar` - Upload avatar (multipart)
- `DELETE /users/me/avatar` - Delete avatar
- `POST /users/me/cover` - Upload cover image (multipart)
- `DELETE /users/me/cover` - Delete cover image

**Skills Management**:
- `GET /users/me/skills` - Get user's skills
- `POST /users/me/skills` - Create skill
- `PATCH /users/me/skills/{id}` - Update skill proficiency
- `DELETE /users/me/skills/{id}` - Delete skill

**Work Experience**:
- `GET /users/me/work-experience` - Get work experiences
- `POST /users/me/work-experience` - Create work experience
- `PUT /users/me/work-experience/{id}` - Update work experience
- `DELETE /users/me/work-experience/{id}` - Delete work experience

**Education**:
- `GET /users/me/education` - Get education entries
- `POST /users/me/education` - Create education entry
- `PUT /users/me/education/{id}` - Update education
- `DELETE /users/me/education/{id}` - Delete education

**Portfolio**:
- `GET /users/me/portfolio` - Get portfolio projects
- `POST /users/me/portfolio` - Create portfolio project
- `PUT /users/me/portfolio/{id}` - Update portfolio project
- `DELETE /users/me/portfolio/{id}` - Delete portfolio project
- `POST /users/me/portfolio/upload` - Upload portfolio image (multipart)

**Privacy & Stats**:
- `GET /users/me/privacy` - Get privacy settings
- `PATCH /users/me/privacy` - Update privacy settings
- `GET /users/{username}/badges` - Get user's badges
- `GET /users/{username}/community-stats` - Get community stats (read-only)

**LLM Experience & Job Preferences**:
- `GET /users/me/llm-experience` - Get LLM experience
- `PUT /users/me/llm-experience` - Update LLM experience
- `GET /users/me/job-preferences` - Get job preferences
- `PUT /users/me/job-preferences` - Update job preferences

---

### 6. SETTINGS & ACCOUNT SECURITY

#### Settings API (`/features/settings/api/settingsApi.ts`)
**Account Settings**:
- `POST /auth/change-email` - Change email
- `POST /auth/verify-email-change` - Verify email change
- `POST /auth/change-password` - Change password

**Privacy Settings**:
- `GET /users/me/privacy` - Get privacy settings
- `PATCH /users/me/privacy` - Update privacy settings

**Two-Factor Authentication (2FA)**:
- `GET /auth/2fa/status` - Get 2FA status
- `POST /auth/2fa/enable` - Enable 2FA
- `POST /auth/2fa/verify` - Verify 2FA code
- `POST /auth/2fa/disable` - Disable 2FA
- `POST /auth/2fa/regenerate-codes` - Regenerate backup codes

**Session Management**:
- `GET /auth/sessions` - Get active sessions
- `DELETE /auth/sessions/{sessionId}` - Revoke session
- `DELETE /auth/sessions` - Revoke all sessions

**Data Export & Deletion**:
- `POST /users/me/export` - Request data export
- `GET /users/me/export` - Get data export status
- `POST /users/me/delete` - Delete account (password + captcha)

#### Notification Preferences API (`/features/settings/api/notificationPreferences.api.ts`)
- `GET /notifications/preferences` - Get notification preferences
- `PUT /notifications/preferences` - Update preferences
- `GET /notifications/dnd` - Get Do Not Disturb schedule
- `PUT /notifications/dnd` - Update DND schedule
- `POST /notifications/push/subscribe` - Subscribe to push notifications
- `DELETE /notifications/push/unsubscribe` - Unsubscribe from push
- `GET /notifications/push/subscriptions` - Get push subscriptions
- `POST /notifications/push/test` - Send test push notification

#### Admin Settings API (`/features/admin/api/settings.api.ts`)
- `GET /admin/settings` - Get all platform settings
- `PUT /admin/settings` - Bulk update settings
- `PUT /admin/settings/maintenance` - Update maintenance mode
- `POST /admin/settings/test-email` - Test email configuration
- `POST /admin/settings/test-oauth` - Test OAuth configuration

---

### 7. NOTIFICATIONS & MESSAGES

#### Notifications API (`/features/notifications/api/notificationsApi.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notifications` | GET | Get notifications with filters |
| `/notifications/unread-count` | GET | Get unread count |
| `/notifications/{id}/read` | PUT | Mark notification as read |
| `/notifications/read-all` | PUT | Mark all as read |
| `/notifications/{id}` | DELETE | Delete notification |
| `/notifications/{id}` | GET | Get notification by ID |

**Filters**: type, unreadOnly, limit, offset

#### Messages API (`/features/messages/api/messagesApi.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/conversations` | GET | Get all conversations (paginated) |
| `/conversations/{conversationId}/messages` | GET | Get messages in conversation |
| `/messages` | POST | Send message (with optional attachments) |
| `/messages/{id}/read` | PUT | Mark message as read |
| `/conversations/{id}` | DELETE | Delete conversation |
| `/users/{userId}/block` | POST | Block user |
| `/users/{userId}/block` | DELETE | Unblock user |
| `/messages/unread-count` | GET | Get unread count |

**Special**: `sendMessage` handles multipart form data for file attachments

---

### 8. BOOKMARKS & COLLECTIONS

#### Bookmarks API (`/features/bookmarks/api/bookmarksApi.ts`)
| Endpoint | Method | Description | Query Params |
|----------|--------|-------------|---------------|
| `/users/me/bookmarks` | GET | Get user bookmarks | page, limit, collectionId |
| `/users/me/bookmark-collections` | GET | Get collections | - |
| `/users/me/bookmark-collections` | POST | Create collection | - |
| `/users/me/bookmark-collections/{id}` | PATCH | Update collection | - |
| `/users/me/bookmark-collections/{id}` | DELETE | Delete collection | - |
| `/users/me/bookmarks/{id}` | PATCH | Update bookmark | - |
| `/news/articles/{slug}/bookmark` | DELETE | Remove bookmark | - |

---

### 9. SEARCH

#### Search API (`/features/search/api/searchApi.ts`)
**Universal Search**:
- `GET /search` - Search across content (articles, jobs, topics)
  - Params: `q, type[], sort, page, limit, filters`
  - Filters: dateFrom, dateTo, category, tags[], location, employmentType, isRemote

**Autocomplete & History**:
- `GET /search/suggest` - Get search suggestions
- `GET /search/history` - Get search history (limit=10)
- `POST /search/saved` - Save search
- `GET /search/saved` - Get saved searches
- `DELETE /search/saved/{id}` - Delete saved search
- `DELETE /search/history` - Clear search history

---

### 10. GUIDE (USE CASES & LLM RESOURCES)

#### Guide API (`/features/guide/api/guideApi.ts`)
| Endpoint | Method | Description | Filters |
|----------|--------|-------------|---------|
| `/use-cases` | GET | Get use cases with filters | search, category, industry, model, implementationType, hasCode, hasROI |
| `/use-cases/featured` | GET | Get featured use cases | - |
| `/use-cases/{slug}` | GET | Get use case details | - |
| `/use-cases/submit` | POST | Submit new use case | - |
| `/use-cases/admin/all` | GET | Get all use cases for admin | status (pending, approved, rejected) |
| `/admin/use-cases/{id}/review` | PUT | Review use case | action (APPROVED/REJECTED), feedback |

---

### 11. MEDIA LIBRARY

#### Media API (`/features/media/api/mediaApi.ts`) - File Management
**File Operations**:
- `POST /media/upload` - Upload files (multipart, with progress callback)
- `GET /media` - Get media list (paginated)
- `GET /media/{id}` - Get single media file
- `PUT /media/{id}` - Update media metadata
- `DELETE /media/{id}` - Delete media file
- `POST /media/bulk-delete` - Bulk delete files
- `POST /media/bulk-move` - Move files to folder
- `GET /media/{id}/search` - Search media

**Folder Management**:
- `GET /media/folders` - Get all folders
- `GET /media/folders/tree` - Get folder tree structure
- `POST /media/folders` - Create folder
- `PUT /media/folders/{id}` - Update folder
- `DELETE /media/folders/{id}` - Delete folder

---

### 12. FOLLOWS & ACTIVITY

#### Follows API (`/features/follows/api/followsApi.ts`)
| Endpoint | Method | Description | Entity Types |
|----------|--------|-------------|---------------|
| `/follows` | POST | Follow entity | user, company, topic |
| `/follows/{followId}` | DELETE | Unfollow entity | - |
| `/users/{userId}/following` | GET | Get following list (paginated) | type filter |
| `/users/{userId}/followers` | GET | Get followers list (paginated) | - |
| `/following/feed` | GET | Get activity feed | type (article, forum_post, job) |
| `/follows/check` | GET | Check if following | - |
| `/follows/suggestions` | GET | Get follow suggestions | - |

#### Activities API (`/features/activities/api/activitiesApi.ts`)
- `GET /users/{username}/activity` - Get user activities (type, limit, offset)
- `GET /following/feed` - Get activity feed from followed users (type, limit, offset)

---

### 13. DASHBOARD

#### Dashboard API (`/features/dashboard/api/dashboardApi.ts`)
- `GET /dashboard` - Get all dashboard data (widgets content)
- `GET /dashboard/config` - Get dashboard configuration (positions, enabled state)
- `PUT /dashboard/config` - Update dashboard configuration

---

### 14. RECOMMENDATIONS

#### Recommendations API (`/features/recommendations/api/recommendationsApi.ts`)
- `GET /api/v1/recommendations` - Get personalized recommendations
  - Params: types, limit, excludeIds, includeExplanations
- `POST /api/v1/recommendations/feedback` - Submit feedback
- `POST /api/v1/recommendations/clicks` - Track recommendation click (fire-and-forget)

**Note**: Uses `/api/v1/` prefix (different from standard)

---

### 15. ADMIN MODULE

#### Admin API (`/features/admin/api/adminApi.ts`) - ~260 lines

**Dashboard**:
- `GET /admin/dashboard` - Get dashboard metrics (with optional date range)
- `POST /admin/dashboard/export` - Export metrics (Blob)
- `GET /admin/dashboard/quickActions` - Quick action URLs

**Content Moderation (9 endpoints)**:
- `GET /admin/content` - Get content queue with filters (tab, type, status, search, sortBy)
- `GET /admin/content/reported` - Get reported content queue
- `GET /admin/content/{type}/{id}` - Get detailed content info
- `PUT /admin/content/{type}/{id}/approve` - Approve content
- `PUT /admin/content/{type}/{id}/reject` - Reject content (with reason)
- `PUT /admin/content/{type}/{id}/hide` - Hide content (with reason)
- `DELETE /admin/content/{type}/{id}` - Delete permanently (with reason)
- `POST /admin/content/bulk` - Bulk moderation action

**Analytics (4 endpoints)**:
- `GET /admin/analytics` - Get comprehensive analytics
- `GET /admin/analytics/custom` - Get custom analytics with date range
- `GET /admin/analytics/cohorts` - Get cohort retention analysis
- `GET /admin/analytics/funnels/{type}` - Get funnel analysis
- `POST /admin/analytics/export` - Export analytics (CSV/PDF)
- `POST /admin/analytics/cache/invalidate` - Invalidate cache

#### User Management API (`/features/admin/api/userManagement.ts`) - Admin Users
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/users` | GET | Get all users with filters/pagination |
| `/admin/users/{userId}` | GET | Get user detail |
| `/admin/users/{userId}/activity` | GET | Get user activity history |
| `/admin/users/{userId}/content` | GET | Get user content (articles, topics, etc.) |
| `/admin/users/{userId}/reports` | GET | Get reports against user |
| `/admin/users/{userId}/role` | PATCH | Update user role |
| `/admin/users/{userId}/verify-email` | POST | Verify email manually |
| `/admin/users/{userId}/suspend` | POST | Suspend user (with reason, duration) |
| `/admin/users/{userId}/suspend` | DELETE | Remove suspension |
| `/admin/users/{userId}/ban` | POST | Ban user permanently (with reason) |
| `/admin/users/{userId}/ban` | DELETE | Remove ban |
| `/admin/users/{userId}` | DELETE | Delete user account |
| `/admin/users/{userId}/message` | POST | Send message to user |
| `/admin/users/export` | GET | Export users (CSV/Blob) |
| `/admin/stats` | GET | Get admin statistics |

---

### 16. COMPANIES

#### Companies API (`/features/companies/api/companiesApi.ts`)
**Company Management**:
- `GET /companies/{id}` - Get company profile
- `GET /companies` - List companies with pagination
- `GET /companies/{id}/jobs` - Get company's active jobs
- `POST /companies` - Create company
- `PUT /companies/{id}` - Update company (company admin)
- `POST /companies/{id}/follow` - Follow company
- `DELETE /companies/{id}/follow` - Unfollow company
- `POST /companies/{id}/logo` - Upload logo (multipart)
- `POST /companies/{id}/header` - Upload header image (multipart)

**Bulk Messaging**:
- `POST /companies/messages/bulk` - Send bulk messages to candidates
- `GET /companies/messages/templates` - Get message templates
- `POST /companies/messages/templates` - Create template
- `PUT /companies/messages/templates/{id}` - Update template
- `DELETE /companies/messages/templates/{id}` - Delete template
- `GET /companies/messages/bulk` - Get bulk message history
- `GET /companies/messages/rate-limit` - Get rate limit status

---

### 17. GDPR & LEGAL

#### GDPR API (`/api/gdpr.api.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/gdpr/legal/{type}` | GET | Get legal document (privacy, terms, etc.) |
| `/gdpr/legal/{type}/versions` | GET | Get document versions |
| `/gdpr/consent` | GET | Get user consent preferences |
| `/gdpr/consent` | POST | Update consent preferences |
| `/gdpr/consent/history` | GET | Get consent history |

**Legal Document Types**: privacy-policy, terms-of-service, cookie-policy, etc.

---

## Request/Response Patterns

### Standard Success Response
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ }
}
```

### Pagination Pattern
```json
{
  "success": true,
  "data": [/* items */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Error Response
```json
{
  "message": "Error description",
  "statusCode": 400,
  "errors": [
    {"field": "email", "message": "Invalid email"}
  ]
}
```

### Common Query Parameters
- **Pagination**: `page` (default 1), `limit` (default 20)
- **Sorting**: `sortBy` (field name), `sortOrder` (asc/desc)
- **Filtering**: `search`, `category`, `status`, etc.
- **Advanced**: `filters` object with nested conditions

---

## Authentication & Authorization

### Token Flow
1. **Login**: POST `/auth/login` → receive `accessToken` + `refreshToken`
2. **Storage**: `accessToken` stored in localStorage
3. **Requests**: Token added via request interceptor
4. **Refresh**: Automatic refresh on 401 response
5. **Logout**: Clear token and redirect to `/login`

### Roles/Permissions
- **Public**: No auth required (read articles, browse jobs)
- **User**: Authenticated user (apply jobs, post topics)
- **Moderator**: Forum moderation, content reports
- **Admin**: Full platform management
- **Company**: Job posting, ATS, bulk messaging

---

## Special Request Patterns

### Multipart Form Data (File Uploads)
- **Media Upload**: `POST /media/upload` + file array
- **Avatar/Cover**: `POST /users/me/avatar` with avatar file
- **Company Logo/Header**: `POST /companies/{id}/logo` with file
- **Portfolio Image**: `POST /users/me/portfolio/upload` with image file

Headers: `Content-Type: multipart/form-data`

### Blob Responses (Downloads)
- **CSV Export**: `GET /applications/export` → responseType: 'blob'
- **PDF Export**: `GET /companies/{companyId}/analytics/export/pdf` → responseType: 'blob'
- **Candidate Export**: `POST /candidates/export` → responseType: 'blob'

### Query String Arrays
```
Multiple values: /endpoint?tag=react&tag=typescript
Array params: skills[]=JavaScript&skills[]=Python
```

---

## Error Handling

### Interceptor Behavior
1. **401 Unauthorized**: Attempt token refresh
2. **Token Refresh Fail**: Clear localStorage, redirect to login
3. **Other Errors**: Return rejected promise with AxiosError
4. **Retry Logic**: Single retry attempt on 401

### Client-Side Validation
- Zod schemas for form validation
- Form error handling utilities
- Field-level error messages

---

## Performance & Caching

### Default Timeout
- 30 seconds for all requests
- Configurable per request in axios config

### Response Types
- **JSON**: Standard API responses
- **Blob**: File downloads
- **Text**: Document content
- **Stream**: For video/media (not typical)

### Pagination Best Practices
- Default limit: 20 items
- Max recommended: 100 items
- Always include page and limit for consistency

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total API Modules | 20+ |
| Total Endpoints | 150+ |
| HTTP Methods Used | GET, POST, PUT, PATCH, DELETE |
| Features Implemented | Auth, News, Forum, Jobs, Profile, Admin, Messages, Search, etc. |
| Auth Methods | JWT Bearer Token, OAuth (Google, GitHub, LinkedIn) |
| File Upload Types | Avatar, Cover, Media, Logo, Header, Portfolio |
| Download Formats | CSV, PDF, Blob |

---

## Frontend-Backend Integration Notes

1. **API URL**: Uses environment variable `VITE_API_URL` with fallback to `vps-1a707765.vps.ovh.net:3000/api/v1`
2. **CORS**: `withCredentials: true` for cookie-based auth
3. **Error Tracking**: Integration ready for Sentry via `VITE_SENTRY_DSN`
4. **Token Refresh**: Automatic with fallback to re-login
5. **Rate Limiting**: Implemented at endpoint level (see company messaging)
6. **Response Wrapping**: Most endpoints follow consistent response format

