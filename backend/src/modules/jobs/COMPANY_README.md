# Company Profiles API Module

## Overview

The Company Profiles module provides a comprehensive backend API for managing company profiles, including company information, branding assets, tech stack details, social links, and company-related features like following and job listings.

## Features

- **Public Company Profiles**: View company information, jobs, and statistics
- **Profile Management**: Company owners can update their profile information
- **Company Following**: Users can follow companies to receive updates
- **Job Integration**: Display company's active job postings
- **Slug Generation**: Automatic URL-friendly slug creation from company names
- **Verification Status**: Track and display verified company badges
- **View Tracking**: Monitor profile view counts
- **Search & Filtering**: Find companies by industry, size, verification status

## Architecture

The module follows a layered architecture pattern:

```
Routes → Controller → Service → Repository → Database
```

### Layers

1. **Routes** (`company.routes.ts`): Express route definitions and middleware
2. **Controller** (`company.controller.ts`): Request/response handling
3. **Service** (`company.service.ts`): Business logic and validation
4. **Repository** (`company.repository.ts`): Data access layer
5. **Validation** (`company.validation.ts`): Zod schemas for input validation

## Database Schema

### Company Table

```prisma
model Company {
  id                 String   @id @default(uuid())
  name               String   @db.VarChar(200)
  slug               String   @unique @db.VarChar(200)
  website            String?  @db.VarChar(255)
  description        String?  @db.Text
  logoUrl            String?  @map("logo_url") @db.VarChar(500)
  headerImageUrl     String?  @map("header_image_url") @db.VarChar(500)
  industry           String?  @db.VarChar(100)
  companySize        String?  @map("company_size") @db.VarChar(50)
  location           String?  @db.VarChar(100)
  locations          String[] @default([])
  foundedYear        Int?     @map("founded_year")
  mission            String?  @db.Text
  benefits           String[] @default([])
  cultureDescription String?  @map("culture_description") @db.Text
  techStack          Json?    @map("tech_stack")
  linkedinUrl        String?  @map("linkedin_url") @db.VarChar(255)
  twitterUrl         String?  @map("twitter_url") @db.VarChar(255)
  githubUrl          String?  @map("github_url") @db.VarChar(255)
  ownerUserId        String   @unique @map("owner_user_id")
  verifiedCompany    Boolean  @default(false) @map("verified_company")
  viewCount          Int      @default(0) @map("view_count")
  followerCount      Int      @default(0) @map("follower_count")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

### CompanyFollow Table

```prisma
model CompanyFollow {
  companyId String   @map("company_id")
  userId    String   @map("user_id")
  createdAt DateTime @default(now())
}
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. List Companies
```http
GET /api/v1/companies
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20, max: 100)
  - search: string (searches name and description)
  - industry: string
  - companySize: enum ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')
  - verified: boolean

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Company Name",
      "slug": "company-name",
      "logoUrl": "https://...",
      "industry": "Technology",
      "companySize": "51-200",
      "location": "San Francisco, CA",
      "verifiedCompany": true,
      "_count": {
        "jobs": 5,
        "follows": 120
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### 2. Get Company Profile
```http
GET /api/v1/companies/:id
Parameters:
  - id: UUID or slug

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Company Name",
    "slug": "company-name",
    "website": "https://company.com",
    "description": "Company description",
    "logoUrl": "https://...",
    "headerImageUrl": "https://...",
    "industry": "Technology",
    "companySize": "51-200",
    "location": "San Francisco, CA",
    "locations": ["San Francisco", "New York"],
    "foundedYear": 2020,
    "mission": "Our mission statement",
    "benefits": ["Health Insurance", "401k", "Remote Work"],
    "cultureDescription": "Our culture",
    "techStack": {
      "modelsUsed": ["GPT-4", "Claude"],
      "frameworks": ["LangChain"],
      "languages": ["Python", "TypeScript"]
    },
    "linkedinUrl": "https://linkedin.com/company/...",
    "twitterUrl": "https://twitter.com/...",
    "githubUrl": "https://github.com/...",
    "verifiedCompany": true,
    "viewCount": 1250,
    "followerCount": 320,
    "isFollowing": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

#### 3. Get Company Jobs
```http
GET /api/v1/companies/:id/jobs
Parameters:
  - id: UUID
Query Parameters:
  - includeDetails: boolean (default: false)

Response: 200 OK
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "title": "Senior ML Engineer",
        "slug": "senior-ml-engineer",
        "location": "Remote",
        "workLocation": "remote",
        "experienceLevel": "senior",
        "salaryMin": 150000,
        "salaryMax": 200000,
        "salaryCurrency": "USD",
        "publishedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 5
  }
}
```

### Protected Endpoints (Authentication Required)

#### 4. Create Company
```http
POST /api/v1/companies
Headers:
  - Authorization: Bearer {token}

Request Body:
{
  "name": "Company Name",
  "website": "https://company.com",
  "description": "Company description",
  "industry": "Technology",
  "companySize": "51-200",
  "location": "San Francisco, CA"
}

Response: 201 Created
{
  "success": true,
  "message": "Company profile created successfully",
  "data": { /* company object */ }
}
```

#### 5. Update Company Profile
```http
PUT /api/v1/companies/:id
Headers:
  - Authorization: Bearer {token}
Parameters:
  - id: UUID

Request Body: (all fields optional)
{
  "name": "Updated Company Name",
  "description": "Updated description",
  "website": "https://company.com",
  "logoUrl": "https://...",
  "headerImageUrl": "https://...",
  "industry": "AI/ML",
  "companySize": "51-200",
  "location": "San Francisco, CA",
  "locations": ["San Francisco", "New York", "Remote"],
  "foundedYear": 2020,
  "mission": "Updated mission",
  "benefits": ["Health Insurance", "401k", "Stock Options"],
  "cultureDescription": "Updated culture description",
  "techStack": {
    "modelsUsed": ["GPT-4", "Claude-3"],
    "frameworks": ["LangChain", "LlamaIndex"],
    "languages": ["Python", "TypeScript", "Go"]
  },
  "linkedinUrl": "https://linkedin.com/company/...",
  "twitterUrl": "https://twitter.com/...",
  "githubUrl": "https://github.com/..."
}

Response: 200 OK
{
  "success": true,
  "message": "Company profile updated successfully",
  "data": { /* updated company object */ }
}
```

#### 6. Follow Company
```http
POST /api/v1/companies/:id/follow
Headers:
  - Authorization: Bearer {token}
Parameters:
  - id: UUID

Response: 200 OK
{
  "success": true,
  "message": "Successfully followed company"
}

Error: 409 Conflict (if already following)
{
  "success": false,
  "message": "You are already following this company"
}
```

#### 7. Unfollow Company
```http
DELETE /api/v1/companies/:id/follow
Headers:
  - Authorization: Bearer {token}
Parameters:
  - id: UUID

Response: 200 OK
{
  "success": true,
  "message": "Successfully unfollowed company"
}

Error: 409 Conflict (if not following)
{
  "success": false,
  "message": "You are not following this company"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "companySize",
      "message": "Invalid company size value"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to update this company profile"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Company not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "User already has a company profile"
}
```

## Testing

### Unit Tests

Run unit tests for the service layer:

```bash
npm test src/modules/jobs/__tests__/company.service.test.ts
```

### Integration Tests

Run the API integration test script:

```bash
./test-company-api.sh
```

To test authenticated endpoints, set your JWT token in the script:

```bash
TOKEN="your-jwt-token" ./test-company-api.sh
```

## Validation Rules

### Company Name
- Required on creation
- Min length: 2 characters
- Max length: 200 characters
- Auto-generates unique slug

### URLs (website, logo, header, social links)
- Must be valid URLs
- Max length: 255-500 characters (depending on field)
- Optional (nullable)

### Description
- Max length: 5000 characters
- Optional

### Company Size
- Must be one of: '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
- Optional

### Founded Year
- Must be integer
- Min: 1800
- Max: Current year
- Optional

### Locations Array
- Max 10 locations
- Each location max 100 characters

### Benefits Array
- Max 20 benefits
- Each benefit max 200 characters

### Tech Stack
- JSON object with optional fields:
  - modelsUsed: array of strings
  - frameworks: array of strings
  - languages: array of strings
  - infrastructure: array of strings
  - tools: array of strings

## Features & Business Logic

### Slug Generation
- Automatically generated from company name
- Converts to lowercase, removes special characters
- Ensures uniqueness by appending numbers if needed
- Example: "Tech Innovations Inc" → "tech-innovations-inc"

### View Count Tracking
- Automatically incremented on profile view
- Async operation (non-blocking)
- Logged errors sent to Sentry

### Following System
- Users can follow/unfollow companies
- Follower count automatically maintained
- Prevents duplicate follows
- Returns following status with profile data

### Authorization
- Only company owner can update profile
- Verified by matching ownerUserId with authenticated user
- Returns 403 Forbidden if unauthorized

## Error Handling & Logging

### Sentry Integration
All errors are automatically captured and sent to Sentry with:
- Operation tags
- User context (if authenticated)
- Request metadata

### Logging
- Info logs: Profile updates, follows/unfollows
- Error logs: All caught exceptions
- Includes relevant context (IDs, user info, operation)

## Dependencies

- `@prisma/client`: Database ORM
- `express`: Web framework
- `zod`: Schema validation
- `@sentry/node`: Error tracking
- `winston`: Logging

## Future Enhancements

1. **Reviews & Ratings**: Glassdoor-style company reviews (placeholder in schema)
2. **Company Analytics**: Track profile performance, job view rates
3. **Email Notifications**: Notify followers of new job postings
4. **Advanced Search**: Full-text search, location-based search
5. **Company Verification**: Admin workflow for verification badges
6. **Media Gallery**: Upload and manage company culture photos/videos
7. **Team Members**: Showcase team members and their roles

## Maintenance Notes

- View count incrementation uses non-blocking async operations
- Slug uniqueness is enforced at database level (unique constraint)
- Follower count is denormalized for performance
- All dates stored in UTC with timezone support
- Supports PostgreSQL full-text search for future implementation
