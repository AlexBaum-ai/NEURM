# ATS (Applicant Tracking System) Implementation

## Overview

The ATS backend provides a comprehensive applicant management system for companies to track, evaluate, and collaborate on job applications.

## Features

### 1. Application Management
- **List Applications**: Get all applications for company's jobs with advanced filtering
- **Application Detail**: View full candidate profile including forum reputation and badges
- **Status Management**: Update application status through the hiring pipeline
- **Activity Tracking**: Complete audit log of all application actions

### 2. Filtering & Sorting
**Filter by:**
- Job ID
- Application status
- Date range (applied date)
- Match score range
- Rating range

**Sort by:**
- Date applied (default)
- Match score
- Average rating

### 3. Collaboration Features
- **Notes**: Add internal/external notes to applications
- **Ratings**: Rate candidates 1-5 stars (per team member)
- **Sharing**: Share applications with team members
- **Activity Log**: Track all status changes, notes, ratings, and shares

### 4. Bulk Operations
- Bulk status updates (up to 100 applications)
- Bulk archive (sets status to 'rejected')

### 5. Candidate Insights
- **Match Score**: AI-calculated job match percentage
- **Forum Reputation**: Community activity and reputation level
- **Forum Badges**: Earned badges and achievements
- **Skills & Experience**: Complete profile with work history, education, portfolio

## Database Schema

### New Tables

#### application_notes
```sql
CREATE TABLE "application_notes" (
  "id" TEXT PRIMARY KEY,
  "application_id" TEXT NOT NULL REFERENCES "job_applications"(id),
  "user_id" TEXT NOT NULL REFERENCES "users"(id),
  "note" TEXT NOT NULL,
  "is_internal" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL
);
```

#### application_ratings
```sql
CREATE TABLE "application_ratings" (
  "id" TEXT PRIMARY KEY,
  "application_id" TEXT NOT NULL REFERENCES "job_applications"(id),
  "user_id" TEXT NOT NULL REFERENCES "users"(id),
  "rating" INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  UNIQUE("application_id", "user_id")
);
```

#### application_shares
```sql
CREATE TABLE "application_shares" (
  "id" TEXT PRIMARY KEY,
  "application_id" TEXT NOT NULL REFERENCES "job_applications"(id),
  "shared_by" TEXT NOT NULL REFERENCES "users"(id),
  "shared_with" TEXT NOT NULL REFERENCES "users"(id),
  "message" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("application_id", "shared_with")
);
```

## API Endpoints

### Base URL: `/api/v1/companies/applications`

### 1. List Applications
```
GET /api/v1/companies/applications
```

**Query Parameters:**
- `jobId` (optional): Filter by specific job
- `status` (optional): Filter by status (submitted, viewed, screening, interview, offer, rejected, withdrawn)
- `dateFrom` (optional): Filter by date range start (ISO 8601)
- `dateTo` (optional): Filter by date range end (ISO 8601)
- `minMatchScore` (optional): Minimum match score (0-100)
- `maxMatchScore` (optional): Maximum match score (0-100)
- `minRating` (optional): Minimum rating (1-5)
- `maxRating` (optional): Maximum rating (1-5)
- `sortBy` (optional): Sort field (date_applied, match_score, rating)
- `sortOrder` (optional): Sort direction (asc, desc)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "app-123",
      "status": "screening",
      "appliedAt": "2025-01-15T10:30:00Z",
      "user": {
        "id": "user-123",
        "username": "candidate1",
        "email": "candidate@example.com",
        "profile": {
          "displayName": "John Doe",
          "avatarUrl": "...",
          "location": "San Francisco, CA"
        }
      },
      "job": {
        "id": "job-123",
        "title": "Senior LLM Engineer",
        "location": "Remote"
      },
      "averageRating": 4.5,
      "matchScore": 87.5,
      "notesCount": 3,
      "forumReputation": {
        "score": 250,
        "level": "contributor"
      },
      "forumBadges": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 2. Get Application Detail
```
GET /api/v1/companies/applications/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-123",
    "coverLetter": "...",
    "resumeUrl": "...",
    "screeningAnswers": {...},
    "status": "screening",
    "appliedAt": "2025-01-15T10:30:00Z",
    "user": {
      "id": "user-123",
      "profile": {...},
      "skills": [...],
      "workExperiences": [...],
      "educations": [...],
      "portfolioProjects": [...],
      "reputation": {
        "totalScore": 250,
        "level": "contributor",
        "answersCount": 45,
        "questionsCount": 12,
        "bestAnswersCount": 8
      },
      "userBadges": [...]
    },
    "job": {...},
    "statusHistory": [...],
    "notes": [...],
    "ratings": [...],
    "shares": [...],
    "averageRating": 4.5
  }
}
```

### 3. Update Application Status
```
PUT /api/v1/companies/applications/:id/status
```

**Request Body:**
```json
{
  "status": "interview",
  "notes": "Moving to interview stage after screening call"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application status updated successfully",
  "data": {...}
}
```

### 4. Add Note
```
POST /api/v1/companies/applications/:id/notes
```

**Request Body:**
```json
{
  "note": "Great technical skills, strong portfolio projects",
  "isInternal": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note added successfully",
  "data": {
    "id": "note-123",
    "note": "...",
    "isInternal": true,
    "createdAt": "2025-01-15T14:30:00Z",
    "user": {
      "username": "recruiter1",
      "profile": {
        "displayName": "Jane Smith"
      }
    }
  }
}
```

### 5. Rate Application
```
PUT /api/v1/companies/applications/:id/rating
```

**Request Body:**
```json
{
  "rating": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application rated successfully",
  "data": {
    "id": "rating-123",
    "rating": 5,
    "createdAt": "2025-01-15T14:35:00Z"
  }
}
```

### 6. Share Application
```
POST /api/v1/companies/applications/:id/share
```

**Request Body:**
```json
{
  "sharedWith": "team-member-user-id",
  "message": "Please review this candidate for technical interview"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application shared successfully",
  "data": {
    "id": "share-123",
    "sharedWith": "...",
    "message": "...",
    "createdAt": "2025-01-15T14:40:00Z"
  }
}
```

### 7. Get Activity Log
```
GET /api/v1/companies/applications/:id/activity
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "history-1",
      "fromStatus": "submitted",
      "toStatus": "viewed",
      "changedById": "user-123",
      "notes": "Status changed from submitted to viewed",
      "createdAt": "2025-01-15T11:00:00Z"
    },
    {
      "id": "history-2",
      "fromStatus": "viewed",
      "toStatus": "screening",
      "changedById": "user-123",
      "notes": "Moving to screening after initial review",
      "createdAt": "2025-01-15T12:00:00Z"
    }
  ]
}
```

### 8. Bulk Update Status
```
POST /api/v1/companies/applications/bulk/status
```

**Request Body:**
```json
{
  "applicationIds": ["app-1", "app-2", "app-3"],
  "status": "rejected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 application(s) updated successfully",
  "data": {
    "updated": 3,
    "status": "rejected"
  }
}
```

### 9. Bulk Archive
```
POST /api/v1/companies/applications/bulk/archive
```

**Request Body:**
```json
{
  "applicationIds": ["app-1", "app-2", "app-3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 application(s) archived successfully",
  "data": {
    "updated": 3,
    "status": "rejected"
  }
}
```

## Email Notifications

Candidates receive automated email notifications when:
- Application status changes
- They are invited to interview
- They receive a job offer
- Application is rejected

Email templates are available in `/modules/jobs/emails/applicationStatusEmail.ts`

## Security & Permissions

All ATS endpoints require:
1. **Authentication**: User must be logged in
2. **Authorization**: User must be the company owner

Access control is enforced at the service layer:
```typescript
// Verify company ownership
const company = await prisma.company.findUnique({
  where: { ownerUserId: userId }
});

if (!company) {
  throw new ForbiddenError('Only company owners can access applications');
}
```

## Testing

Comprehensive test suite available in:
- `/modules/jobs/__tests__/atsService.test.ts`

Run tests:
```bash
npm test -- atsService.test.ts
```

## Usage Examples

### Example 1: Get all applications for a job
```typescript
GET /api/v1/companies/applications?jobId=job-123&sortBy=match_score&sortOrder=desc
```

### Example 2: Filter high-potential candidates
```typescript
GET /api/v1/companies/applications?minMatchScore=80&minRating=4&status=screening
```

### Example 3: View recent applications
```typescript
GET /api/v1/companies/applications?dateFrom=2025-01-01&sortBy=date_applied&sortOrder=desc
```

## Architecture

```
Routes (ats.routes.ts)
  ↓
Controller (ats.controller.ts)
  ↓
Service (services/atsService.ts)
  ↓
Database (Prisma)
```

**Layered architecture:**
- **Routes**: Define endpoints and apply middleware
- **Controller**: Handle HTTP requests/responses
- **Service**: Business logic and data processing
- **Database**: Prisma ORM for data access

## Error Handling

All endpoints use standardized error handling:
- `NotFoundError` (404): Application not found
- `ForbiddenError` (403): Unauthorized access
- `ValidationError` (400): Invalid input data
- `BadRequestError` (400): Invalid request

Errors are tracked with Sentry for monitoring.

## Interview Scheduling (Placeholder)

Interview scheduling integration is marked as a placeholder feature. Current implementation tracks interview status but doesn't include calendar integration.

Future enhancements could include:
- Calendar API integration (Google Calendar, Outlook)
- Interview slot selection
- Automated scheduling emails
- Interview reminders

## Performance Considerations

1. **Pagination**: Maximum 100 results per request
2. **Indexes**: Database indexes on frequently queried fields
3. **Caching**: Consider Redis caching for frequently accessed data
4. **Async Operations**: Notifications sent asynchronously to avoid blocking

## Migration

Run the migration to add ATS tables:
```bash
cd backend
npx prisma migrate deploy
```

Or create a new migration:
```bash
npx prisma migrate dev --name add_ats_tables
```
