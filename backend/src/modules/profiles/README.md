# Candidate Profiles Module

## Overview

The Candidate Profiles module provides comprehensive profile management for job seekers on the platform. It extends the base user profile system with candidate-specific features including job preferences, portfolio showcasing, and recruiter visibility controls.

## Features

- **Job Preferences Management**: Define desired roles, work locations, salary expectations, and company preferences
- **Privacy Controls**: Granular privacy settings per section (public, community, recruiters, private)
- **Recruiter Visibility**: Toggle profile visibility to recruiters
- **Portfolio Integration**: Showcase featured projects and work samples
- **Community Stats**: Display forum reputation, badges, and top contributions
- **Work Experience & Education**: Comprehensive career history
- **Skills Management**: Technical skills with proficiency levels and endorsements

## Database Schema

### JobPreferences Table

```prisma
model JobPreferences {
  id                   String   @id @default(uuid())
  userId               String   @unique @map("user_id")
  rolesInterested      String[] @map("roles_interested")
  jobTypes             String[] @map("job_types")
  workLocations        String[] @map("work_locations")
  preferredLocations   String[] @map("preferred_locations")
  openToRelocation     Boolean  @default(false)
  salaryExpectationMin Decimal? @db.Decimal(12, 2)
  salaryExpectationMax Decimal? @db.Decimal(12, 2)
  salaryCurrency       String?  @db.VarChar(10)
  desiredStartDate     DateTime? @db.Date
  availability         String?  @db.VarChar(100)
  companyPreferences   Json?
  visibleToRecruiters  Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

## API Endpoints

### PUT /api/v1/profiles/candidate

Update candidate profile with job preferences and basic profile fields.

**Authentication**: Required
**Rate Limit**: 10 requests/hour

**Request Body**:

```json
{
  "jobPreferences": {
    "rolesInterested": ["AI Engineer", "ML Engineer"],
    "jobTypes": ["full_time", "contract"],
    "workLocations": ["remote", "hybrid"],
    "preferredLocations": ["San Francisco", "New York"],
    "openToRelocation": true,
    "salaryExpectationMin": 150000,
    "salaryExpectationMax": 200000,
    "salaryCurrency": "USD",
    "desiredStartDate": "2024-03-01",
    "availability": "Available immediately",
    "companyPreferences": {
      "companySize": ["startup", "mid"],
      "industries": ["AI", "SaaS"],
      "workCulture": ["remote-first", "flexible"],
      "benefits": ["equity", "health-insurance"]
    },
    "visibleToRecruiters": true
  },
  "headline": "Senior AI Engineer",
  "bio": "Passionate about building LLM applications",
  "location": "San Francisco, CA",
  "website": "https://example.com",
  "availabilityStatus": "actively_looking",
  "yearsExperience": 5
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "username": "johndoe",
    "accountType": "individual",
    "profile": {
      "displayName": "John Doe",
      "headline": "Senior AI Engineer",
      "bio": "Passionate about building LLM applications",
      "avatarUrl": "https://example.com/avatar.jpg",
      "location": "San Francisco, CA",
      "availabilityStatus": "actively_looking",
      "yearsExperience": 5
    },
    "jobPreferences": {
      "rolesInterested": ["AI Engineer", "ML Engineer"],
      "workLocations": ["remote", "hybrid"],
      "salaryExpectationMin": 150000,
      "salaryExpectationMax": 200000,
      "visibleToRecruiters": true
    },
    "skills": [...],
    "workExperience": [...],
    "education": [...],
    "portfolio": [...],
    "communityStats": {
      "reputation": 500,
      "reputationLevel": "expert",
      "topicsCount": 10,
      "repliesCount": 50,
      "badges": [...]
    }
  },
  "message": "Candidate profile updated successfully"
}
```

---

### GET /api/v1/profiles/:username

Get public candidate profile by username.

**Authentication**: Optional (affects privacy filtering)
**Rate Limit**: Standard API limit

**Parameters**:

- `username` (path): Username of the candidate

**Privacy Behavior**:

- **Unauthenticated**: Only sees fields marked as "public"
- **Authenticated Users**: Sees "public" and "community" fields
- **Recruiters**: Sees "public", "community", and "recruiters" fields (if visibleToRecruiters is true)
- **Owner**: Sees all fields regardless of privacy settings

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "username": "johndoe",
    "accountType": "individual",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "profile": {
      "displayName": "John Doe",
      "headline": "Senior AI Engineer",
      "bio": "Passionate about AI and ML",
      "avatarUrl": "https://example.com/avatar.jpg",
      "coverImageUrl": null,
      "location": "San Francisco, CA",
      "website": "https://johndoe.com",
      "githubUrl": "https://github.com/johndoe",
      "linkedinUrl": "https://linkedin.com/in/johndoe",
      "huggingfaceUrl": null,
      "pronouns": "he/him",
      "availabilityStatus": "actively_looking",
      "yearsExperience": 5
    },
    "jobPreferences": {
      "rolesInterested": ["AI Engineer", "ML Engineer"],
      "jobTypes": ["full_time"],
      "workLocations": ["remote", "hybrid"],
      "salaryExpectationMin": 150000,
      "salaryExpectationMax": 200000,
      "visibleToRecruiters": true
    },
    "skills": [
      {
        "id": "skill-1",
        "skillName": "Python",
        "skillType": "programming",
        "proficiency": 5,
        "endorsementCount": 10
      }
    ],
    "workExperience": [
      {
        "id": "exp-1",
        "title": "Senior AI Engineer",
        "company": "AI Corp",
        "location": "San Francisco, CA",
        "employmentType": "full_time",
        "startDate": "2020-01-01",
        "endDate": null,
        "description": "Working on LLM applications",
        "techStack": {
          "languages": ["Python", "TypeScript"],
          "frameworks": ["LangChain", "FastAPI"]
        }
      }
    ],
    "education": [...],
    "portfolio": [
      {
        "id": "proj-1",
        "title": "AI Chatbot",
        "description": "An intelligent chatbot using GPT-4",
        "techStack": {...},
        "projectUrl": "https://chatbot.example.com",
        "githubUrl": "https://github.com/johndoe/chatbot",
        "isFeatured": true
      }
    ],
    "communityStats": {
      "reputation": 500,
      "reputationLevel": "expert",
      "topicsCount": 10,
      "repliesCount": 50,
      "articlesCount": 5,
      "badges": [
        {
          "id": "badge-1",
          "name": "AI Expert",
          "iconUrl": "https://example.com/badge.png",
          "badgeType": "gold",
          "earnedAt": "2024-01-10T00:00:00.000Z"
        }
      ],
      "topContributions": {
        "topTopics": [...],
        "topReplies": [...]
      }
    }
  }
}
```

**Error Responses**:

- `404 Not Found`: User not found
- `403 Forbidden`: Profile not visible to recruiters (for recruiter accounts)

---

### GET /api/v1/profiles/:username/portfolio

Get portfolio projects for a user.

**Authentication**: Optional (affects privacy filtering)
**Rate Limit**: Standard API limit

**Parameters**:

- `username` (path): Username of the candidate

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "proj-1",
      "title": "AI Chatbot Platform",
      "description": "A full-featured chatbot platform using GPT-4",
      "techStack": {
        "languages": ["Python", "TypeScript"],
        "frameworks": ["LangChain", "React"],
        "tools": ["Docker", "PostgreSQL"]
      },
      "projectUrl": "https://chatbot.example.com",
      "githubUrl": "https://github.com/johndoe/chatbot",
      "demoUrl": "https://demo.chatbot.example.com",
      "thumbnailUrl": "https://example.com/thumb.jpg",
      "screenshots": [
        "https://example.com/screen1.jpg",
        "https://example.com/screen2.jpg"
      ],
      "isFeatured": true,
      "displayOrder": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses**:

- `404 Not Found`: User not found
- `403 Forbidden`: Portfolio is not publicly accessible

## Privacy Settings

Privacy settings control who can see different sections of the candidate profile:

- **public**: Visible to everyone (including non-authenticated users)
- **community**: Visible to authenticated users only
- **recruiters**: Visible to authenticated users and recruiters (company accounts)
- **private**: Only visible to the profile owner

### Sections with Privacy Controls

- `bio`: Profile biography
- `contact`: Website, GitHub, LinkedIn, Twitter, HuggingFace URLs
- `skills`: Skills list with proficiency levels
- `workExperience`: Work history
- `education`: Educational background
- `portfolio`: Portfolio projects

## Integration with Existing Systems

### User Module Integration

The profiles module extends the existing user management system:

- **Reuses existing tables**: WorkExperience, Education, PortfolioProject, UserSkill, ProfilePrivacySetting
- **Extends Profile table**: Uses existing profile fields for basic information
- **New table**: JobPreferences for candidate-specific data

### Forum Module Integration

Community stats are pulled from the forum module:

- Reputation score and level
- Topic and reply counts
- Top-voted topics and replies
- Earned badges

### Jobs Module Integration

- `visibleToRecruiters` flag controls recruiter access
- Job preferences are used for job matching algorithms
- Recruiter role (company account) has special viewing permissions

## Usage Examples

### TypeScript/JavaScript

```typescript
// Update candidate profile
const response = await fetch('/api/v1/profiles/candidate', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    headline: 'Senior AI Engineer',
    jobPreferences: {
      rolesInterested: ['AI Engineer', 'ML Engineer'],
      workLocations: ['remote'],
      salaryExpectationMin: 150000,
      salaryExpectationMax: 200000,
      visibleToRecruiters: true,
    },
  }),
});

const data = await response.json();
console.log(data.data.jobPreferences);

// Get public profile
const profileResponse = await fetch('/api/v1/profiles/johndoe');
const profileData = await profileResponse.json();
console.log(profileData.data.communityStats);

// Get portfolio
const portfolioResponse = await fetch('/api/v1/profiles/johndoe/portfolio');
const portfolioData = await portfolioResponse.json();
console.log(portfolioData.data);
```

## Testing

Run tests with:

```bash
# Unit tests
npm test -- profiles.service.test.ts

# Integration tests
npm test -- profiles.integration.test.ts

# All profile tests
npm test -- profiles
```

## Migration

To apply the database schema changes:

```bash
cd backend
npx prisma migrate dev --name add_job_preferences
npx prisma generate
```

## Notes

- Job preferences are optional - users can have a profile without job preferences
- Privacy settings default to "public" if not explicitly set
- Recruiter access is determined by `UserRole.company` or `AccountType.company`
- Community stats are cached and updated periodically for performance
- Portfolio projects are ordered by: featured status → display order → creation date

## Future Enhancements

- [ ] Resume/CV upload and parsing
- [ ] Video introduction support
- [ ] Availability calendar
- [ ] Salary insights based on skills and location
- [ ] Profile completeness score
- [ ] Profile views analytics
- [ ] Recruiter message templates
- [ ] Job application tracking from profile
