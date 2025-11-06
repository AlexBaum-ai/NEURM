# Use Cases Library Backend

## Overview
The Use Cases Library is a community-driven collection of real-world LLM use cases. It allows users to submit detailed case studies of their LLM implementations, which are then reviewed by admins before being published.

## Features
- ✅ Community submission system
- ✅ Admin review workflow (pending → approved → published)
- ✅ Comprehensive filtering and search
- ✅ Featured use cases
- ✅ Related use cases recommendations
- ✅ View count tracking
- ✅ Rich content structure with code snippets, metrics, and resources
- ✅ Redis caching for performance

## Database Schema

### UseCase Model
```prisma
model UseCase {
  id                   String                      @id @default(uuid())
  slug                 String                      @unique
  title                String
  summary              String
  contentJson          Json                        // Rich content structure
  techStack            String[]                    // Technologies used
  category             UseCaseCategory             // e.g., code_generation, customer_support
  industry             UseCaseIndustry             // e.g., saas, healthcare
  implementationType   UseCaseImplementationType   // e.g., rag, fine_tuning, agent
  companySize          CompanySize?
  status               UseCaseStatus               @default(pending)
  featured             Boolean                     @default(false)
  hasCode              Boolean                     @default(false)
  hasRoiData           Boolean                     @default(false)
  viewCount            Int                         @default(0)
  commentCount         Int                         @default(0)
  authorId             String
  companyId            String?
  modelIds             String[]                    // Related LLM models
  publishedAt          DateTime?
  rejectedAt           DateTime?
  rejectionReason      String?
  createdAt            DateTime                    @default(now())
  updatedAt            DateTime                    @updatedAt

  author  User     @relation("UseCaseAuthor")
  company Company? @relation("CompanyUseCases")
}
```

### Content JSON Structure
```typescript
{
  problem: string;                    // Problem statement
  solution: string;                   // Solution overview
  architecture?: string;              // System architecture
  implementation?: string;            // Implementation details
  results: string;                    // Outcomes and results
  metrics?: Array<{                   // Performance metrics
    name: string;
    value: string;
    description?: string;
  }>;
  challenges?: string;                // Challenges faced
  learnings?: string;                 // Key learnings
  tips?: string;                      // Tips and recommendations
  resources?: Array<{                 // External resources
    title: string;
    url: string;
    type?: string;
  }>;
  codeSnippets?: Array<{              // Code examples
    title: string;
    language: string;
    code: string;
    description?: string;
  }>;
}
```

## API Endpoints

### Public Endpoints

#### List Published Use Cases
```
GET /api/v1/use-cases
Query Params:
  - category: UseCaseCategory
  - industry: UseCaseIndustry
  - implementationType: UseCaseImplementationType
  - companySize: CompanySize
  - featured: boolean
  - hasCode: boolean
  - hasRoiData: boolean
  - techStack: string (comma-separated)
  - search: string
  - sort: 'recent' | 'popular' | 'most_discussed' | 'views'
  - page: number (default: 1)
  - limit: number (default: 20, max: 100)

Response: {
  success: true,
  data: UseCase[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

#### Get Featured Use Cases
```
GET /api/v1/use-cases/featured?limit=5

Response: {
  success: true,
  data: UseCase[]
}
```

#### Get Use Case by Slug
```
GET /api/v1/use-cases/:slug

Response: {
  success: true,
  data: UseCase,
  related: UseCase[]
}
```

### Authenticated User Endpoints

#### Submit Use Case
```
POST /api/v1/use-cases/submit
Auth: Required
Rate Limit: 5 per hour

Body: {
  title: string,
  summary: string,
  content: UseCaseContent,
  techStack: string[],
  category: UseCaseCategory,
  industry: UseCaseIndustry,
  implementationType: UseCaseImplementationType,
  companySize?: CompanySize,
  companyId?: string,
  modelIds?: string[]
}

Response: {
  success: true,
  data: UseCase,
  message: "Use case submitted successfully and is pending review"
}
```

#### List My Submissions
```
GET /api/v1/use-cases/my-submissions
Auth: Required

Query Params: status, page, limit, sort

Response: {
  success: true,
  data: UseCase[],
  pagination: {...}
}
```

#### Get Use Case by ID
```
GET /api/v1/use-cases/id/:id
Auth: Required

Response: {
  success: true,
  data: UseCase
}
```

#### Update Use Case
```
PUT /api/v1/use-cases/:id
Auth: Required (author or admin)

Body: Partial<CreateUseCaseInput>

Response: {
  success: true,
  data: UseCase,
  message: "Use case updated successfully"
}
```

#### Delete Use Case
```
DELETE /api/v1/use-cases/:id
Auth: Required (author or admin)

Response: {
  success: true,
  message: "Use case deleted successfully"
}
```

### Admin Endpoints

#### List All Use Cases (All Statuses)
```
GET /api/v1/use-cases/admin/all
Auth: Required (admin)

Query Params: status, category, industry, authorId, page, limit

Response: {
  success: true,
  data: UseCase[],
  pagination: {...}
}
```

#### Review Use Case
```
PUT /api/v1/admin/use-cases/:id/review
Auth: Required (admin)

Body: {
  status: 'approved' | 'published' | 'rejected',
  rejectionReason?: string,
  featured?: boolean
}

Response: {
  success: true,
  data: UseCase,
  message: "Use case {status} successfully"
}
```

## Workflow

### Submission Workflow
1. **User submits use case** → Status: `pending`
2. **Admin reviews** → Status: `approved` or `rejected`
3. **Admin publishes** → Status: `published` (visible to public)

### Status Flow
```
pending → approved → published
pending → rejected
rejected → pending (if resubmitted)
```

### Permissions
- **Public**: View published use cases only
- **Author**: View/edit/delete own use cases (pending/rejected only)
- **Admin**: View/edit/delete all use cases, review submissions, feature use cases

## Filtering & Search

### Categories
- customer_support
- code_generation
- data_analysis
- content_creation
- research
- automation
- translation
- summarization
- classification
- extraction
- other

### Industries
- saas
- healthcare
- finance
- ecommerce
- education
- marketing
- legal
- hr
- consulting
- manufacturing
- media
- other

### Implementation Types
- rag (Retrieval-Augmented Generation)
- fine_tuning
- agent
- prompt_engineering
- embeddings
- function_calling
- multimodal
- other

### Company Sizes
- startup
- small
- medium
- large
- enterprise

### Sort Options
- **recent**: By published date (newest first)
- **popular**: By view count (highest first)
- **most_discussed**: By comment count (highest first)
- **views**: Same as popular

## Caching Strategy

### Cache Keys
- `use-case:slug:{slug}` - Individual use case (10 min TTL)
- `use-cases:list:{filters}` - List results (10 min TTL)
- `use-cases:featured` - Featured use cases (10 min TTL)

### Cache Invalidation
- On create: Invalidate list cache
- On update: Invalidate specific use case + list cache + featured cache (if featured changed)
- On review: Invalidate specific use case + list cache + featured cache
- On delete: Invalidate specific use case + list cache + featured cache

## Error Handling

### Validation Errors (422)
- Missing required fields
- Invalid enum values
- Content too short/long

### Not Found Errors (404)
- Use case doesn't exist
- Non-published use case accessed by public

### Forbidden Errors (403)
- Non-author trying to edit/delete use case
- Author trying to edit published use case

### Bad Request Errors (400)
- Invalid status transition
- Missing rejection reason when rejecting

### Conflict Errors (409)
- Slug already exists (handled automatically by incrementing)

## Rate Limiting
- Public read: 60 requests/minute
- Submission: 5 submissions/hour
- Admin write: 30 requests/minute

## Testing
Run tests:
```bash
npm test src/modules/use-cases/__tests__
```

Test coverage includes:
- ✅ Use case submission with slug generation
- ✅ Permission checks (author, admin, public)
- ✅ Review workflow
- ✅ CRUD operations
- ✅ Error handling
- ✅ Status validation

## Future Enhancements
- [ ] Comment system integration (forum-style)
- [ ] Auto-link related models and jobs
- [ ] Upvoting/downvoting system
- [ ] User collections/bookmarks for use cases
- [ ] Export use cases (PDF, Markdown)
- [ ] Use case templates
- [ ] AI-powered related use case recommendations
- [ ] Analytics dashboard for use case performance

## Related Modules
- `/models` - LLM models referenced in use cases
- `/jobs` - Jobs auto-linked to use cases
- `/forum` - Comments on use cases
- `/companies` - Companies submitting use cases
