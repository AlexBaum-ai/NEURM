# Neurmatic - Technical Decisions

**Version**: 2.0
**Purpose**: Document key architectural and technical decisions with rationale

---

## Table of Contents

1. [Architecture Decisions](#1-architecture-decisions)
2. [Technology Stack Decisions](#2-technology-stack-decisions)
3. [Database Decisions](#3-database-decisions)
4. [API Design Decisions](#4-api-design-decisions)
5. [Security Decisions](#5-security-decisions)
6. [Performance & Scalability Decisions](#6-performance--scalability-decisions)
7. [DevOps & Infrastructure Decisions](#7-devops--infrastructure-decisions)

---

## 1. Architecture Decisions

### ADR-001: Modular Monolith for MVP, Microservices for Scale

**Decision**: Start with a modular monolith architecture, design for future migration to microservices.

**Context**:
- New platform with uncertain traffic patterns
- Need fast initial development and deployment
- Want flexibility to scale specific modules independently later

**Rationale**:
- **Modular monolith advantages**:
  - Faster initial development (shared code, single deployment)
  - Easier debugging and testing
  - Lower operational complexity
  - Reduced infrastructure costs at low scale
  
- **Designed for future microservices**:
  - Clear module boundaries (news, forum, jobs)
  - Independent data access layers per module
  - Event-driven communication patterns
  - Separate deployment artifacts possible

**Implementation**:
```
Phase 1 (MVP): Modular Monolith
- Single Node.js application
- Clear module boundaries
- Shared database with logical separation

Phase 2 (Post-MVP, if needed):
- Extract high-load modules (Search, Job Matching) to separate services
- Implement API Gateway
- Event-driven inter-service communication
```

**Consequences**:
- ✅ Faster time to market
- ✅ Lower initial costs
- ✅ Simpler deployment
- ⚠️ Potential performance bottlenecks at very high scale
- ⚠️ Module coupling risk (mitigated by strict boundaries)

---

### ADR-002: Feature-Based Code Organization

**Decision**: Organize code by feature/domain rather than technical layer.

**Context**:
- Complex platform with three distinct modules
- Need maintainability and scalability
- Multiple developers will work on different features

**Rationale**:
- **Feature-based advantages**:
  - Related code lives together (easier to find and modify)
  - Clear ownership per feature team
  - Easier to extract to microservice later
  - Better encapsulation

**Structure**:
```
✅ Feature-based (chosen):
features/
  news/
    components/
    hooks/
    api/
    store/
    types/
  
❌ Layer-based (rejected):
components/
  NewsCard.tsx
  ForumCard.tsx
  JobCard.tsx
```

**Consequences**:
- ✅ Better code organization and maintainability
- ✅ Easier onboarding for new developers
- ✅ Reduced coupling between features
- ⚠️ Some code duplication (acceptable trade-off)

---

### ADR-003: REST API over GraphQL

**Decision**: Use RESTful API design, not GraphQL.

**Context**:
- Need consistent API for frontend and potential third-party integrations
- Team has more REST experience than GraphQL
- Requirements don't show complex nested data fetching patterns

**Rationale**:
- **REST advantages for this project**:
  - Simpler to implement and maintain
  - Better caching (HTTP caching, CDN)
  - Easier to rate limit per endpoint
  - Clear versioning strategy (/api/v1)
  - Smaller bundle size (no GraphQL client)
  
- **GraphQL not needed because**:
  - Data fetching patterns are relatively simple
  - Frontend uses React Query for data management
  - Can optimize with specific endpoints if needed

**Implementation**:
- RESTful conventions (GET, POST, PUT, PATCH, DELETE)
- OpenAPI/Swagger documentation
- Versioned endpoints (/api/v1/...)
- Standardized response format

**Consequences**:
- ✅ Faster development
- ✅ Better HTTP caching
- ✅ Simpler client-side code
- ⚠️ Potential over-fetching (mitigated with tailored endpoints)

---

## 2. Technology Stack Decisions

### ADR-004: React with TypeScript for Frontend

**Decision**: React 18+ with TypeScript, Vite as build tool.

**Context**:
- Need modern, performant frontend framework
- Type safety is critical for maintainability
- Large ecosystem and hiring pool important

**Rationale**:
- **React**:
  - Largest ecosystem and community
  - Excellent component reusability
  - Server-side rendering possible (future)
  - Strong TypeScript support
  - Best-in-class developer tools
  
- **TypeScript**:
  - Catch errors at compile time
  - Better IDE support (autocomplete, refactoring)
  - Shared types with backend
  - Improved maintainability
  
- **Vite over Create React App**:
  - Much faster dev server (ESbuild)
  - Faster production builds
  - Better developer experience
  - Modern tooling (native ESM)

**Alternatives Considered**:
- Vue.js: Smaller ecosystem, less hiring pool
- Next.js: Over-engineered for current needs, SSR not required yet
- Svelte: Too new, smaller ecosystem

**Consequences**:
- ✅ Strong type safety
- ✅ Excellent developer experience
- ✅ Large hiring pool
- ✅ Future-proof technology choice

---

### ADR-005: Node.js + Express for Backend

**Decision**: Node.js with Express framework, TypeScript.

**Context**:
- Need fast API development
- I/O-heavy workload (database, external APIs)
- JavaScript full-stack benefits

**Rationale**:
- **Node.js**:
  - Excellent for I/O-bound operations (forum, messaging)
  - JavaScript across full stack (code sharing, easier hiring)
  - Large ecosystem (npm)
  - Good performance for this use case
  
- **Express**:
  - Mature, battle-tested framework
  - Large middleware ecosystem
  - Simple and flexible
  - Easy to optimize or replace parts
  
- **TypeScript**:
  - Type safety on backend
  - Share types with frontend
  - Better refactoring support

**Alternatives Considered**:
- Fastify: More performant but smaller ecosystem
- NestJS: Too opinionated, steeper learning curve
- Python (Django/FastAPI): Not JavaScript full-stack, slower for I/O
- Go: Great performance but less suitable for rapid prototyping, smaller hiring pool

**Consequences**:
- ✅ Fast development
- ✅ Good performance for I/O-heavy workloads
- ✅ JavaScript full-stack benefits
- ⚠️ Not ideal for CPU-intensive tasks (use workers if needed)

---

### ADR-006: Prisma as ORM

**Decision**: Prisma for database access, not raw SQL or other ORMs.

**Context**:
- Need type-safe database access
- Complex data model with many relationships
- Want good migration tooling

**Rationale**:
- **Prisma advantages**:
  - Excellent TypeScript integration (generated types)
  - Great developer experience (Prisma Studio)
  - Automatic migrations
  - Query optimization built-in
  - Protection against SQL injection
  - Strong relation support
  
**Alternatives Considered**:
- TypeORM: Less type-safe, more complex
- Sequelize: Older, weaker TypeScript support
- Knex.js: Query builder, less type safety
- Raw SQL: No type safety, more error-prone

**Consequences**:
- ✅ Excellent type safety
- ✅ Great migrations
- ✅ Reduced SQL injection risk
- ⚠️ Vendor lock-in (acceptable, can migrate if needed)

---

## 3. Database Decisions

### ADR-007: PostgreSQL as Primary Database

**Decision**: PostgreSQL 15+ for all relational data.

**Context**:
- Complex relational data (users, forum threads, jobs)
- Need ACID guarantees
- Full-text search requirements
- JSONB support for flexible metadata

**Rationale**:
- **PostgreSQL advantages**:
  - Excellent for complex relationships (forum threads, job applications)
  - ACID compliance critical for forum voting, job applications
  - Full-text search built-in (`tsvector`)
  - JSONB for flexible job metadata
  - Mature, reliable, well-documented
  - Great Prisma support
  
- **Why not NoSQL**:
  - Complex relationships (topics → replies → votes)
  - ACID needed (voting system, transactions)
  - Schema flexibility via JSONB when needed

**Implementation**:
- Use `pg_trgm` extension for fuzzy search
- Use `uuid-ossp` for UUID generation
- Partitioning for large tables (analytics_events)
- Read replicas for scaling reads

**Alternatives Considered**:
- MySQL: Weaker full-text search, less advanced features
- MongoDB: Not suitable for complex relationships
- Hybrid (Postgres + MongoDB): Added complexity not justified

**Consequences**:
- ✅ Strong consistency and reliability
- ✅ Powerful querying and indexing
- ✅ Built-in full-text search
- ⚠️ Vertical scaling limits (mitigated with read replicas)

---

### ADR-008: Redis for Caching and Sessions

**Decision**: Redis for caching, session storage, rate limiting.

**Context**:
- Need fast caching layer
- Session management for authentication
- Rate limiting requirements
- Real-time features (leaderboards)

**Rationale**:
- **Redis advantages**:
  - In-memory speed (sub-millisecond access)
  - Rich data structures (sorted sets for leaderboards)
  - Pub/Sub for real-time features
  - TTL support for sessions and cache expiry
  - Excellent Node.js support
  
**Use Cases**:
1. Session storage (JWT refresh tokens)
2. Rate limiting (per-user, per-IP counters)
3. Caching (frequently accessed articles, user profiles)
4. Leaderboards (sorted sets)
5. Temporary data (job queue via Bull)

**Alternatives Considered**:
- Memcached: Less features, no data structures
- In-memory cache: Not shared across instances
- Database caching: Too slow for our needs

**Consequences**:
- ✅ Excellent performance
- ✅ Reduced database load
- ✅ Enables real-time features
- ⚠️ Additional infrastructure component

---

### ADR-009: Elasticsearch for Advanced Search (Post-MVP)

**Decision**: Start with PostgreSQL full-text search, add Elasticsearch in Phase 2.

**Context**:
- Need good search across articles, forum, jobs
- Want autocomplete and typo tolerance
- Cost-conscious MVP approach

**Rationale**:
- **Phase 1 (MVP): PostgreSQL**:
  - Built-in full-text search with `tsvector`
  - Good enough for MVP
  - One less infrastructure component
  - Lower costs
  
- **Phase 2: Elasticsearch**:
  - Advanced features (autocomplete, typo tolerance, faceting)
  - Better relevance ranking
  - Faster for large datasets
  - Analytics capabilities

**Migration Path**:
1. Start with PostgreSQL `tsvector` indexes
2. Monitor search performance and user feedback
3. Add Elasticsearch when search traffic grows
4. Use background jobs to sync data

**Alternatives Considered**:
- Meilisearch: Simpler but less powerful
- Algolia: SaaS, expensive at scale
- PostgreSQL only: May not scale well for complex search

**Consequences**:
- ✅ Faster MVP launch
- ✅ Lower initial costs
- ✅ Clear migration path when needed
- ⚠️ Search features limited initially (acceptable for MVP)

---

## 4. API Design Decisions

### ADR-010: JWT for Authentication

**Decision**: JWT access tokens + refresh tokens in HTTPOnly cookies.

**Context**:
- Need stateless authentication for API
- Want good security and user experience
- Mobile app support in future

**Rationale**:
- **JWT advantages**:
  - Stateless (no server-side session storage for access tokens)
  - Scalable (no session database lookups)
  - Works great with microservices
  - Industry standard
  
- **Security approach**:
  - Short-lived access tokens (15 min)
  - Long-lived refresh tokens (30 days) in HTTPOnly cookies
  - XSS protection (no localStorage for tokens)
  - CSRF protection via SameSite cookies

**Implementation**:
```typescript
// Access token (JWT, 15 min)
- Stored in memory (React state)
- Sent in Authorization: Bearer <token> header
- Contains user ID, role, permissions

// Refresh token (opaque token, 30 days)
- Stored in HTTPOnly, Secure, SameSite cookie
- Used to get new access token
- Stored in Redis with user session data
- Can be revoked (logout, security)
```

**Alternatives Considered**:
- Session-based auth: Not stateless, harder to scale
- OAuth only: Need own auth for email/password users
- Long-lived JWT: Security risk

**Consequences**:
- ✅ Scalable stateless authentication
- ✅ Good security (XSS, CSRF protection)
- ✅ Better user experience (auto-refresh)
- ⚠️ Refresh token rotation complexity (manageable)

---

### ADR-011: Standardized API Response Format

**Decision**: Consistent JSON response structure across all endpoints.

**Context**:
- Need predictable API responses
- Easier frontend error handling
- Better API documentation

**Rationale**:
**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": { ... }
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [ ... ]
  }
}
```

**Benefits**:
- Frontend can check `success` field consistently
- Pagination metadata always in same place
- Error handling standardized
- Easier to document and test

**Consequences**:
- ✅ Predictable API responses
- ✅ Easier frontend development
- ✅ Better error handling
- ⚠️ Slight response size overhead (negligible)

---

### ADR-012: Input Validation with Zod

**Decision**: Zod for runtime validation, shared between frontend and backend.

**Context**:
- Need runtime validation of user input
- Want type safety and good error messages
- Desire code sharing between frontend/backend

**Rationale**:
- **Zod advantages**:
  - TypeScript-first schema validation
  - Infer types from schemas (DRY)
  - Composable schemas
  - Great error messages
  - Can share schemas between frontend/backend
  
**Example**:
```typescript
// Shared schema
const createArticleSchema = z.object({
  title: z.string().min(10).max(255),
  content: z.string().min(20),
  categoryId: z.string().uuid(),
  tags: z.array(z.string()).max(5)
});

// Backend validation
export const createArticle = async (req, res) => {
  const data = createArticleSchema.parse(req.body);
  // ...
};

// Frontend validation (React Hook Form)
const form = useForm({
  resolver: zodResolver(createArticleSchema)
});
```

**Alternatives Considered**:
- Joi: Less TypeScript-friendly
- Yup: Older, less powerful
- express-validator: Backend only, no sharing

**Consequences**:
- ✅ Type-safe validation
- ✅ Code sharing frontend/backend
- ✅ Excellent developer experience
- ✅ Catch errors early

---

## 5. Security Decisions

### ADR-013: Multi-Layer Security Strategy

**Decision**: Defense-in-depth security approach.

**Implementation**:

**1. Input Validation**:
```
- Zod schemas for all user input
- SQL injection prevented by Prisma
- HTML sanitization (DOMPurify) for rich text
```

**2. Authentication Security**:
```
- bcrypt for password hashing (cost factor 12)
- JWT with short expiry (15 min)
- Refresh token rotation
- 2FA support (TOTP)
```

**3. Authorization**:
```
- Role-based access control (RBAC)
- Resource-based permissions (own content)
- Middleware checks per route
```

**4. Rate Limiting**:
```
- Global: 100 req/min per user
- Login: 5 attempts per 15 min
- Topic creation: 10/hour
- Voting: 50/day
```

**5. XSS Protection**:
```
- Content Security Policy headers
- HTTPOnly cookies
- HTML sanitization
- Escape output
```

**6. CSRF Protection**:
```
- SameSite cookies
- CSRF tokens for state-changing requests
```

**7. HTTPS Only**:
```
- Force HTTPS in production
- HSTS headers
- Secure cookies
```

**8. Data Privacy (GDPR)**:
```
- Granular privacy settings
- Data export functionality
- Right to deletion
- Audit logs
```

**Consequences**:
- ✅ Strong security posture
- ✅ GDPR compliance
- ✅ User trust
- ⚠️ Some added complexity (justified)

---

## 6. Performance & Scalability Decisions

### ADR-014: Database Indexing Strategy

**Decision**: Strategic indexes on frequently queried fields.

**Implementation**:
```sql
-- Primary indexes (automatic)
- Primary keys (UUID)
- Unique constraints (email, username, slugs)

-- Foreign key indexes
- All foreign key columns

-- Query optimization indexes
- created_at DESC (for chronological lists)
- status (for filtering active content)
- score DESC (for sorting by votes)
- Composite indexes (category_id, published_at)

-- Full-text search indexes
- GIN indexes on tsvector columns
```

**Rationale**:
- Faster queries (milliseconds vs seconds)
- Reduced database load
- Better user experience
- Cost-effective optimization

**Monitoring**:
- Use `EXPLAIN ANALYZE` for slow queries
- pg_stat_statements for query analysis
- Monitor index usage and remove unused indexes

**Consequences**:
- ✅ Much faster queries
- ✅ Better scalability
- ⚠️ Slightly slower writes (acceptable trade-off)
- ⚠️ More storage (negligible)

---

### ADR-015: Caching Strategy

**Decision**: Multi-level caching approach.

**Implementation**:

**Level 1: Browser Cache**:
```
- Static assets (1 year TTL)
- API responses with ETags
- Service worker for offline (PWA)
```

**Level 2: CDN Cache**:
```
- Static assets (images, JS, CSS)
- Public API responses (articles, models)
```

**Level 3: Redis Cache**:
```
- User sessions (30 days)
- Frequently accessed data (hot articles, user profiles)
- Computed values (leaderboards, stats)
- Cache invalidation on updates
```

**Level 4: Database Query Cache**:
```
- PostgreSQL query cache
- Prisma query cache
```

**Rationale**:
- Reduce database load (10x+)
- Faster response times (50ms vs 500ms)
- Lower infrastructure costs
- Better user experience

**Cache Invalidation**:
```
- Time-based expiry (TTL)
- Event-based invalidation (on update)
- Cache warming for popular content
```

**Consequences**:
- ✅ Significantly faster responses
- ✅ Reduced database load
- ✅ Lower costs at scale
- ⚠️ Cache invalidation complexity (manageable)
- ⚠️ Potential stale data (mitigated with short TTLs)

---

### ADR-016: Background Job Processing

**Decision**: Bull (Redis-based queue) for async processing.

**Context**:
- Email sending shouldn't block API responses
- Job matching calculations are expensive
- Notification sending to many users

**Use Cases**:
1. Email sending (welcome, verification, notifications)
2. Job matching calculations (on job post or profile update)
3. Analytics aggregation (daily stats)
4. Content indexing (Elasticsearch sync)
5. Scheduled tasks (daily digest emails)

**Implementation**:
```typescript
// Queue definition
const emailQueue = new Bull('email', { redis: redisConfig });

// Producer (API endpoint)
await emailQueue.add('verification-email', {
  userId: user.id,
  email: user.email
});

// Consumer (worker)
emailQueue.process('verification-email', async (job) => {
  await sendVerificationEmail(job.data);
});
```

**Rationale**:
- **Bull advantages**:
  - Redis-based (already using Redis)
  - Persistent jobs (survives restarts)
  - Retry logic built-in
  - Job progress tracking
  - Scheduled/delayed jobs
  - Good monitoring (Bull Board)

**Alternatives Considered**:
- BullMQ: Newer, not as mature
- RabbitMQ: More complex, overkill for our needs
- AWS SQS: Vendor lock-in, more expensive

**Consequences**:
- ✅ Non-blocking API responses
- ✅ Reliable async processing
- ✅ Better resource utilization
- ✅ Can scale workers independently
- ⚠️ Additional complexity (justified)

---

### ADR-017: Image Optimization Strategy

**Decision**: Multi-format, multi-size image serving via CDN.

**Implementation**:

**Upload Processing**:
```
1. User uploads image
2. Validate (type, size)
3. Generate thumbnails (150x150, 300x300, 600x600)
4. Convert to WebP (+ keep original)
5. Upload to S3
6. Return CDN URLs
```

**Serving**:
```
- Use <picture> element with multiple sources
- Serve WebP to supporting browsers
- Fallback to JPG/PNG
- Lazy loading for off-screen images
```

**Example**:
```html
<picture>
  <source srcset="image-600w.webp" type="image/webp">
  <source srcset="image-600w.jpg" type="image/jpeg">
  <img src="image-600w.jpg" loading="lazy" alt="...">
</picture>
```

**Rationale**:
- 30-50% smaller files (WebP)
- Faster page loads
- Better mobile experience
- SEO benefits

**Consequences**:
- ✅ Faster page loads (2-3x)
- ✅ Lower bandwidth costs
- ✅ Better mobile experience
- ⚠️ Upfront processing time (acceptable, async)

---

## 7. DevOps & Infrastructure Decisions

### ADR-018: Docker for Development and Deployment

**Decision**: Docker and Docker Compose for consistent environments.

**Context**:
- Need consistent development environment across team
- Simplify deployment
- Enable easy local testing of full stack

**Implementation**:

**Development**:
```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
  
  backend:
    build: ./backend
    ports: ["3000:3000"]
    depends_on: [postgres, redis]
  
  postgres:
    image: postgres:15
  
  redis:
    image: redis:7
```

**Production**:
```
- Multi-stage builds (smaller images)
- Non-root users
- Health checks
- Resource limits
```

**Rationale**:
- Consistent environments (dev = prod)
- Easy onboarding (one command to start)
- Portable across hosting providers
- Industry standard

**Consequences**:
- ✅ Consistent environments
- ✅ Easier onboarding
- ✅ Simplified deployment
- ⚠️ Slight learning curve for team

---

### ADR-019: CI/CD with GitHub Actions

**Decision**: GitHub Actions for automated testing and deployment.

**Workflow**:
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    - Run linting (ESLint)
    - Run type checking (TypeScript)
    - Run unit tests (Jest/Vitest)
    - Run integration tests
    - Upload coverage to Codecov
  
  build:
    - Build frontend
    - Build backend
    - Build Docker images
```

```yaml
# .github/workflows/cd.yml
name: CD
on:
  push:
    branches: [main]
jobs:
  deploy:
    - Run CI checks
    - Build Docker images
    - Push to registry
    - Deploy to staging
    - Run smoke tests
    - Deploy to production (manual approval)
```

**Rationale**:
- Free for public repos
- Integrated with GitHub
- Good ecosystem
- Easy to configure

**Consequences**:
- ✅ Automated quality checks
- ✅ Fast feedback on PRs
- ✅ Reliable deployments
- ✅ Reduced manual errors

---

### ADR-020: Error Tracking with Sentry

**Decision**: Sentry for error tracking and monitoring.

**Context**:
- Need to catch errors in production
- Want stack traces and user context
- Performance monitoring desired

**Implementation**:
```typescript
// Backend
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app })
  ]
});

// Frontend
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1 // 10% performance sampling
});
```

**Features Used**:
- Error tracking with stack traces
- User context (which user hit error)
- Performance monitoring (slow queries, API calls)
- Release tracking
- Alerts for new errors

**Consequences**:
- ✅ Catch errors before users report
- ✅ Fix issues faster (stack traces)
- ✅ Understand user impact
- ⚠️ Cost at scale (acceptable, paid tier)

---

## Summary of Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Modular Monolith → Microservices | Fast MVP, scale when needed |
| Frontend | React + TypeScript + Vite | Modern, type-safe, fast |
| Backend | Node.js + Express + TypeScript | JavaScript full-stack, fast I/O |
| Database | PostgreSQL | Complex relationships, ACID, full-text search |
| ORM | Prisma | Type safety, great DX |
| Cache | Redis | Fast, versatile, essential |
| Search | PostgreSQL → Elasticsearch | Start simple, scale when needed |
| Auth | JWT + Refresh Tokens | Stateless, secure, scalable |
| Validation | Zod | Type-safe, shareable |
| Jobs | Bull (Redis) | Reliable async processing |
| Hosting | Docker + Cloud (AWS/Railway) | Portable, scalable |
| CI/CD | GitHub Actions | Free, integrated |
| Monitoring | Sentry | Error tracking, performance |

---

## Decision Review Process

**When to Revisit Decisions**:
1. Significant change in requirements
2. Performance bottlenecks in production
3. New technology becomes industry standard
4. Scaling challenges emerge
5. Security vulnerabilities discovered

**How to Propose Changes**:
1. Document problem with current decision
2. Propose alternatives with pros/cons
3. Estimate migration effort and risk
4. Get team consensus
5. Update this document with new ADR

---

## Related Documentation

- [Project Overview](./01-PROJECT_OVERVIEW.md) - System architecture
- [Database Schema](./02-DATABASE_SCHEMA.md) - Data model
- [File Structure](./05-FILE_STRUCTURE.md) - Code organization
- [Development Phases](./07-DEVELOPMENT_PHASES.md) - Implementation plan
