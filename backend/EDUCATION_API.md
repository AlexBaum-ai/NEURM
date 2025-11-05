# Education Management API

Implementation of SPRINT-1-005: Education management endpoints for user profiles.

## Overview

The Education API allows authenticated users to manage their education history on their profile. All education entries belong to a user and are sorted by display order and end date.

## Endpoints

### 1. GET /api/v1/users/me/education

Get all education entries for the authenticated user.

**Authentication:** Required

**Rate Limit:** Standard API rate limit

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "institution": "Massachusetts Institute of Technology",
      "degree": "PhD in Computer Science",
      "fieldOfStudy": "Artificial Intelligence",
      "startDate": "2015-09-01T00:00:00.000Z",
      "endDate": "2019-06-01T00:00:00.000Z",
      "description": "Research focused on deep learning and natural language processing",
      "displayOrder": 0,
      "createdAt": "2024-11-04T12:00:00.000Z"
    }
  ]
}
```

**Sorting:** Results are ordered by:
1. `displayOrder` ASC
2. `endDate` DESC NULLS FIRST (most recent first, ongoing education at top)

---

### 2. POST /api/v1/users/me/education

Create a new education entry.

**Authentication:** Required

**Rate Limit:** Profile update rate limit (10 requests/hour)

**Request Body:**
```json
{
  "institution": "Harvard University",
  "degree": "MBA",
  "fieldOfStudy": "Business Administration",
  "startDate": "2020-09-01",
  "endDate": "2022-06-01",
  "description": "Focus on technology management and entrepreneurship",
  "displayOrder": 0
}
```

**Field Validations:**
- `institution` (required): String, 1-200 characters
- `degree` (optional): String, max 200 characters
- `fieldOfStudy` (optional): String, max 200 characters
- `startDate` (optional): Date in YYYY-MM-DD format or ISO datetime
- `endDate` (optional): Date in YYYY-MM-DD format or ISO datetime
  - Must be >= startDate if both provided
- `description` (optional): String, max 5000 characters
- `displayOrder` (optional): Integer >= 0, default: 0

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "institution": "Harvard University",
    "degree": "MBA",
    "fieldOfStudy": "Business Administration",
    "startDate": "2020-09-01T00:00:00.000Z",
    "endDate": "2022-06-01T00:00:00.000Z",
    "description": "Focus on technology management and entrepreneurship",
    "displayOrder": 0,
    "createdAt": "2024-11-04T12:00:00.000Z"
  },
  "message": "Education entry created successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed: End date must be after or equal to start date"
  }
}
```

---

### 3. PUT /api/v1/users/me/education/:id

Update an existing education entry.

**Authentication:** Required

**Rate Limit:** Profile update rate limit (10 requests/hour)

**Path Parameters:**
- `id`: UUID of the education entry to update

**Request Body:**
```json
{
  "description": "Updated description with more details",
  "displayOrder": 1
}
```

**Field Validations:**
- At least one field must be provided
- `institution` (optional): String, 1-200 characters
- `degree` (optional): String, max 200 characters
- `fieldOfStudy` (optional): String, max 200 characters
- `startDate` (optional): Date in YYYY-MM-DD format or ISO datetime
- `endDate` (optional): Date in YYYY-MM-DD format or ISO datetime
  - Must be >= startDate when both dates are considered (existing + updated)
- `description` (optional): String, max 5000 characters
- `displayOrder` (optional): Integer >= 0

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "institution": "Harvard University",
    "degree": "MBA",
    "fieldOfStudy": "Business Administration",
    "startDate": "2020-09-01T00:00:00.000Z",
    "endDate": "2022-06-01T00:00:00.000Z",
    "description": "Updated description with more details",
    "displayOrder": 1,
    "createdAt": "2024-11-04T12:00:00.000Z"
  },
  "message": "Education entry updated successfully"
}
```

**Error Responses:**

404 Not Found:
```json
{
  "success": false,
  "error": {
    "message": "Education entry not found"
  }
}
```

403 Forbidden:
```json
{
  "success": false,
  "error": {
    "message": "You do not have permission to update this education entry"
  }
}
```

---

### 4. DELETE /api/v1/users/me/education/:id

Delete an education entry.

**Authentication:** Required

**Rate Limit:** Standard API rate limit

**Path Parameters:**
- `id`: UUID of the education entry to delete

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Education entry deleted successfully"
}
```

**Error Responses:**

404 Not Found:
```json
{
  "success": false,
  "error": {
    "message": "Education entry not found"
  }
}
```

403 Forbidden:
```json
{
  "success": false,
  "error": {
    "message": "You do not have permission to delete this education entry"
  }
}
```

---

## Database Schema

The education entries are stored in the `educations` table:

```sql
CREATE TABLE educations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution VARCHAR(200) NOT NULL,
  degree VARCHAR(200),
  field_of_study VARCHAR(200),
  start_date DATE,
  end_date DATE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_educations_user_id ON educations(user_id);
```

## Security Considerations

1. **Authorization**: Users can only manage their own education entries
2. **Input Validation**: All inputs are validated using Zod schemas
3. **Date Validation**: End date must be >= start date
4. **Rate Limiting**: Profile updates are rate-limited to prevent abuse
5. **SQL Injection**: Protected via Prisma ORM parameterized queries
6. **Error Tracking**: All errors are logged to Sentry

## Usage Examples

### Create Education Entry (cURL)

```bash
curl -X POST https://api.neurmatic.com/api/v1/users/me/education \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "institution": "Stanford University",
    "degree": "BS Computer Science",
    "fieldOfStudy": "Machine Learning",
    "startDate": "2018-09-01",
    "endDate": "2022-06-01",
    "description": "Focus on AI and deep learning",
    "displayOrder": 0
  }'
```

### Update Education Entry

```bash
curl -X PUT https://api.neurmatic.com/api/v1/users/me/education/abc-123-def \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "displayOrder": 2
  }'
```

### Delete Education Entry

```bash
curl -X DELETE https://api.neurmatic.com/api/v1/users/me/education/abc-123-def \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get All Education Entries

```bash
curl -X GET https://api.neurmatic.com/api/v1/users/me/education \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Files Created

- `/backend/src/modules/users/education.validation.ts` - Zod validation schemas
- `/backend/src/modules/users/education.service.ts` - Business logic layer
- `/backend/src/modules/users/education.controller.ts` - HTTP request handlers
- `/backend/src/modules/users/users.routes.ts` - Route definitions (updated)
- `/backend/src/modules/users/__tests__/education.service.test.ts` - Unit tests

## Testing

Run the education service tests:

```bash
npm test -- education.service.test.ts
```

Run all user module tests:

```bash
npm test -- src/modules/users
```

## Next Steps

1. Start the backend server: `npm run dev`
2. Test the endpoints using Postman or curl
3. Verify database queries are optimized
4. Add integration tests for the full API flow
5. Update frontend to consume these endpoints
