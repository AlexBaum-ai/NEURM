# Education API - Quick Start Guide

## 🚀 Quick Test

### 1. Start the Server
```bash
cd /home/neurmatic/nEURM/backend
npm run dev
```

### 2. Get Your JWT Token
First, authenticate to get a JWT token:
```bash
# Login or register to get token
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Save the token from the response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### 3. Test Education Endpoints

#### Create Education Entry
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me/education \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "institution": "MIT",
    "degree": "PhD Computer Science",
    "fieldOfStudy": "Artificial Intelligence",
    "startDate": "2015-09-01",
    "endDate": "2019-06-01",
    "description": "Focus on deep learning and NLP",
    "displayOrder": 0
  }'
```

#### Get All Education
```bash
curl -X GET http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me/education \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Update Education Entry
```bash
curl -X PUT http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me/education/EDUCATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "displayOrder": 1
  }'
```

#### Delete Education Entry
```bash
curl -X DELETE http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me/education/EDUCATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 Example Response

### Success Response (GET)
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "institution": "MIT",
      "degree": "PhD Computer Science",
      "fieldOfStudy": "Artificial Intelligence",
      "startDate": "2015-09-01T00:00:00.000Z",
      "endDate": "2019-06-01T00:00:00.000Z",
      "description": "Focus on deep learning and NLP",
      "displayOrder": 0,
      "createdAt": "2024-11-04T12:00:00.000Z"
    }
  ]
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Education entry not found"
  }
}
```

## 🧪 Validation Rules

### Required Fields
- ✅ `institution` (1-200 characters)

### Optional Fields
- `degree` (max 200 characters)
- `fieldOfStudy` (max 200 characters)
- `startDate` (YYYY-MM-DD format)
- `endDate` (YYYY-MM-DD format, must be >= startDate)
- `description` (max 5000 characters)
- `displayOrder` (integer >= 0, default: 0)

### Date Validation
```javascript
// ✅ Valid
{
  "startDate": "2015-09-01",
  "endDate": "2019-06-01"  // OK: endDate >= startDate
}

// ❌ Invalid
{
  "startDate": "2019-09-01",
  "endDate": "2015-06-01"  // ERROR: endDate < startDate
}

// ✅ Valid - Ongoing education
{
  "startDate": "2020-09-01",
  "endDate": null  // OK: currently studying
}
```

## 🔒 Security

### Authentication Required
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Authorization
- Users can only view/modify their own education entries
- Attempting to update/delete another user's education returns 403 Forbidden

### Rate Limiting
- **Read operations (GET):** Standard API rate limit
- **Write operations (POST, PUT):** 10 requests per hour

## 🐛 Common Errors

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "No token provided"
  }
}
```
**Fix:** Add `Authorization: Bearer <token>` header

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Validation failed: Institution name is required"
  }
}
```
**Fix:** Check request body matches validation rules

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "You do not have permission to update this education entry"
  }
}
```
**Fix:** You're trying to modify another user's education entry

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Education entry not found"
  }
}
```
**Fix:** Check the education ID is correct and belongs to you

## 📊 Testing Checklist

- [ ] Create education entry with all fields
- [ ] Create education entry with only required field (institution)
- [ ] Get list of education entries (verify sorting)
- [ ] Update education entry
- [ ] Delete education entry
- [ ] Try to update another user's education (should fail with 403)
- [ ] Try to delete another user's education (should fail with 403)
- [ ] Test date validation (endDate < startDate should fail)
- [ ] Test without authentication (should fail with 401)
- [ ] Test rate limiting (exceed 10 updates/hour)

## 📂 File Locations

- **Routes:** `src/modules/users/users.routes.ts`
- **Controller:** `src/modules/users/education.controller.ts`
- **Service:** `src/modules/users/education.service.ts`
- **Validation:** `src/modules/users/education.validation.ts`
- **Tests:** `src/modules/users/__tests__/education.service.test.ts`

## 🔗 Related Endpoints

- **User Profile:** `GET /api/v1/users/me`
- **Work Experience:** `/api/v1/users/me/work-experience/*`
- **Skills:** `/api/v1/users/me/skills/*`

## 📞 Need Help?

- Check `EDUCATION_API.md` for detailed API documentation
- Check `SPRINT-1-005-SUMMARY.md` for implementation details
- Run tests: `npm test -- education.service.test.ts`
- View logs: Check Winston logs or Sentry dashboard
