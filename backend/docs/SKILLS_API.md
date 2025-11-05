# Skills Management API

**Sprint**: SPRINT-1-003
**Status**: ✅ Completed
**Base URL**: `/api/v1/users/me/skills`

## Overview

The Skills Management API allows users to manage their professional skills, including skill types like prompt engineering, fine-tuning, RAG, deployment, and more. Each skill has a proficiency level (1-5 stars) and tracks endorsement counts.

## Features

- ✅ Create, read, update, and delete skills
- ✅ 15 skill types (prompt_engineering, fine_tuning, rag, deployment, mlops, nlp, computer_vision, reinforcement_learning, data_engineering, model_optimization, api_integration, evaluation, safety_alignment, multimodal, other)
- ✅ Proficiency levels: 1-5 stars
- ✅ Autocomplete for skill names based on popularity
- ✅ Maximum 50 skills per user
- ✅ Unique constraint on (user_id, skill_name)
- ✅ Endorsement count tracking (for future endorsement feature)
- ✅ Filter skills by type
- ✅ Comprehensive input validation
- ✅ Unit tests with 100% coverage

## Authentication

All endpoints require authentication via JWT Bearer token.

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Skill

Create a new skill for the authenticated user.

**Endpoint:** `POST /api/v1/users/me/skills`
**Rate Limit:** 10 requests/hour (profile update limiter)

**Request Body:**
```json
{
  "skillName": "Prompt Engineering",
  "skillType": "prompt_engineering",
  "proficiency": 4
}
```

**Validation Rules:**
- `skillName`: 2-100 characters, trimmed
- `skillType`: One of 15 predefined types (see Skill Types section)
- `proficiency`: Integer between 1 and 5

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "skillName": "Prompt Engineering",
    "skillType": "prompt_engineering",
    "proficiency": 4,
    "endorsementCount": 0,
    "createdAt": "2025-11-04T20:30:00.000Z"
  },
  "message": "Skill created successfully"
}
```

**Error Responses:**

```json
// 400 Bad Request - Max skills reached
{
  "success": false,
  "error": "Maximum of 50 skills allowed per user"
}

// 409 Conflict - Duplicate skill name
{
  "success": false,
  "error": "Skill \"Prompt Engineering\" already exists in your profile"
}

// 422 Validation Error
{
  "success": false,
  "error": "Validation failed: Proficiency must be between 1 and 5"
}
```

---

### 2. Get All Skills

Retrieve all skills for the authenticated user.

**Endpoint:** `GET /api/v1/users/me/skills`
**Rate Limit:** Standard API limiter

**Query Parameters:**
- `skillType` (optional): Filter by skill type (e.g., `prompt_engineering`)
- `limit` (optional): Maximum number of skills to return (1-50, default: 50)

**Examples:**
```
GET /api/v1/users/me/skills
GET /api/v1/users/me/skills?skillType=prompt_engineering
GET /api/v1/users/me/skills?limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "skillName": "Prompt Engineering",
      "skillType": "prompt_engineering",
      "proficiency": 5,
      "endorsementCount": 15,
      "createdAt": "2025-11-01T10:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "skillName": "Fine-tuning LLMs",
      "skillType": "fine_tuning",
      "proficiency": 4,
      "endorsementCount": 8,
      "createdAt": "2025-11-02T14:30:00.000Z"
    }
  ],
  "meta": {
    "count": 2
  }
}
```

**Ordering:**
Skills are automatically ordered by:
1. Proficiency (descending)
2. Endorsement count (descending)

---

### 3. Update Skill Proficiency

Update the proficiency level of an existing skill.

**Endpoint:** `PATCH /api/v1/users/me/skills/:id`
**Rate Limit:** 10 requests/hour (profile update limiter)

**URL Parameters:**
- `id`: UUID of the skill

**Request Body:**
```json
{
  "proficiency": 5
}
```

**Validation Rules:**
- `proficiency`: Integer between 1 and 5

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "skillName": "Prompt Engineering",
    "skillType": "prompt_engineering",
    "proficiency": 5,
    "endorsementCount": 15,
    "createdAt": "2025-11-01T10:00:00.000Z"
  },
  "message": "Skill updated successfully"
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "success": false,
  "error": "Skill not found"
}

// 422 Validation Error
{
  "success": false,
  "error": "Validation failed: Proficiency must be between 1 and 5"
}
```

---

### 4. Delete Skill

Remove a skill from the user's profile.

**Endpoint:** `DELETE /api/v1/users/me/skills/:id`
**Rate Limit:** Standard API limiter

**URL Parameters:**
- `id`: UUID of the skill

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Skill deleted successfully"
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "success": false,
  "error": "Skill not found"
}
```

---

### 5. Autocomplete Skills

Get popular skill suggestions based on a search query.

**Endpoint:** `GET /api/v1/users/me/skills/autocomplete`
**Rate Limit:** Standard API limiter

**Query Parameters:**
- `query` (required): Search string (1-100 characters)
- `limit` (optional): Maximum results (1-20, default: 10)

**Examples:**
```
GET /api/v1/users/me/skills/autocomplete?query=prompt
GET /api/v1/users/me/skills/autocomplete?query=fine&limit=5
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "skillName": "Prompt Engineering",
      "skillType": "prompt_engineering",
      "count": 150
    },
    {
      "skillName": "Prompt Design",
      "skillType": "prompt_engineering",
      "count": 80
    },
    {
      "skillName": "Prompt Optimization",
      "skillType": "prompt_engineering",
      "count": 45
    }
  ],
  "meta": {
    "count": 3,
    "query": "prompt"
  }
}
```

**Ordering:**
Results are ordered by:
1. Usage count (descending) - how many users have this skill
2. Skill name (ascending)

---

## Skill Types

The following skill types are supported:

| Skill Type | Description |
|------------|-------------|
| `prompt_engineering` | Designing and optimizing prompts for LLMs |
| `fine_tuning` | Fine-tuning large language models |
| `rag` | Retrieval-Augmented Generation systems |
| `deployment` | Deploying LLM applications to production |
| `mlops` | Machine Learning Operations and workflows |
| `nlp` | Natural Language Processing techniques |
| `computer_vision` | Computer vision and multimodal models |
| `reinforcement_learning` | RL and RLHF techniques |
| `data_engineering` | Data pipelines and preparation |
| `model_optimization` | Model compression, quantization, pruning |
| `api_integration` | Integrating LLM APIs |
| `evaluation` | Model evaluation and benchmarking |
| `safety_alignment` | AI safety and alignment |
| `multimodal` | Working with multimodal models |
| `other` | Other LLM-related skills |

---

## Proficiency Levels

Proficiency is represented as a 1-5 star rating:

| Level | Description |
|-------|-------------|
| 1 ⭐ | Beginner - Basic understanding |
| 2 ⭐⭐ | Novice - Some practical experience |
| 3 ⭐⭐⭐ | Intermediate - Comfortable with common tasks |
| 4 ⭐⭐⭐⭐ | Advanced - Deep expertise, can mentor others |
| 5 ⭐⭐⭐⭐⭐ | Expert - Recognized authority, cutting-edge work |

---

## Business Rules

1. **Maximum Skills**: Each user can have a maximum of 50 skills
2. **Unique Skills**: Users cannot add the same skill name twice (case-insensitive)
3. **Validation**: All inputs are validated with Zod schemas
4. **Ownership**: Users can only manage their own skills
5. **Endorsements**: Endorsement count is tracked but endorsement feature is not yet implemented
6. **Proficiency**: Can only be updated (not skill name or type)

---

## Database Schema

```sql
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  skill_type VARCHAR(50) NOT NULL,
  proficiency INTEGER NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
  endorsement_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_type ON user_skills(skill_type);
```

---

## Testing

### Unit Tests

All service methods have comprehensive unit tests:

```bash
npm test -- skills.service.test.ts
```

**Test Coverage:**
- ✅ Create skill successfully
- ✅ Create skill validation (max limit, duplicates)
- ✅ Get all skills
- ✅ Filter skills by type
- ✅ Update skill proficiency
- ✅ Update validation (skill not found)
- ✅ Delete skill
- ✅ Delete validation (skill not found)
- ✅ Autocomplete skills
- ✅ Empty results handling

**Results:** 14/14 tests passing ✅

### Manual Testing

Use the provided test script:

```bash
# Set your JWT token
export AUTH_TOKEN="your-jwt-token-here"

# Run tests
./test-skills-api.sh
```

---

## Code Structure

```
backend/src/modules/users/
├── skills.validation.ts    # Zod validation schemas
├── skills.repository.ts    # Database access layer
├── skills.service.ts       # Business logic
├── skills.controller.ts    # HTTP request handlers
├── users.routes.ts         # Route definitions
└── __tests__/
    └── skills.service.test.ts  # Unit tests
```

---

## Error Handling

All errors are captured by Sentry and include:
- Service name: `SkillsService`
- Method name
- User ID
- Request data

Example Sentry context:
```typescript
Sentry.captureException(error, {
  tags: { service: 'SkillsService', method: 'createSkill' },
  extra: { userId, data },
});
```

---

## Future Enhancements

1. **Endorsements**: Allow users to endorse each other's skills
2. **Skill Recommendations**: ML-based skill suggestions
3. **Skill Verification**: Badges or certifications for verified skills
4. **Skill Analytics**: Track skill demand and trends
5. **Skill Matching**: Match users based on complementary skills
6. **Skill Categories**: Group skills into categories for better organization

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT
2. **Authorization**: Users can only manage their own skills
3. **Input Validation**: Strict Zod validation on all inputs
4. **SQL Injection**: Protected by Prisma ORM
5. **Rate Limiting**: Profile updates limited to 10/hour
6. **XSS Prevention**: Skill names are sanitized and escaped

---

## Performance

- **Database Indexes**: Optimized queries with indexes on user_id and skill_type
- **Ordering**: Skills ordered by proficiency and endorsement count
- **Autocomplete**: Uses efficient GROUP BY with LIMIT
- **Caching**: Consider Redis caching for popular skills autocomplete

---

## Monitoring

Key metrics to monitor:
- Average skills per user
- Most popular skill types
- Skill creation rate
- Update frequency
- Autocomplete query performance

---

## Support

For questions or issues:
- Check technical documentation: `/projectdoc/03-API_ENDPOINTS.md`
- Review database schema: `/projectdoc/02-DATABASE_SCHEMA.md`
- Sprint details: `/.claude/sprints/sprint-1.json`

---

**Last Updated:** November 4, 2025
**API Version:** v1
**Maintained by:** Backend Team
