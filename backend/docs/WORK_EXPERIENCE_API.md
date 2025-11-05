# Work Experience Management API

## Overview
CRUD API endpoints for managing work experience entries on user profiles. Implemented for **SPRINT-1-004**.

## Endpoints

### 1. Create Work Experience
**POST** `/api/v1/users/me/work-experience`

Creates a new work experience entry for the authenticated user.

**Authentication:** Required
**Rate Limit:** 10 requests/hour (profileUpdateLimiter)

**Request Body:**
```json
{
  "title": "Senior ML Engineer",
  "company": "AI Labs Inc",
  "location": "San Francisco, CA",
  "employmentType": "full_time",
  "startDate": "2020-01-15",
  "endDate": null,
  "description": "Leading LLM integration projects and RAG implementations",
  "techStack": ["Python", "PyTorch", "LangChain", "GPT-4"],
  "displayOrder": 0
}
```

**Fields:**
- `title` (string, required): Job title (max 200 chars)
- `company` (string, required): Company name (max 200 chars)
- `location` (string, optional): Location (max 100 chars)
- `employmentType` (enum, optional): `full_time`, `part_time`, `freelance`, `internship`
- `startDate` (date, required): Job start date (ISO 8601 format)
- `endDate` (date, optional): Job end date (null for current role)
- `description` (string, optional): Job description (max 5000 chars)
- `techStack` (array, optional): Technologies used (max 50 items)
- `displayOrder` (number, optional): Display order (default: 0)

**Validation:**
- `endDate` must be after or equal to `startDate`
- Current role: set `endDate` to `null`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior ML Engineer",
    "company": "AI Labs Inc",
    "location": "San Francisco, CA",
    "employmentType": "full_time",
    "startDate": "2020-01-15T00:00:00.000Z",
    "endDate": null,
    "description": "Leading LLM integration projects...",
    "techStack": ["Python", "PyTorch", "LangChain", "GPT-4"],
    "displayOrder": 0,
    "isCurrent": true,
    "createdAt": "2025-11-04T22:00:00.000Z"
  },
  "message": "Work experience created successfully"
}
```

---

### 2. List Work Experiences
**GET** `/api/v1/users/me/work-experience`

Retrieves all work experience entries for the authenticated user.

**Authentication:** Required
**Rate Limit:** 100 requests/15min (apiLimiter)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Senior ML Engineer",
      "company": "AI Labs Inc",
      "location": "San Francisco, CA",
      "employmentType": "full_time",
      "startDate": "2020-01-15T00:00:00.000Z",
      "endDate": null,
      "description": "Leading LLM integration projects...",
      "techStack": ["Python", "PyTorch", "LangChain"],
      "displayOrder": 0,
      "isCurrent": true,
      "createdAt": "2025-11-04T22:00:00.000Z"
    }
  ],
  "count": 1
}
```

**Sorting:** Sorted by `displayOrder` ASC, then `startDate` DESC (most recent first)

---

### 3. Update Work Experience
**PUT** `/api/v1/users/me/work-experience/:id`

Updates an existing work experience entry.

**Authentication:** Required
**Rate Limit:** 10 requests/hour (profileUpdateLimiter)

**Path Parameters:**
- `id` (UUID): Work experience entry ID

**Request Body (partial update):**
```json
{
  "title": "Lead ML Engineer",
  "description": "Leading LLM integration, RAG, and fine-tuning",
  "techStack": ["Python", "PyTorch", "LangChain", "GPT-4", "Claude"]
}
```

**Notes:**
- All fields are optional
- At least one field must be provided
- Only provided fields will be updated
- Must own the work experience entry

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Lead ML Engineer",
    "company": "AI Labs Inc",
    "location": "San Francisco, CA",
    "employmentType": "full_time",
    "startDate": "2020-01-15T00:00:00.000Z",
    "endDate": null,
    "description": "Leading LLM integration, RAG, and fine-tuning",
    "techStack": ["Python", "PyTorch", "LangChain", "GPT-4", "Claude"],
    "displayOrder": 0,
    "isCurrent": true,
    "createdAt": "2025-11-04T22:00:00.000Z"
  },
  "message": "Work experience updated successfully"
}
```

---

### 4. Delete Work Experience
**DELETE** `/api/v1/users/me/work-experience/:id`

Deletes a work experience entry.

**Authentication:** Required
**Rate Limit:** 100 requests/15min (apiLimiter)

**Path Parameters:**
- `id` (UUID): Work experience entry ID

**Response (200):**
```json
{
  "success": true,
  "message": "Work experience deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed: End date must be after or equal to start date"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Work experience not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

---

## Implementation Details

### Architecture
```
Routes (users.routes.ts)
  ↓
Controller (workExperience.controller.ts)
  ↓
Service (workExperience.service.ts)
  ↓
Repository (workExperience.repository.ts)
  ↓
Database (Prisma ORM)
```

### Files Created
- `src/modules/users/workExperience.validation.ts` - Zod validation schemas
- `src/modules/users/workExperience.repository.ts` - Database operations
- `src/modules/users/workExperience.service.ts` - Business logic
- `src/modules/users/workExperience.controller.ts` - HTTP request handling
- Updated: `src/modules/users/users.routes.ts` - Route definitions

### Database Schema
```prisma
model WorkExperience {
  id             String          @id @default(uuid())
  userId         String          @map("user_id")
  title          String          @db.VarChar(200)
  company        String          @db.VarChar(200)
  location       String?         @db.VarChar(100)
  employmentType EmploymentType? @map("employment_type")
  startDate      DateTime        @map("start_date") @db.Date
  endDate        DateTime?       @map("end_date") @db.Date
  description    String?         @db.Text
  techStack      Json?           @map("tech_stack")
  displayOrder   Int             @default(0) @map("display_order")
  createdAt      DateTime        @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, displayOrder])
  @@map("work_experiences")
}
```

### Security Features
- **Authentication:** JWT-based authentication required
- **Authorization:** Users can only access their own work experiences
- **Rate Limiting:** Prevents abuse
- **Input Validation:** Zod schemas validate all inputs
- **SQL Injection Protection:** Prisma ORM with parameterized queries
- **Error Tracking:** Sentry integration for monitoring

### Key Features
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Date validation (endDate must be >= startDate)
- ✅ Current role support (endDate = null)
- ✅ Tech stack stored as JSONB for flexibility
- ✅ Display order for custom sorting
- ✅ Proper error handling with detailed messages
- ✅ Rate limiting on sensitive operations
- ✅ Comprehensive logging

---

## Testing

### Manual Testing
Use the provided test script:
```bash
cd backend
./test-work-experience-api.sh <YOUR_AUTH_TOKEN>
```

### Example cURL Commands

**Create:**
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me/work-experience \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "ML Engineer",
    "company": "Tech Corp",
    "startDate": "2020-01-01",
    "endDate": null,
    "techStack": ["Python", "TensorFlow"]
  }'
```

**List:**
```bash
curl -X GET http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me/work-experience \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update:**
```bash
curl -X PUT http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me/work-experience/UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "Senior ML Engineer"}'
```

**Delete:**
```bash
curl -X DELETE http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me/work-experience/UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Acceptance Criteria ✅

All acceptance criteria from SPRINT-1-004 met:

- ✅ POST /api/v1/users/me/work-experience creates entry
- ✅ GET /api/v1/users/me/work-experience lists experiences
- ✅ PUT /api/v1/users/me/work-experience/:id updates entry
- ✅ DELETE /api/v1/users/me/work-experience/:id removes entry
- ✅ Fields: title, company, location, employmentType, startDate, endDate, description
- ✅ Tech stack stored as JSONB
- ✅ Display order field for sorting
- ✅ Current role: endDate = null
- ✅ Date validation (start before end)

---

## Status
**SPRINT-1-004: COMPLETED** ✅

Implementation completed on: November 4, 2025
