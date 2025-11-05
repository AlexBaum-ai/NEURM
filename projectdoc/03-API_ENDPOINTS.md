# Neurmatic - API Endpoints

**Version**: 2.0
**Base URL**: `/api/v1`
**Authentication**: JWT Bearer Token
**Content-Type**: `application/json`

---

## Table of Contents

1. [Authentication & Users](#1-authentication--users)
2. [News Module](#2-news-module)
3. [Forum Module](#3-forum-module)
4. [Jobs Module](#4-jobs-module)
5. [LLM Guide](#5-llm-guide)
6. [Platform-Wide](#6-platform-wide)
7. [Admin & Moderation](#7-admin--moderation)

---

## API Conventions

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common HTTP Status Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (duplicate)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Pagination

Query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `cursor` - Cursor for cursor-based pagination (alternative to page)

### Filtering & Sorting

- `filter[field]` - Filter by field value
- `sort` - Sort field (prefix with `-` for descending, e.g., `-created_at`)
- `search` - Full-text search query

### Rate Limiting

Rate limits are enforced per user/IP:
- Headers returned:
  - `X-RateLimit-Limit` - Total requests allowed
  - `X-RateLimit-Remaining` - Requests remaining
  - `X-RateLimit-Reset` - Reset timestamp

---

## 1. Authentication & Users

### 1.1 Authentication

#### POST /auth/register
Register a new user account.

**Auth**: None

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "accountType": "individual"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "emailVerified": false,
      "role": "user"
    },
    "message": "Registration successful. Please check your email to verify your account."
  }
}
```

**Validations**:
- Email: valid format, unique
- Password: min 8 chars, 1 uppercase, 1 number, 1 special char
- Username: 3-50 chars, alphanumeric + underscore, unique
- Account type: 'individual' or 'company'

**Rate Limit**: 5 requests per hour per IP

---

#### POST /auth/login
Login with email/password.

**Auth**: None

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "user",
      "emailVerified": true
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "refresh_token",
    "expiresIn": 900
  }
}
```

**Rate Limit**: 5 attempts per 15 minutes per IP (CAPTCHA after 3 failed attempts)

---

#### POST /auth/oauth/{provider}
OAuth login (Google, LinkedIn, GitHub).

**Auth**: None

**Path Parameters**:
- `provider`: google | linkedin | github

**Request Body**:
```json
{
  "code": "oauth_authorization_code",
  "redirectUri": "https://neurmatic.com/auth/callback"
}
```

**Response** (200): Same as /auth/login

---

#### POST /auth/logout
Logout current session.

**Auth**: Required

**Response** (204): No content

---

#### POST /auth/refresh
Refresh access token.

**Auth**: Refresh token in cookie or body

**Request Body**:
```json
{
  "refreshToken": "refresh_token"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "expiresIn": 900
  }
}
```

---

#### POST /auth/forgot-password
Request password reset.

**Auth**: None

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset email sent if account exists."
}
```

**Rate Limit**: 3 requests per hour per email

---

#### POST /auth/reset-password
Reset password with token.

**Auth**: None

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset successfully."
}
```

---

#### POST /auth/verify-email
Verify email address.

**Auth**: None

**Request Body**:
```json
{
  "token": "verification_token_from_email"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Email verified successfully."
}
```

---

#### POST /auth/resend-verification
Resend verification email.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "message": "Verification email sent."
}
```

---

#### POST /auth/2fa/setup
Setup 2FA (TOTP).

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "secret": "base32_secret",
    "qrCode": "data:image/png;base64,...",
    "backupCodes": ["code1", "code2", ...]
  }
}
```

---

#### POST /auth/2fa/verify
Verify 2FA token.

**Auth**: Required

**Request Body**:
```json
{
  "token": "123456"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "2FA enabled successfully."
}
```

---

#### POST /auth/2fa/disable
Disable 2FA.

**Auth**: Required

**Request Body**:
```json
{
  "password": "current_password",
  "token": "123456"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "2FA disabled."
}
```

---

### 1.2 User Profile

#### GET /users/me
Get current user profile.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "accountType": "individual",
    "profile": {
      "displayName": "John Doe",
      "headline": "LLM Engineer",
      "bio": "Passionate about AI...",
      "avatarUrl": "https://...",
      "location": "Amsterdam, Netherlands",
      "website": "https://johndoe.com",
      "availabilityStatus": "open"
    },
    "stats": {
      "reputation": 1250,
      "level": "Expert",
      "topicsCreated": 45,
      "repliesPosted": 230,
      "acceptedAnswers": 12
    },
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

---

#### GET /users/:username
Get user public profile.

**Auth**: Optional (affects visibility based on privacy settings)

**Path Parameters**:
- `username`: User's username

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "profile": {
      "displayName": "John Doe",
      "headline": "LLM Engineer",
      "bio": "...",
      "avatarUrl": "...",
      "location": "Amsterdam",
      "website": "https://johndoe.com"
    },
    "skills": [
      {
        "name": "Prompt Engineering",
        "type": "prompt_engineering",
        "proficiency": 5,
        "endorsementCount": 23
      }
    ],
    "models": [
      {
        "model": {
          "id": "uuid",
          "name": "GPT-4",
          "slug": "gpt-4"
        },
        "proficiency": 5
      }
    ],
    "workExperiences": [...],
    "education": [...],
    "portfolio": [...],
    "stats": {
      "reputation": 1250,
      "level": "Expert",
      "badges": 15
    },
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

**Privacy**: Respects user's privacy settings per section

---

#### PATCH /users/me
Update current user profile.

**Auth**: Required

**Request Body** (partial update):
```json
{
  "profile": {
    "displayName": "John Doe",
    "headline": "Senior LLM Engineer",
    "bio": "Updated bio...",
    "location": "Amsterdam, Netherlands",
    "availabilityStatus": "actively_looking"
  }
}
```

**Response** (200): Updated user object

**Rate Limit**: 10 updates per hour

---

#### POST /users/me/avatar
Upload profile avatar.

**Auth**: Required

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file`: Image file (max 2MB, jpg/png)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.neurmatic.com/avatars/uuid.jpg"
  }
}
```

---

#### POST /users/me/skills
Add skill to profile.

**Auth**: Required

**Request Body**:
```json
{
  "skillName": "Prompt Engineering",
  "skillType": "prompt_engineering",
  "proficiency": 5
}
```

**Response** (201): Created skill object

---

#### DELETE /users/me/skills/:skillId
Remove skill from profile.

**Auth**: Required

**Response** (204): No content

---

#### POST /users/me/work-experience
Add work experience.

**Auth**: Required

**Request Body**:
```json
{
  "title": "Senior LLM Engineer",
  "company": "AI Startup Inc",
  "employmentType": "full_time",
  "location": "Amsterdam",
  "startDate": "2023-06-01",
  "endDate": null,
  "description": "Building LLM applications...",
  "techStack": {
    "llms": ["GPT-4", "Claude"],
    "frameworks": ["LangChain"],
    "languages": ["Python", "TypeScript"]
  }
}
```

**Response** (201): Created work experience object

---

#### PUT /users/me/work-experience/:id
Update work experience.

**Auth**: Required

**Response** (200): Updated work experience object

---

#### DELETE /users/me/work-experience/:id
Delete work experience.

**Auth**: Required

**Response** (204): No content

---

#### POST /users/me/portfolio
Add portfolio project.

**Auth**: Required

**Request Body**:
```json
{
  "title": "AI Chatbot Platform",
  "description": "Built a custom chatbot platform...",
  "techStack": {
    "llms": ["GPT-4"],
    "frameworks": ["LangChain"],
    "languages": ["Python", "React"]
  },
  "projectUrl": "https://...",
  "githubUrl": "https://github.com/...",
  "thumbnailUrl": "https://...",
  "isFeatured": true
}
```

**Response** (201): Created portfolio project

**Constraint**: Max 5 featured projects

---

#### GET /users/me/privacy
Get privacy settings.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "settings": [
      {
        "section": "work_experience",
        "visibility": "public"
      },
      {
        "section": "education",
        "visibility": "community"
      },
      {
        "section": "salary_expectations",
        "visibility": "recruiters"
      }
    ]
  }
}
```

**Visibility Options**: public | community | recruiters | private

---

#### PATCH /users/me/privacy
Update privacy settings.

**Auth**: Required

**Request Body**:
```json
{
  "settings": [
    {
      "section": "work_experience",
      "visibility": "public"
    }
  ]
}
```

**Response** (200): Updated privacy settings

---

#### GET /users/me/sessions
Get active sessions.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "lastActiveAt": "2025-11-04T10:00:00Z",
        "expiresAt": "2025-12-04T10:00:00Z",
        "isCurrent": true
      }
    ]
  }
}
```

---

#### DELETE /users/me/sessions/:sessionId
Revoke a session.

**Auth**: Required

**Response** (204): No content

---

#### DELETE /users/me
Delete account (GDPR).

**Auth**: Required

**Request Body**:
```json
{
  "password": "current_password",
  "confirmation": "DELETE"
}
```

**Response** (204): No content

**Effect**: Soft delete, anonymize content, schedule hard delete after 30 days

---

#### GET /users/me/data-export
Request data export (GDPR).

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "message": "Data export will be emailed to you within 24 hours."
}
```

**Rate Limit**: 1 request per 24 hours

---

### 1.3 User Reputation & Badges

#### GET /users/:username/reputation
Get user reputation breakdown.

**Auth**: Optional

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalPoints": 1250,
    "level": "Expert",
    "rank": 142,
    "recentEvents": [
      {
        "eventType": "upvote_received",
        "points": 10,
        "description": "Your answer was upvoted",
        "createdAt": "2025-11-03T15:30:00Z"
      }
    ]
  }
}
```

---

#### GET /users/:username/badges
Get user badges.

**Auth**: Optional

**Response** (200):
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "uuid",
        "name": "Prompt Master",
        "slug": "prompt-master",
        "description": "Earned 50+ upvotes on prompt engineering answers",
        "badgeType": "skill",
        "iconUrl": "https://...",
        "awardedAt": "2025-10-15T10:00:00Z"
      }
    ]
  }
}
```

---

### 1.4 Following System

#### POST /users/:username/follow
Follow a user.

**Auth**: Required

**Response** (201):
```json
{
  "success": true,
  "message": "Now following @johndoe"
}
```

---

#### DELETE /users/:username/follow
Unfollow a user.

**Auth**: Required

**Response** (204): No content

---

#### GET /users/:username/followers
Get user's followers.

**Auth**: Optional

**Query Parameters**:
- `page`, `limit`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "followers": [
      {
        "id": "uuid",
        "username": "janedoe",
        "displayName": "Jane Doe",
        "avatarUrl": "...",
        "headline": "AI Researcher",
        "followedAt": "2025-10-01T10:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### GET /users/:username/following
Get users they follow.

**Auth**: Optional

**Response** (200): Same structure as followers

---

## 2. News Module

### 2.1 Articles

#### GET /news/articles
List news articles (with filtering).

**Auth**: Optional (affects personalization)

**Query Parameters**:
- `page`, `limit`
- `category` - Category slug
- `tag` - Tag slug (can use multiple)
- `difficulty` - beginner | intermediate | advanced
- `model` - LLM model slug
- `search` - Full-text search query
- `sort` - relevance | -published_at | -view_count | -bookmark_count
- `featured` - true (featured articles only)
- `trending` - true (trending articles only)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "uuid",
        "title": "GPT-4 Turbo Released with 128K Context",
        "slug": "gpt-4-turbo-released-128k-context",
        "summary": "OpenAI announces GPT-4 Turbo...",
        "featuredImageUrl": "https://...",
        "category": {
          "id": "uuid",
          "name": "Model Updates",
          "slug": "model-updates"
        },
        "tags": [
          {"name": "GPT-4", "slug": "gpt-4"},
          {"name": "OpenAI", "slug": "openai"}
        ],
        "author": {
          "username": "admin",
          "displayName": "Neurmatic Team",
          "avatarUrl": "..."
        },
        "readingTimeMinutes": 5,
        "viewCount": 1523,
        "bookmarkCount": 87,
        "isFeatured": true,
        "isTrending": false,
        "publishedAt": "2025-11-04T09:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### GET /news/articles/:slug
Get article detail.

**Auth**: Optional

**Path Parameters**:
- `slug`: Article slug

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "GPT-4 Turbo Released with 128K Context",
    "slug": "gpt-4-turbo-released-128k-context",
    "summary": "OpenAI announces...",
    "content": "Full article content in HTML/Markdown...",
    "contentFormat": "markdown",
    "featuredImageUrl": "https://...",
    "category": { ... },
    "tags": [ ... ],
    "models": [
      {
        "id": "uuid",
        "name": "GPT-4 Turbo",
        "slug": "gpt-4-turbo",
        "isPrimary": true
      }
    ],
    "author": { ... },
    "sourceUrl": "https://openai.com/...",
    "difficultyLevel": "intermediate",
    "readingTimeMinutes": 5,
    "viewCount": 1523,
    "bookmarkCount": 87,
    "shareCount": 34,
    "relatedArticles": [ ... ],
    "publishedAt": "2025-11-04T09:00:00Z",
    "updatedAt": "2025-11-04T09:30:00Z"
  }
}
```

**Side Effect**: Increments view count, tracks analytics event

---

#### GET /news/categories
List news categories.

**Auth**: None

**Response** (200):
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Model Updates",
        "slug": "model-updates",
        "description": "Latest LLM model releases and updates",
        "icon": "rocket",
        "level": 1,
        "articleCount": 45,
        "children": [
          {
            "id": "uuid",
            "name": "GPT Models",
            "slug": "gpt-models",
            "level": 2,
            "articleCount": 12
          }
        ]
      }
    ]
  }
}
```

---

#### GET /news/tags
List news tags (with search).

**Auth**: None

**Query Parameters**:
- `search` - Tag name search (autocomplete)
- `limit` - Default 20

**Response** (200):
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": "uuid",
        "name": "GPT-4",
        "slug": "gpt-4",
        "usageCount": 87
      }
    ]
  }
}
```

---

### 2.2 Bookmarks

#### POST /news/articles/:slug/bookmark
Bookmark an article.

**Auth**: Required

**Request Body** (optional):
```json
{
  "collectionId": "uuid",
  "notes": "Read this later"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "article": { ... },
    "collection": { ... },
    "notes": "Read this later",
    "createdAt": "2025-11-04T10:00:00Z"
  }
}
```

**Constraint**: Max 500 bookmarks per user

---

#### DELETE /news/articles/:slug/bookmark
Remove bookmark.

**Auth**: Required

**Response** (204): No content

---

#### GET /users/me/bookmarks
Get user's bookmarks.

**Auth**: Required

**Query Parameters**:
- `page`, `limit`
- `collectionId` - Filter by collection

**Response** (200):
```json
{
  "success": true,
  "data": {
    "bookmarks": [
      {
        "id": "uuid",
        "article": {
          "id": "uuid",
          "title": "...",
          "slug": "...",
          "summary": "...",
          "featuredImageUrl": "..."
        },
        "collection": {
          "id": "uuid",
          "name": "AI Research"
        },
        "notes": "...",
        "createdAt": "2025-11-03T10:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### POST /users/me/bookmark-collections
Create bookmark collection.

**Auth**: Required

**Request Body**:
```json
{
  "name": "AI Research",
  "description": "Articles about AI research",
  "isPublic": false
}
```

**Response** (201): Created collection object

---

#### GET /users/me/bookmark-collections
Get user's collections.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "id": "uuid",
        "name": "AI Research",
        "description": "...",
        "isPublic": false,
        "isDefault": false,
        "bookmarkCount": 12,
        "createdAt": "2025-10-01T10:00:00Z"
      }
    ]
  }
}
```

---

#### PATCH /users/me/bookmark-collections/:id
Update collection.

**Auth**: Required

**Response** (200): Updated collection object

---

#### DELETE /users/me/bookmark-collections/:id
Delete collection.

**Auth**: Required

**Response** (204): No content

**Effect**: Bookmarks moved to default "Read Later" collection

---

### 2.3 Model Tracker Pages

#### GET /news/models/:slug
Get model tracker page.

**Auth**: Optional

**Path Parameters**:
- `slug`: Model slug (e.g., "gpt-4")

**Response** (200):
```json
{
  "success": true,
  "data": {
    "model": {
      "id": "uuid",
      "name": "GPT-4 Turbo",
      "slug": "gpt-4-turbo",
      "provider": "OpenAI",
      "category": "commercial",
      "description": "Most capable GPT-4 model...",
      "contextWindow": 128000,
      "modelSize": null,
      "modalities": ["text", "image"],
      "releaseDate": "2023-11-06",
      "latestVersion": "gpt-4-turbo-2024-04-09",
      "status": "active",
      "pricingInput": 10.00,
      "pricingOutput": 30.00,
      "officialUrl": "https://...",
      "apiDocsUrl": "https://...",
      "logoUrl": "...",
      "bestFor": ["Complex reasoning", "Code generation", "Vision tasks"],
      "notIdealFor": ["Real-time applications", "Budget-constrained projects"],
      "benchmarks": {
        "MMLU": 86.4,
        "HumanEval": 87.2
      }
    },
    "stats": {
      "articleCount": 45,
      "jobCount": 128,
      "forumTopicCount": 234
    },
    "recentArticles": [ ... ],
    "relatedJobs": [ ... ]
  }
}
```

---

## 3. Forum Module

### 3.1 Categories

#### GET /forum/categories
List forum categories.

**Auth**: None

**Response** (200):
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "General Discussion",
        "slug": "general-discussion",
        "description": "General LLM discussions",
        "icon": "chat",
        "level": 1,
        "topicCount": 523,
        "postCount": 3421,
        "lastActivityAt": "2025-11-04T09:45:00Z",
        "children": [
          {
            "id": "uuid",
            "name": "Getting Started",
            "slug": "getting-started",
            "level": 2,
            "topicCount": 156,
            "postCount": 892
          }
        ]
      }
    ]
  }
}
```

---

### 3.2 Topics

#### GET /forum/topics
List forum topics.

**Auth**: Optional

**Query Parameters**:
- `page`, `limit`
- `category` - Category slug
- `tag` - Tag slug (multiple allowed)
- `type` - question | discussion | showcase | tutorial | announcement | paper
- `status` - open | closed | locked
- `solved` - true (only solved questions)
- `unanswered` - true (questions without accepted answer)
- `search` - Full-text search
- `sort` - -last_activity_at | -score | -created_at | -reply_count

**Response** (200):
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "uuid",
        "title": "How to implement RAG with LangChain?",
        "slug": "how-to-implement-rag-langchain",
        "topicType": "question",
        "category": {
          "id": "uuid",
          "name": "Development & Engineering",
          "slug": "development-engineering"
        },
        "tags": [
          {"name": "RAG", "slug": "rag"},
          {"name": "LangChain", "slug": "langchain"}
        ],
        "author": {
          "username": "johndoe",
          "displayName": "John Doe",
          "avatarUrl": "...",
          "reputation": 1250,
          "level": "Expert"
        },
        "isSolved": true,
        "isPinned": false,
        "status": "open",
        "viewCount": 342,
        "replyCount": 12,
        "upvoteCount": 45,
        "downvoteCount": 2,
        "score": 43,
        "lastActivityAt": "2025-11-04T08:30:00Z",
        "createdAt": "2025-11-03T14:20:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### GET /forum/topics/:slug
Get topic detail with replies.

**Auth**: Optional

**Path Parameters**:
- `slug`: Topic slug within category

**Query Parameters**:
- `sort` - score | created_at (for replies)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "How to implement RAG with LangChain?",
    "slug": "how-to-implement-rag-langchain",
    "content": "I'm trying to build a RAG system using LangChain...",
    "topicType": "question",
    "category": { ... },
    "tags": [ ... ],
    "author": { ... },
    "isSolved": true,
    "acceptedAnswer": {
      "id": "uuid",
      "content": "Here's how you implement RAG...",
      "author": { ... },
      "score": 87,
      "createdAt": "2025-11-03T15:00:00Z"
    },
    "status": "open",
    "isPinned": false,
    "viewCount": 342,
    "replyCount": 12,
    "score": 43,
    "attachments": [],
    "replies": [
      {
        "id": "uuid",
        "content": "You should start by...",
        "author": {
          "username": "janedoe",
          "displayName": "Jane Doe",
          "avatarUrl": "...",
          "reputation": 2340,
          "level": "Master"
        },
        "parentReplyId": null,
        "depthLevel": 1,
        "score": 23,
        "isAcceptedAnswer": false,
        "isHidden": false,
        "createdAt": "2025-11-03T15:00:00Z",
        "editedAt": null,
        "replies": [
          {
            "id": "uuid",
            "content": "Thanks! That worked.",
            "author": { ... },
            "parentReplyId": "uuid",
            "depthLevel": 2,
            "score": 5,
            "createdAt": "2025-11-03T16:00:00Z"
          }
        ]
      }
    ],
    "createdAt": "2025-11-03T14:20:00Z",
    "updatedAt": "2025-11-03T14:20:00Z"
  }
}
```

**Side Effect**: Increments view count

---

#### POST /forum/topics
Create new topic.

**Auth**: Required

**Request Body**:
```json
{
  "title": "How to implement RAG with LangChain?",
  "content": "I'm trying to build a RAG system...",
  "categoryId": "uuid",
  "topicType": "question",
  "tags": ["rag", "langchain"],
  "attachments": ["https://..."]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "how-to-implement-rag-langchain",
    "title": "How to implement RAG with LangChain?",
    ...
  }
}
```

**Validations**:
- Title: 10-255 chars
- Content: min 20 chars
- Tags: max 5
- Topic type: valid enum value
- Spam detection applied

**Rate Limit**: 10 topics per hour

**Side Effect**: +5 reputation points

---

#### PATCH /forum/topics/:id
Edit topic (author or moderator).

**Auth**: Required

**Request Body** (partial update):
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "tags": ["new-tag"]
}
```

**Response** (200): Updated topic object

**Constraints**:
- Author can edit within 15 minutes, or anytime if no replies
- Moderators can edit anytime
- Edit history tracked

---

#### DELETE /forum/topics/:id
Delete topic (author or moderator).

**Auth**: Required

**Response** (204): No content

**Constraints**:
- Author can delete if no replies
- Moderators can delete anytime
- Soft delete (status = 'deleted')

---

#### POST /forum/topics/:id/replies
Reply to topic.

**Auth**: Required

**Request Body**:
```json
{
  "content": "Here's how you implement RAG...",
  "parentReplyId": null,
  "attachments": []
}
```

**Response** (201): Created reply object

**Validations**:
- Content: min 10 chars
- Parent reply: must exist and depth < 3

**Side Effect**: +2 reputation points, notify topic author

---

#### PATCH /forum/replies/:id
Edit reply.

**Auth**: Required

**Response** (200): Updated reply object

**Constraints**: Edit within 15 minutes or moderator

---

#### DELETE /forum/replies/:id
Delete reply.

**Auth**: Required

**Response** (204): No content

---

#### POST /forum/topics/:id/accept-answer
Mark reply as accepted answer (question author only).

**Auth**: Required

**Request Body**:
```json
{
  "replyId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Answer accepted"
}
```

**Side Effect**: +25 reputation to answer author

---

### 3.3 Voting

#### POST /forum/topics/:id/vote
Vote on topic.

**Auth**: Required

**Request Body**:
```json
{
  "voteType": "upvote"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "voteType": "upvote",
    "score": 44
  }
}
```

**Vote Types**: upvote | downvote

**Constraints**:
- Can't vote on own content
- Downvote requires 50+ reputation
- Can change vote (toggle or switch)

**Rate Limit**: 50 votes per day

**Side Effect**: ±10 reputation to content author

---

#### POST /forum/replies/:id/vote
Vote on reply.

**Auth**: Required

**Request Body**: Same as topic vote

**Response** (200): Same as topic vote

---

### 3.4 Tags

#### GET /forum/tags
List forum tags.

**Auth**: None

**Query Parameters**:
- `search` - Tag name autocomplete
- `limit` - Default 20

**Response** (200):
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": "uuid",
        "name": "RAG",
        "slug": "rag",
        "description": "Retrieval Augmented Generation",
        "usageCount": 234
      }
    ]
  }
}
```

---

#### POST /forum/tags/:slug/follow
Follow a tag.

**Auth**: Required

**Response** (201):
```json
{
  "success": true,
  "message": "Now following #rag"
}
```

**Side Effect**: Receive notifications for new topics with this tag

---

### 3.5 Prompt Library

#### GET /forum/prompts
List community prompts.

**Auth**: Optional

**Query Parameters**:
- `page`, `limit`
- `useCase` - Use case category
- `model` - LLM slug
- `search` - Text search
- `sort` - -score | -effectiveness_rating | -created_at

**Response** (200):
```json
{
  "success": true,
  "data": {
    "prompts": [
      {
        "id": "uuid",
        "title": "Product Description Generator",
        "slug": "product-description-generator",
        "description": "Generate compelling product descriptions",
        "promptText": "You are an expert copywriter...",
        "useCase": "Marketing",
        "llmModels": ["GPT-4", "Claude"],
        "variables": {
          "product_name": "string",
          "features": "array"
        },
        "author": { ... },
        "forkedFromId": null,
        "forkCount": 23,
        "score": 156,
        "effectivenessRating": 4.7,
        "usageCount": 892,
        "isFeatured": true,
        "createdAt": "2025-10-15T10:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### GET /forum/prompts/:slug
Get prompt detail.

**Auth**: Optional

**Response** (200): Full prompt object with all fields

---

#### POST /forum/prompts
Create new prompt.

**Auth**: Required

**Request Body**:
```json
{
  "title": "Product Description Generator",
  "description": "Generate compelling product descriptions",
  "promptText": "You are an expert copywriter...",
  "useCase": "Marketing",
  "llmModels": ["gpt-4", "claude-3"],
  "variables": {
    "product_name": "string",
    "features": "array"
  }
}
```

**Response** (201): Created prompt object

---

#### POST /forum/prompts/:id/fork
Fork a prompt (create variation).

**Auth**: Required

**Request Body**:
```json
{
  "title": "Enhanced Product Description Generator",
  "promptText": "Modified prompt text..."
}
```

**Response** (201): Created forked prompt

**Side Effect**: Increment fork count on original

---

#### POST /forum/prompts/:id/vote
Vote on prompt.

**Auth**: Required

**Request Body**:
```json
{
  "voteType": "upvote"
}
```

**Response** (200): Updated vote and score

---

### 3.6 Polls

#### GET /forum/polls/:topicId
Get poll data.

**Auth**: Optional

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "question": "Which LLM do you use most?",
    "pollType": "single",
    "isAnonymous": true,
    "deadline": "2025-11-10T23:59:59Z",
    "totalVotes": 234,
    "options": [
      {
        "id": "uuid",
        "optionText": "GPT-4",
        "voteCount": 128,
        "percentage": 54.7
      },
      {
        "id": "uuid",
        "optionText": "Claude",
        "voteCount": 76,
        "percentage": 32.5
      }
    ],
    "userVote": {
      "optionIds": ["uuid"]
    },
    "createdAt": "2025-11-01T10:00:00Z"
  }
}
```

---

#### POST /forum/polls/:pollId/vote
Vote on poll.

**Auth**: Required

**Request Body**:
```json
{
  "optionIds": ["uuid"]
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Vote recorded"
}
```

**Constraints**:
- Single choice: 1 option only
- Multiple choice: 1+ options
- Can't vote after deadline
- Can't change vote (for now)

---

### 3.7 Direct Messages

#### GET /messages
List conversations.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "withUser": {
          "username": "janedoe",
          "displayName": "Jane Doe",
          "avatarUrl": "..."
        },
        "lastMessage": {
          "content": "Thanks for the help!",
          "isRead": true,
          "createdAt": "2025-11-03T15:00:00Z"
        },
        "unreadCount": 0
      }
    ]
  }
}
```

---

#### GET /messages/:username
Get message thread with user.

**Auth**: Required

**Query Parameters**:
- `page`, `limit`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "sender": {
          "username": "johndoe",
          "displayName": "John Doe",
          "avatarUrl": "..."
        },
        "recipient": {
          "username": "janedoe",
          "displayName": "Jane Doe",
          "avatarUrl": "..."
        },
        "content": "Hey, quick question about RAG...",
        "isRead": true,
        "readAt": "2025-11-03T15:05:00Z",
        "createdAt": "2025-11-03T15:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

**Side Effect**: Mark all messages as read

---

#### POST /messages/:username
Send message to user.

**Auth**: Required

**Request Body**:
```json
{
  "content": "Hey, quick question...",
  "attachments": []
}
```

**Response** (201): Created message object

**Rate Limit**: 20 messages per hour

---

## 4. Jobs Module

### 4.1 Jobs Listing

#### GET /jobs
List job postings.

**Auth**: Optional (affects match scores)

**Query Parameters**:
- `page`, `limit`
- `locationType` - remote | hybrid | on_site
- `location` - City or country
- `experienceLevel` - junior | mid | senior | lead | principal
- `employmentType` - full_time | part_time | freelance | internship
- `salaryMin`, `salaryMax` - Salary range
- `model` - LLM slug (e.g., "gpt-4")
- `framework` - Framework name
- `hasVisaSponsorship` - true
- `search` - Full-text search
- `sort` - -published_at | -match_score | salary_max

**Response** (200):
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "title": "Senior LLM Engineer",
        "slug": "senior-llm-engineer",
        "company": {
          "id": "uuid",
          "companyName": "AI Startup Inc",
          "slug": "ai-startup-inc",
          "logoUrl": "...",
          "location": "Amsterdam"
        },
        "locationType": "remote",
        "location": "Europe",
        "experienceLevel": "senior",
        "employmentType": "full_time",
        "salaryMin": 80000,
        "salaryMax": 120000,
        "salaryCurrency": "EUR",
        "salaryIsPublic": true,
        "primaryLlms": ["GPT-4", "Claude"],
        "frameworks": ["LangChain", "LlamaIndex"],
        "hasVisaSponsorship": false,
        "matchScore": 87,
        "isFeatured": false,
        "applicationCount": 23,
        "viewCount": 342,
        "publishedAt": "2025-11-01T10:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

**Note**: `matchScore` only present if user is authenticated

---

#### GET /jobs/:slug
Get job detail.

**Auth**: Optional

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior LLM Engineer",
    "slug": "senior-llm-engineer",
    "description": "We're looking for an experienced LLM engineer...",
    "requirements": "5+ years of experience...",
    "responsibilities": "Design and build LLM applications...",
    "benefits": "Competitive salary, equity, remote work...",
    "company": {
      "id": "uuid",
      "companyName": "AI Startup Inc",
      "slug": "ai-startup-inc",
      "logoUrl": "...",
      "tagline": "Building the future of AI",
      "description": "We are a fast-growing AI startup...",
      "companySize": "11-50",
      "websiteUrl": "https://..."
    },
    "locationType": "remote",
    "location": "Europe",
    "countryCode": null,
    "experienceLevel": "senior",
    "employmentType": "full_time",
    "salaryMin": 80000,
    "salaryMax": 120000,
    "salaryCurrency": "EUR",
    "salaryIsPublic": true,
    "positionsAvailable": 2,
    "applicationDeadline": "2025-12-01",
    "primaryLlms": ["GPT-4", "Claude"],
    "frameworks": ["LangChain", "LlamaIndex"],
    "vectorDatabases": ["Pinecone", "Weaviate"],
    "infrastructure": ["AWS"],
    "programmingLanguages": ["Python", "TypeScript"],
    "useCaseType": "Conversational AI",
    "modelStrategy": "hybrid",
    "hasVisaSponsorship": false,
    "skills": [
      {
        "skillName": "Prompt Engineering",
        "skillType": "prompt_engineering",
        "requiredLevel": 5,
        "isRequired": true
      },
      {
        "skillName": "RAG",
        "skillType": "rag",
        "requiredLevel": 4,
        "isRequired": true
      }
    ],
    "matchScore": 87,
    "matchReasons": [
      "Strong skills match (95%)",
      "Salary aligns with expectations",
      "Remote work preference match"
    ],
    "screeningQuestions": [
      {
        "question": "Describe your experience with RAG systems",
        "required": true
      }
    ],
    "hasApplied": false,
    "isSaved": false,
    "applicationCount": 23,
    "viewCount": 342,
    "publishedAt": "2025-11-01T10:00:00Z",
    "createdAt": "2025-10-28T10:00:00Z"
  }
}
```

**Side Effect**: Increment view count, track analytics

---

### 4.2 Job Applications

#### POST /jobs/:slug/apply
Apply to job (Easy Apply).

**Auth**: Required

**Request Body**:
```json
{
  "coverLetter": "I'm excited to apply...",
  "resumeUrl": "https://...",
  "screeningAnswers": [
    {
      "question": "Describe your experience with RAG systems",
      "answer": "I've built several RAG systems..."
    }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job": { ... },
    "status": "submitted",
    "matchScore": 87,
    "createdAt": "2025-11-04T10:00:00Z"
  },
  "message": "Application submitted successfully"
}
```

**Validations**:
- User must have complete profile
- Can't apply twice to same job
- Resume URL or profile must have work experience

**Rate Limit**: 10 applications per hour

---

#### GET /users/me/applications
Get user's applications.

**Auth**: Required

**Query Parameters**:
- `status` - submitted | viewed | screening | interview | offer | rejected | withdrawn
- `page`, `limit`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "uuid",
        "job": {
          "id": "uuid",
          "title": "Senior LLM Engineer",
          "slug": "senior-llm-engineer",
          "company": {
            "companyName": "AI Startup Inc",
            "logoUrl": "..."
          }
        },
        "status": "interview",
        "matchScore": 87,
        "statusUpdatedAt": "2025-11-03T15:00:00Z",
        "createdAt": "2025-11-01T10:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### GET /users/me/applications/:id
Get application detail.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job": { ... },
    "coverLetter": "I'm excited to apply...",
    "resumeUrl": "https://...",
    "screeningAnswers": [ ... ],
    "status": "interview",
    "statusUpdatedAt": "2025-11-03T15:00:00Z",
    "matchScore": 87,
    "matchReasons": [ ... ],
    "timeline": [
      {
        "status": "submitted",
        "timestamp": "2025-11-01T10:00:00Z"
      },
      {
        "status": "viewed",
        "timestamp": "2025-11-02T14:30:00Z"
      },
      {
        "status": "interview",
        "timestamp": "2025-11-03T15:00:00Z"
      }
    ],
    "createdAt": "2025-11-01T10:00:00Z"
  }
}
```

---

#### PATCH /users/me/applications/:id/withdraw
Withdraw application.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "message": "Application withdrawn"
}
```

---

### 4.3 Saved Jobs

#### POST /jobs/:slug/save
Save/favorite a job.

**Auth**: Required

**Request Body** (optional):
```json
{
  "notes": "Interesting role, apply next week"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Job saved"
}
```

---

#### DELETE /jobs/:slug/save
Unsave job.

**Auth**: Required

**Response** (204): No content

---

#### GET /users/me/saved-jobs
Get saved jobs.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "savedJobs": [
      {
        "id": "uuid",
        "job": { ... },
        "notes": "Interesting role",
        "createdAt": "2025-11-03T10:00:00Z"
      }
    ]
  }
}
```

---

### 4.4 Company Profiles

#### GET /companies
List companies.

**Auth**: None

**Query Parameters**:
- `page`, `limit`
- `companySize` - Company size filter
- `search` - Company name search

**Response** (200):
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "uuid",
        "companyName": "AI Startup Inc",
        "slug": "ai-startup-inc",
        "logoUrl": "...",
        "tagline": "Building the future of AI",
        "companySize": "11-50",
        "headquarters": "Amsterdam",
        "isVerified": true,
        "followerCount": 234,
        "activeJobsCount": 5
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### GET /companies/:slug
Get company profile.

**Auth**: None

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "companyName": "AI Startup Inc",
    "slug": "ai-startup-inc",
    "logoUrl": "...",
    "headerImageUrl": "...",
    "tagline": "Building the future of AI",
    "description": "We are building...",
    "missionStatement": "Our mission is...",
    "industry": "Artificial Intelligence",
    "companySize": "11-50",
    "foundedYear": 2020,
    "headquarters": "Amsterdam, Netherlands",
    "locations": ["Amsterdam", "Berlin", "Remote"],
    "websiteUrl": "https://...",
    "linkedinUrl": "https://...",
    "twitterUrl": "https://...",
    "githubUrl": "https://...",
    "techStack": {
      "llms": ["GPT-4", "Claude"],
      "frameworks": ["LangChain"],
      "languages": ["Python", "TypeScript"]
    },
    "benefits": [
      "Competitive salary",
      "Equity",
      "Remote work",
      "Flexible hours"
    ],
    "cultureImages": ["https://...", "https://..."],
    "cultureVideoUrl": "https://...",
    "isVerified": true,
    "followerCount": 234,
    "activeJobs": [
      {
        "id": "uuid",
        "title": "Senior LLM Engineer",
        "slug": "senior-llm-engineer",
        "locationType": "remote",
        "experienceLevel": "senior"
      }
    ],
    "createdAt": "2025-06-01T10:00:00Z"
  }
}
```

---

#### POST /companies/:slug/follow
Follow company.

**Auth**: Required

**Response** (201):
```json
{
  "success": true,
  "message": "Now following AI Startup Inc"
}
```

---

#### DELETE /companies/:slug/follow
Unfollow company.

**Auth**: Required

**Response** (204): No content

---

### 4.5 Company Features (Company Account)

#### POST /companies/me/jobs
Create job posting.

**Auth**: Required (Company role)

**Request Body**:
```json
{
  "title": "Senior LLM Engineer",
  "description": "We're looking for...",
  "requirements": "5+ years of experience...",
  "responsibilities": "Design and build...",
  "benefits": "Competitive salary...",
  "experienceLevel": "senior",
  "employmentType": "full_time",
  "locationType": "remote",
  "location": "Europe",
  "salaryMin": 80000,
  "salaryMax": 120000,
  "salaryCurrency": "EUR",
  "salaryIsPublic": true,
  "positionsAvailable": 2,
  "applicationDeadline": "2025-12-01",
  "primaryLlms": ["gpt-4", "claude-3"],
  "frameworks": ["langchain", "llamaindex"],
  "vectorDatabases": ["pinecone"],
  "infrastructure": ["aws"],
  "programmingLanguages": ["python", "typescript"],
  "useCaseType": "Conversational AI",
  "modelStrategy": "hybrid",
  "hasVisaSponsorship": false,
  "skills": [
    {
      "skillName": "Prompt Engineering",
      "skillType": "prompt_engineering",
      "requiredLevel": 5,
      "isRequired": true
    }
  ],
  "screeningQuestions": [
    {
      "question": "Describe your experience with RAG systems",
      "required": true
    }
  ],
  "status": "draft"
}
```

**Response** (201): Created job object

---

#### GET /companies/me/jobs
List company's job postings.

**Auth**: Required (Company role)

**Query Parameters**:
- `status` - draft | active | closed | filled

**Response** (200): List of company's jobs

---

#### PATCH /companies/me/jobs/:id
Update job posting.

**Auth**: Required (Company role)

**Response** (200): Updated job object

---

#### DELETE /companies/me/jobs/:id
Delete job posting.

**Auth**: Required (Company role)

**Response** (204): No content

---

#### POST /companies/me/jobs/:id/publish
Publish job (draft → active).

**Auth**: Required (Company role)

**Response** (200):
```json
{
  "success": true,
  "message": "Job published successfully"
}
```

**Side Effect**: Calculate matches for candidates

---

#### GET /companies/me/jobs/:id/applications
Get applications for job.

**Auth**: Required (Company role)

**Query Parameters**:
- `status` - Filter by status
- `minMatchScore` - Filter by match score
- `sort` - -match_score | -created_at

**Response** (200):
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "uuid",
        "candidate": {
          "id": "uuid",
          "username": "johndoe",
          "displayName": "John Doe",
          "avatarUrl": "...",
          "headline": "LLM Engineer",
          "location": "Amsterdam",
          "reputation": 1250,
          "level": "Expert"
        },
        "coverLetter": "I'm excited to apply...",
        "resumeUrl": "https://...",
        "screeningAnswers": [ ... ],
        "status": "submitted",
        "matchScore": 87,
        "matchReasons": [ ... ],
        "rating": null,
        "recruiterNotes": null,
        "createdAt": "2025-11-01T10:00:00Z",
        "statusUpdatedAt": "2025-11-01T10:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### GET /companies/me/jobs/:jobId/applications/:applicationId
Get application detail (ATS view).

**Auth**: Required (Company role)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "candidate": {
      "id": "uuid",
      "username": "johndoe",
      "displayName": "John Doe",
      "profile": { ... },
      "skills": [ ... ],
      "workExperiences": [ ... ],
      "education": [ ... ],
      "portfolio": [ ... ],
      "stats": {
        "reputation": 1250,
        "topicsCreated": 45,
        "acceptedAnswers": 12,
        "badges": 15
      }
    },
    "coverLetter": "...",
    "resumeUrl": "...",
    "screeningAnswers": [ ... ],
    "status": "interview",
    "matchScore": 87,
    "matchReasons": [ ... ],
    "rating": 4,
    "recruiterNotes": "Strong candidate, schedule interview",
    "timeline": [ ... ],
    "createdAt": "2025-11-01T10:00:00Z"
  }
}
```

---

#### PATCH /companies/me/jobs/:jobId/applications/:applicationId
Update application (status, notes, rating).

**Auth**: Required (Company role)

**Request Body**:
```json
{
  "status": "interview",
  "recruiterNotes": "Schedule technical interview",
  "rating": 4
}
```

**Response** (200): Updated application object

**Side Effect**: Notify candidate if status changes

---

#### GET /companies/me/analytics
Get company analytics.

**Auth**: Required (Company role)

**Query Parameters**:
- `jobId` - Filter by specific job (optional)
- `dateFrom`, `dateTo` - Date range

**Response** (200):
```json
{
  "success": true,
  "data": {
    "overview": {
      "activeJobs": 5,
      "totalApplications": 87,
      "averageMatchScore": 72.4,
      "averageTimeToHire": 18
    },
    "jobPerformance": [
      {
        "jobId": "uuid",
        "title": "Senior LLM Engineer",
        "viewCount": 342,
        "applicationCount": 23,
        "conversionRate": 6.7,
        "avgMatchScore": 78.5
      }
    ],
    "funnelData": {
      "submitted": 87,
      "viewed": 65,
      "screening": 34,
      "interview": 12,
      "offer": 3,
      "rejected": 45
    },
    "trafficSources": {
      "direct": 142,
      "search": 89,
      "referral": 56
    }
  }
}
```

---

## 5. LLM Guide

### 5.1 Models

#### GET /models
List LLM models.

**Auth**: None

**Query Parameters**:
- `category` - commercial | open_source | specialized
- `provider` - Provider name
- `search` - Model name search

**Response** (200):
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "uuid",
        "name": "GPT-4 Turbo",
        "slug": "gpt-4-turbo",
        "provider": "OpenAI",
        "category": "commercial",
        "contextWindow": 128000,
        "modalities": ["text", "image"],
        "status": "active",
        "pricingInput": 10.00,
        "pricingOutput": 30.00,
        "logoUrl": "..."
      }
    ]
  }
}
```

---

#### GET /models/:slug
Get model detail page (see News Module section 2.3)

---

#### GET /models/compare
Compare multiple models.

**Auth**: None

**Query Parameters**:
- `models` - Comma-separated model slugs (2-5 models)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "comparison": [
      {
        "model": {
          "name": "GPT-4 Turbo",
          "slug": "gpt-4-turbo",
          ...
        }
      },
      {
        "model": {
          "name": "Claude 3 Opus",
          "slug": "claude-3-opus",
          ...
        }
      }
    ]
  }
}
```

---

### 5.2 Use Cases

#### GET /use-cases
List use cases.

**Auth**: None

**Query Parameters**:
- `category` - Use case category
- `industry` - Industry filter
- `model` - LLM slug
- `implementationType` - rag | fine_tuning | agent | etc.
- `hasCode` - true
- `hasRoiData` - true
- `search` - Text search

**Response** (200):
```json
{
  "success": true,
  "data": {
    "useCases": [
      {
        "id": "uuid",
        "title": "Building a Customer Support Chatbot with RAG",
        "slug": "customer-support-chatbot-rag",
        "oneLiner": "Reduced support tickets by 40% using GPT-4 + RAG",
        "category": "Customer Support",
        "industry": "SaaS",
        "companySize": "51-200",
        "implementationType": "rag",
        "hasCode": true,
        "hasRoiData": true,
        "isFeatured": true,
        "viewCount": 1523,
        "publishedAt": "2025-10-15T10:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### GET /use-cases/:slug
Get use case detail.

**Auth**: None

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Building a Customer Support Chatbot with RAG",
    "slug": "customer-support-chatbot-rag",
    "oneLiner": "Reduced support tickets by 40% using GPT-4 + RAG",
    "problem": "We were receiving 500+ support tickets daily...",
    "solution": "We implemented a RAG-based chatbot...",
    "implementation": "Detailed implementation steps...",
    "results": "40% reduction in tickets, 95% accuracy...",
    "challenges": "Initial accuracy was only 70%...",
    "keyLearnings": "Chunking strategy is critical...",
    "tips": "Start with a small knowledge base...",
    "category": "Customer Support",
    "industry": "SaaS",
    "companySize": "51-200",
    "techStack": {
      "llms": ["GPT-4"],
      "frameworks": ["LangChain"],
      "vectorDb": "Pinecone"
    },
    "implementationType": "rag",
    "hasCode": true,
    "hasRoiData": true,
    "githubUrl": "https://...",
    "demoUrl": "https://...",
    "blogUrl": "https://...",
    "videoUrl": "https://...",
    "models": [
      {
        "id": "uuid",
        "name": "GPT-4",
        "slug": "gpt-4",
        "isPrimary": true
      }
    ],
    "relatedJobs": [ ... ],
    "viewCount": 1523,
    "commentCount": 23,
    "publishedAt": "2025-10-15T10:00:00Z"
  }
}
```

---

#### POST /use-cases/submit
Submit use case (community).

**Auth**: Required

**Request Body**:
```json
{
  "title": "Building a Customer Support Chatbot with RAG",
  "oneLiner": "Reduced support tickets by 40%",
  "problem": "We were receiving 500+ support tickets...",
  "solution": "We implemented...",
  "implementation": "...",
  "results": "...",
  "category": "Customer Support",
  "techStack": { ... },
  "implementationType": "rag",
  "hasCode": true,
  "hasRoiData": true
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "review"
  },
  "message": "Use case submitted for review. We'll notify you when it's published."
}
```

---

### 5.3 Glossary

#### GET /glossary
List glossary terms.

**Auth**: None

**Query Parameters**:
- `category` - models | techniques | metrics | tools
- `search` - Term search (autocomplete)
- `letter` - A-Z filter

**Response** (200):
```json
{
  "success": true,
  "data": {
    "terms": [
      {
        "id": "uuid",
        "term": "RAG",
        "slug": "rag",
        "definition": "Retrieval Augmented Generation is...",
        "examples": "Example: Building a chatbot...",
        "category": "techniques",
        "relatedTerms": ["vector-database", "embedding", "semantic-search"]
      }
    ]
  }
}
```

---

#### GET /glossary/:slug
Get term detail.

**Auth**: None

**Response** (200): Full term object

---

## 6. Platform-Wide

### 6.1 Universal Search

#### GET /search
Universal search across all content types.

**Auth**: Optional

**Query Parameters**:
- `q` - Search query (required)
- `type` - news | forum | jobs | users | companies | all (default: all)
- `page`, `limit`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "results": {
      "news": {
        "items": [ ... ],
        "totalCount": 12
      },
      "forum": {
        "items": [ ... ],
        "totalCount": 34
      },
      "jobs": {
        "items": [ ... ],
        "totalCount": 8
      },
      "users": {
        "items": [ ... ],
        "totalCount": 5
      },
      "companies": {
        "items": [ ... ],
        "totalCount": 3
      }
    },
    "query": "RAG implementation"
  }
}
```

---

#### GET /search/autocomplete
Autocomplete suggestions.

**Auth**: None

**Query Parameters**:
- `q` - Partial query
- `limit` - Default 10

**Response** (200):
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "RAG implementation",
        "type": "query",
        "count": 234
      },
      {
        "text": "RAG architecture",
        "type": "query",
        "count": 156
      },
      {
        "text": "RAG (Glossary)",
        "type": "glossary"
      }
    ]
  }
}
```

---

### 6.2 Saved Searches

#### POST /saved-searches
Save search with alerts.

**Auth**: Required

**Request Body**:
```json
{
  "name": "RAG Jobs",
  "searchType": "jobs",
  "filters": {
    "search": "RAG",
    "locationType": "remote",
    "experienceLevel": "senior"
  },
  "notificationEnabled": true,
  "notificationFrequency": "daily"
}
```

**Response** (201): Created saved search object

---

#### GET /saved-searches
Get user's saved searches.

**Auth**: Required

**Response** (200): List of saved searches

---

#### DELETE /saved-searches/:id
Delete saved search.

**Auth**: Required

**Response** (204): No content

---

### 6.3 Notifications

#### GET /notifications
Get user notifications.

**Auth**: Required

**Query Parameters**:
- `unread` - true (unread only)
- `type` - Notification type filter
- `page`, `limit`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "notificationType": "reply_on_topic",
        "title": "New reply on your topic",
        "message": "@janedoe replied to 'How to implement RAG?'",
        "linkUrl": "/forum/topics/how-to-implement-rag#reply-123",
        "isRead": false,
        "createdAt": "2025-11-04T09:30:00Z"
      }
    ],
    "unreadCount": 5
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### PATCH /notifications/:id/read
Mark notification as read.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

#### POST /notifications/mark-all-read
Mark all notifications as read.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

#### GET /notifications/preferences
Get notification preferences.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "preferences": [
      {
        "notificationType": "reply_on_topic",
        "inAppEnabled": true,
        "emailEnabled": true,
        "pushEnabled": false,
        "frequency": "real_time"
      }
    ]
  }
}
```

---

#### PATCH /notifications/preferences
Update notification preferences.

**Auth**: Required

**Request Body**:
```json
{
  "preferences": [
    {
      "notificationType": "reply_on_topic",
      "inAppEnabled": true,
      "emailEnabled": false,
      "frequency": "daily"
    }
  ]
}
```

**Response** (200): Updated preferences

---

### 6.4 Dashboard

#### GET /dashboard
Get personalized dashboard data.

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "forYou": {
      "articles": [ ... ],
      "topics": [ ... ],
      "jobs": [ ... ]
    },
    "following": {
      "recentActivity": [ ... ]
    },
    "stats": {
      "reputation": 1250,
      "unreadNotifications": 5,
      "pendingApplications": 3
    },
    "trending": {
      "articles": [ ... ],
      "topics": [ ... ],
      "tags": [ ... ]
    }
  }
}
```

---

## 7. Admin & Moderation

### 7.1 Admin Dashboard

#### GET /admin/stats
Get platform statistics.

**Auth**: Required (Admin role)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 15234,
      "active": 8923,
      "new24h": 87,
      "new7d": 432
    },
    "content": {
      "articles": 523,
      "topics": 3421,
      "jobs": 234
    },
    "engagement": {
      "dau": 3421,
      "mau": 12340
    },
    "moderation": {
      "pendingReports": 12,
      "pendingUseCases": 5
    }
  }
}
```

---

### 7.2 Content Management

#### POST /admin/articles
Create article (admin).

**Auth**: Required (Admin role)

**Request Body**: Full article data (see database schema)

**Response** (201): Created article object

---

#### GET /admin/articles
List all articles (including drafts).

**Auth**: Required (Admin role)

**Response** (200): List of articles with all statuses

---

#### PATCH /admin/articles/:id
Update article.

**Auth**: Required (Admin role)

**Response** (200): Updated article object

---

#### DELETE /admin/articles/:id
Delete article.

**Auth**: Required (Admin role)

**Response** (204): No content

---

### 7.3 User Management

#### GET /admin/users
List users (with advanced filters).

**Auth**: Required (Admin role)

**Query Parameters**:
- `role`, `status`, `search`, `page`, `limit`

**Response** (200): List of users

---

#### GET /admin/users/:id
Get user detail (admin view).

**Auth**: Required (Admin role)

**Response** (200): Full user data including private info

---

#### PATCH /admin/users/:id
Update user (change role, status).

**Auth**: Required (Admin role)

**Request Body**:
```json
{
  "role": "moderator",
  "status": "active"
}
```

**Response** (200): Updated user object

---

#### POST /admin/users/:id/suspend
Suspend user.

**Auth**: Required (Admin role)

**Request Body**:
```json
{
  "reason": "Spam violations",
  "duration": 7
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "User suspended for 7 days"
}
```

---

#### POST /admin/users/:id/ban
Ban user permanently.

**Auth**: Required (Admin role)

**Request Body**:
```json
{
  "reason": "Repeated violations"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "User banned"
}
```

---

### 7.4 Moderation

#### GET /moderation/reports
Get moderation queue.

**Auth**: Required (Moderator role)

**Query Parameters**:
- `status` - pending | reviewing | resolved | dismissed
- `reportedType` - topic | reply | user | job

**Response** (200):
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "uuid",
        "reporter": {
          "username": "janedoe"
        },
        "reportedType": "topic",
        "reportedId": "uuid",
        "reportedContent": {
          "title": "Spam topic title",
          "content": "..."
        },
        "reason": "spam",
        "description": "This is obvious spam",
        "status": "pending",
        "createdAt": "2025-11-04T09:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### PATCH /moderation/reports/:id
Resolve report.

**Auth**: Required (Moderator role)

**Request Body**:
```json
{
  "status": "resolved",
  "resolution": "Content removed, user warned",
  "action": "delete_content"
}
```

**Response** (200): Updated report object

**Side Effect**: Log moderation action, notify reporter

---

#### POST /moderation/topics/:id/lock
Lock topic (prevent replies).

**Auth**: Required (Moderator role)

**Response** (200):
```json
{
  "success": true,
  "message": "Topic locked"
}
```

---

#### POST /moderation/topics/:id/pin
Pin topic to top.

**Auth**: Required (Moderator role)

**Response** (200):
```json
{
  "success": true,
  "message": "Topic pinned"
}
```

---

### 7.5 Audit Logs

#### GET /admin/audit-logs
Get audit trail.

**Auth**: Required (Admin role)

**Query Parameters**:
- `adminId` - Filter by admin
- `action` - Action type
- `targetType` - Entity type
- `dateFrom`, `dateTo`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "admin": {
          "username": "admin_user"
        },
        "action": "user_banned",
        "targetType": "user",
        "targetId": "uuid",
        "changes": {
          "status": {
            "before": "active",
            "after": "banned"
          }
        },
        "ipAddress": "192.168.1.1",
        "createdAt": "2025-11-04T10:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_REQUIRED` | Missing or invalid token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

---

## Webhooks (Future)

For company accounts, webhook support for application events:
- `application.submitted`
- `application.withdrawn`

---

## API Versioning

- Current version: `v1`
- Version in URL: `/api/v1/...`
- Breaking changes require new version
- Deprecated endpoints supported for 6 months

---

## Related Documentation

- [Database Schema](./02-DATABASE_SCHEMA.md) - Data model behind these endpoints
- [User Workflows](./04-USER_WORKFLOWS.md) - How users interact with the API
- [Technical Decisions](./06-TECHNICAL_DECISIONS.md) - API design rationale
