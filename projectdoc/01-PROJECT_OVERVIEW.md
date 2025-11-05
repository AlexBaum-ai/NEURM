# Neurmatic - Project Overview

**Version**: 2.0
**Date**: November 2025
**Status**: Planning

---

## Executive Summary

Neurmatic is a comprehensive platform designed for the Large Language Model (LLM) community, integrating three core modules:

1. **News Module** - Curated LLM content with model tracking
2. **Forum Module** - Community discussions, Q&A, and knowledge sharing
3. **Jobs Module** - LLM-specialized job matching and recruitment

The platform aims to become the central hub for LLM professionals, companies, and enthusiasts by providing news, community engagement, and career opportunities in a single integrated experience.

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile Web  │  │   PWA        │      │
│  │  (React)     │  │  (Responsive)│  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / Load Balancer               │
│                    (nginx / AWS ALB)                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ News Service │    │Forum Service │    │ Jobs Service │
│              │    │              │    │              │
│ - Articles   │    │ - Topics     │    │ - Postings   │
│ - Categories │    │ - Replies    │    │ - Matching   │
│ - Bookmarks  │    │ - Voting     │    │ - Applications│
│ - Models     │    │ - Reputation │    │ - Companies  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Auth &     │    │   Search     │    │  Notification│
│   User       │    │   Service    │    │   Service    │
│   Service    │    │(Elasticsearch│    │              │
│              │    │ + PostgreSQL)│    │  - Email     │
│ - OAuth      │    │              │    │  - Push      │
│ - Sessions   │    │ - Universal  │    │  - In-App    │
│ - Profiles   │    │ - Filters    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │   Redis      │    │   S3/CDN     │
│              │    │              │    │              │
│ - Primary DB │    │ - Cache      │    │ - Media      │
│ - Full-text  │    │ - Sessions   │    │ - Images     │
│              │    │ - Rate Limit │    │ - Files      │
└──────────────┘    └──────────────┘    └──────────────┘
        │
        ▼
┌──────────────┐
│ Elasticsearch│
│              │
│ - Advanced   │
│   Search     │
│ - Analytics  │
└──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Background Jobs                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Queue      │  │  Scheduler   │  │  Workers     │      │
│  │  (Bull/BQ)   │  │  (Cron Jobs) │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  - Email sending                                             │
│  - Notification processing                                   │
│  - Job matching calculations                                 │
│  - Analytics aggregation                                     │
│  - Content recommendations                                   │
└─────────────────────────────────────────────────────────────┘
```

### Architectural Pattern

**Hybrid Modular Monolith → Microservices**

**Phase 1 (MVP)**: Modular monolith
- Single application with clear module boundaries
- Shared database with logical separation
- Faster initial development
- Easier deployment and debugging

**Phase 2 (Post-MVP)**: Extract to microservices as needed
- Start with high-load services (Search, Jobs Matching)
- Independent scaling per module
- Maintain data consistency with event-driven architecture

---

## Technology Stack Recommendations

### Frontend

**Framework**: **React 18+** with TypeScript
- **Why**: Large ecosystem, excellent developer experience, component reusability
- **State Management**: Zustand or Redux Toolkit
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **UI Components**:
  - Base: Radix UI or shadcn/ui (accessible, headless)
  - OR Material-UI (MUI) if you prefer complete component library
- **Styling**: Tailwind CSS
- **Rich Text Editor**:
  - Tiptap (modern, extensible)
  - OR TinyMCE (if WYSIWYG is priority)
- **Code Highlighting**: Prism.js or Shiki
- **Charts**: Recharts or Chart.js
- **Date Handling**: date-fns
- **Internationalization**: react-i18next

**Build Tools**:
- Vite (fast dev server, optimized builds)
- TypeScript 5+
- ESLint + Prettier

**PWA**:
- Workbox for service workers
- Web Push API for notifications

### Backend

**Runtime**: **Node.js 20 LTS** with TypeScript
- **Why**: JavaScript full-stack, large ecosystem, excellent async handling

**Framework**: **Express.js** or **Fastify**
- Express: More mature, larger ecosystem
- Fastify: Better performance, built-in TypeScript support
- **Recommendation**: Start with Express for familiarity

**ORM**: **Prisma**
- Type-safe database client
- Excellent migrations
- Schema-first approach
- Auto-generated TypeScript types

**Alternative**: TypeORM if you need more control

**API Design**: RESTful with OpenAPI/Swagger documentation

**Authentication**:
- **Passport.js** for OAuth strategies
- **jsonwebtoken** for JWT
- **bcrypt** for password hashing
- **express-session** for session management

**Validation**: **Zod** (schema validation, TypeScript integration)

**File Upload**: **Multer** with S3 integration

**Email**: **Nodemailer** with **SendGrid** or **AWS SES**

**Cron Jobs**: **node-cron** or **Bull** scheduler

### Database

**Primary Database**: **PostgreSQL 15+**
- **Why**:
  - Complex relational data (users, forum threads, jobs)
  - Full-text search capabilities
  - JSONB for flexible metadata
  - Excellent performance and reliability
  - Strong ACID guarantees

**Extensions**:
- `pg_trgm` for fuzzy search
- `pg_stat_statements` for query analysis
- `uuid-ossp` for UUID generation

**Connection Pooling**: **PgBouncer** or built-in Prisma pooling

### Cache Layer

**Redis 7+**
- Session storage
- Rate limiting
- Real-time features (pub/sub)
- Leaderboards (sorted sets)
- Temporary data (job queue)

### Search Engine

**Elasticsearch 8+** or **Meilisearch**
- **Elasticsearch**: Industry standard, powerful, complex
- **Meilisearch**: Simpler, faster setup, good for MVP
- **Recommendation**: Start with PostgreSQL full-text search for MVP, add Elasticsearch in Phase 2

**Use Cases**:
- Universal search across content types
- Advanced filtering and faceting
- Autocomplete
- Typo tolerance
- Search analytics

### File Storage & CDN

**Object Storage**: **AWS S3** or **CloudFlare R2**
- Media library
- User uploads
- Article images
- Application files

**CDN**: **CloudFlare** or **AWS CloudFront**
- Global content delivery
- Image optimization
- DDoS protection

**Image Processing**: **Sharp** (Node.js) for thumbnails and optimization

### Message Queue

**Bull** (Redis-based) or **RabbitMQ**
- **Recommendation**: Bull for simplicity
- Email sending
- Notification processing
- Job matching calculations
- Analytics processing

### Real-time Communication

**WebSocket**: **Socket.IO**
- Live notifications
- Real-time forum updates
- Online status
- Typing indicators (DM)

### Monitoring & Error Tracking

**Error Tracking**: **Sentry**
- Client and server error monitoring
- Performance monitoring
- Release tracking

**Logging**: **Winston** or **Pino**
- Structured logging
- Log levels
- File rotation

**APM**: **New Relic** or **DataDog** (optional, post-MVP)

**Uptime**: **UptimeRobot** or **Better Uptime**

### Analytics

**User Analytics**: **Mixpanel** or **Amplitude**
- User behavior tracking
- Funnel analysis
- Cohort analysis

**Web Analytics**: **Google Analytics 4** (basic metrics)

**Custom Analytics**: PostgreSQL + scheduled aggregations

### DevOps & Infrastructure

**Hosting Options**:
1. **AWS** (EC2 + RDS + S3 + ElastiCache)
2. **Railway** or **Render** (simpler, managed)
3. **DigitalOcean** (cost-effective)

**Containerization**: **Docker**

**Orchestration** (optional): **Docker Compose** for MVP, **Kubernetes** for scale

**CI/CD**: **GitHub Actions** or **GitLab CI**

**Environment Management**: **dotenv** + **env-validator**

**Database Migrations**: Prisma Migrate

**Backup**: Automated PostgreSQL backups (daily)

### Testing

**Unit Testing**: **Jest** or **Vitest**
**Integration Testing**: **Supertest** (API)
**E2E Testing**: **Playwright** or **Cypress**
**Load Testing**: **k6** or **Artillery**

---

## Design Principles

### 1. Security First

- **Input Validation**: Validate all user input (Zod schemas)
- **SQL Injection Prevention**: Use Prisma parameterized queries
- **XSS Prevention**: Sanitize HTML input, use CSP headers
- **CSRF Protection**: Token-based protection
- **Rate Limiting**: Per-user and per-IP limits
- **Password Security**: bcrypt with high cost factor (12+)
- **Session Security**: HTTPOnly, Secure, SameSite cookies
- **HTTPS Only**: Force SSL in production
- **GDPR Compliance**: Data export, deletion, consent tracking

### 2. Performance Optimization

- **Database Indexing**: Strategic indexes on frequently queried fields
- **Query Optimization**: Use EXPLAIN ANALYZE, avoid N+1 queries
- **Caching Strategy**:
  - Redis for session data, frequently accessed data
  - HTTP caching headers for static content
  - Query result caching for expensive operations
- **Lazy Loading**: Load content as needed
- **Pagination**: Cursor-based for infinite scroll, offset for pages
- **Code Splitting**: Route-based chunking
- **Image Optimization**: WebP format, multiple sizes, lazy loading
- **CDN Usage**: Static assets, images, user uploads
- **Database Connection Pooling**: Reuse connections efficiently

### 3. Scalability Considerations

- **Horizontal Scaling**: Stateless application servers
- **Database Scaling**:
  - Read replicas for read-heavy operations
  - Partitioning for large tables (articles, posts)
- **Caching**: Reduce database load
- **Background Jobs**: Offload heavy processing
- **API Rate Limiting**: Protect from abuse
- **Monitoring**: Track performance metrics

### 4. Maintainability

- **Code Organization**: Feature-based folder structure
- **TypeScript**: Type safety across stack
- **Documentation**: OpenAPI for API, JSDoc for complex functions
- **Testing**: High coverage for critical paths
- **Linting**: Consistent code style
- **Version Control**: Git with clear commit messages
- **Error Handling**: Centralized error handling
- **Logging**: Structured, searchable logs

### 5. Accessibility (WCAG 2.1 AA)

- **Semantic HTML**: Proper heading hierarchy, landmarks
- **Keyboard Navigation**: All features accessible via keyboard
- **Screen Reader Support**: ARIA labels, live regions
- **Color Contrast**: 4.5:1 for text, 3:1 for UI components
- **Focus Indicators**: Visible and prominent
- **Alt Text**: Required for all images
- **Form Labels**: Explicit labels for all inputs
- **Error Messages**: Clear, descriptive, associated with fields

### 6. Internationalization (i18n)

- **Languages**: Dutch and English at launch
- **Translation Strategy**:
  - UI/system messages: Fully translated
  - User content: Original language + optional auto-translate
- **Locale Handling**:
  - Date/time formats per locale
  - Number/currency formats
  - RTL support (future)
- **Content Strategy**:
  - Separate translation keys from code
  - Professional translation (not machine)
  - Translation management platform (Phrase, Lokalise)

---

## User Roles & Permissions

| Role | Key Capabilities |
|------|------------------|
| **Visitor** | Read news, browse forum, view jobs (limited), basic search |
| **User** | All visitor + forum participation, bookmarks, apply to jobs, manage profile, notifications, messaging |
| **Premium** | All user + ad-free, profile analytics, "who viewed", priority support, profile boost |
| **Company** | Post jobs, manage applications, company profile, analytics, search candidates (premium tier) |
| **Moderator** | Forum moderation, content review, user warnings, category management, moderation queue |
| **Admin** | Full platform control, publish news, user management, platform settings, analytics, audit logs |

---

## Core Features by Module

### News Module

- Article CMS with WYSIWYG/Markdown editor
- Hierarchical categories (3 levels max)
- Tag management with auto-suggest
- Scheduled publishing with workflow (Draft → Review → Scheduled → Published → Archived)
- Revision history (20 versions)
- Media library with CDN integration
- Bookmarks with collections (max 500 per user)
- Model tracker pages (dedicated pages per LLM)
- Advanced search with filters and autocomplete
- Personalized feed with AI recommendations
- Related articles algorithm
- Social sharing
- Email digests

### Forum Module

- Hierarchical categories (2 levels max)
- Topic types: Question, Discussion, Showcase, Tutorial, Announcement, Paper Discussion
- Threaded replies (3 levels deep)
- Voting system (upvote/downvote) with reputation impact
- Reputation system with levels and badges
- Accepted answer functionality
- Code blocks with syntax highlighting
- Moderation tools (edit, delete, move, lock, pin)
- Report queue with workflow
- Prompt Library (community prompts, rated, forkable)
- Polls (single/multiple choice)
- Private messaging
- @mentions and emoji reactions

### Jobs Module

- Job posting with LLM-specific metadata
- Advanced filtering (location, salary, tech stack, LLMs used)
- Match algorithm (40% skills + tech stack + location + salary)
- Easy Apply (one-click with profile data)
- Application tracking with status pipeline
- Company profiles with culture showcase
- Candidate profiles with portfolio and community stats
- ATS features (pipeline, notes, ratings, collaboration)
- Analytics dashboard (views, applications, conversions)
- Job alerts and saved searches

### LLM Guide

- Model reference pages (47+ models)
- Model comparison tool
- Use cases library (admin-curated + community submissions)
- Glossary (A-Z LLM terms)
- API quickstart guides

### Platform-Wide

- Universal search (cross-content)
- Personalized dashboard with configurable widgets
- Following system (users, companies, tags, categories, models)
- AI recommendation engine
- Notification system (in-app, email, push)
- Responsive design (mobile/tablet/desktop)
- PWA features (offline, home screen install)
- Dark mode
- Internationalization (Dutch, English)
- WCAG 2.1 AA accessibility

---

## Data Flow Examples

### User Registration & Onboarding
```
1. User submits registration form (email + password OR OAuth)
2. Backend validates input (Zod schema)
3. Hash password (bcrypt)
4. Create user record in PostgreSQL
5. Send verification email (queued via Bull)
6. User clicks verification link
7. Update user.emailVerified = true
8. Redirect to onboarding flow:
   - Profile type (Individual/Company)
   - Role selection
   - Experience level
   - Areas of interest
   - Models worked with
   - Notification preferences
9. Generate personalized feed
10. Show follow suggestions
11. Welcome email sent
```

### Forum Post Creation
```
1. User submits new topic form
2. Frontend validates (React Hook Form + Zod)
3. Backend validates + checks rate limit (Redis)
4. Spam detection (content analysis)
5. Create topic record (PostgreSQL)
6. Index in Elasticsearch (async via queue)
7. Update user reputation (+5 points)
8. Notify followers of category (async via queue)
9. Return topic ID and redirect to topic page
10. Render topic with SSR/SSG for SEO
```

### Job Matching
```
1. User completes profile (skills, experience, preferences)
2. Calculate user "skill vector" and store
3. When new job posted:
   a. Extract job "requirement vector"
   b. Queue matching calculation job
4. Background worker processes job:
   a. Load candidate profiles (filtered by basic criteria)
   b. Calculate match score per candidate
   c. Store top matches (>60%) in matches table
5. Send notification to high-match candidates (>80%)
6. Update job listing with match count
```

### AI Recommendation System
```
Inputs:
- User profile (skills, interests, experience)
- Explicit signals (follows, bookmarks, upvotes, applications)
- Implicit signals (views, time-on-page, searches)
- Contextual data (trending topics, time of day)

Processing:
1. Collaborative filtering (users like you also liked...)
2. Content-based filtering (similar to what you've engaged with)
3. Hybrid scoring
4. Diversity boost (avoid filter bubble)
5. Recency boost (recent content)

Outputs:
- Personalized feed ranking
- "For You" recommendations
- Related articles/topics
- Job matches
- User/company suggestions
```

---

## Security Considerations

### Authentication & Authorization

- **Password Requirements**: Min 8 chars, 1 uppercase, 1 number, 1 special char
- **Multi-Factor Authentication**: TOTP-based 2FA (optional)
- **Session Management**:
  - JWT for stateless authentication
  - Refresh tokens stored in HTTPOnly cookies
  - Access tokens short-lived (15 min)
  - Refresh tokens long-lived (30 days)
- **OAuth Providers**: Google, LinkedIn, GitHub
- **Email Verification**: Required for all registrations
- **Password Reset**: Time-limited tokens, single-use

### Rate Limiting

| Action | Limit |
|--------|-------|
| Login attempts | 5 per 15 minutes per IP |
| API requests (general) | 100 per minute per user |
| Forum topic creation | 10 per hour per user |
| Voting | 50 per day per user |
| Job applications | 10 per hour per user |
| Search queries | 60 per minute per user |
| File uploads | 10 per hour per user |

### Content Security

- **Input Sanitization**: HTML sanitizer (DOMPurify) for rich text
- **XSS Prevention**: CSP headers, escape output
- **SQL Injection**: Prisma prevents (parameterized queries)
- **File Upload**:
  - Validate MIME types
  - Scan for malware (ClamAV optional)
  - Size limits (images: 5MB, files: 10MB)
  - Sandboxed storage (S3)
- **CSRF Protection**: Token-based (CSRF tokens in forms)

### Data Privacy (GDPR)

- **Data Minimization**: Only collect necessary data
- **Consent Tracking**: Cookie consent, email preferences
- **Right to Access**: Export user data (JSON/CSV)
- **Right to Erasure**: Delete account and all associated data
- **Data Portability**: Download all user data
- **Privacy Settings**: Granular visibility controls per profile section
- **Audit Logs**: Track admin actions on user data

### Monitoring & Incident Response

- **Error Tracking**: Sentry for all errors
- **Suspicious Activity**: Flag unusual patterns (mass posting, rapid voting)
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Dependency Scanning**: Automated vulnerability scanning (Dependabot)
- **Incident Response Plan**: Document procedures for breaches

---

## Performance Targets

| Metric | Target |
|--------|--------|
| **Page Load Time** | < 2s (desktop), < 3s (mobile) |
| **Time to Interactive** | < 3s |
| **API Response Time** | < 200ms (p95) |
| **Database Query Time** | < 50ms (p95) |
| **Search Response Time** | < 300ms |
| **Uptime** | 99.9% |
| **Error Rate** | < 0.1% |

---

## Compliance & Standards

- **GDPR**: EU data protection compliance
- **WCAG 2.1 AA**: Accessibility standards
- **OWASP Top 10**: Security best practices
- **REST API**: Naming conventions, versioning
- **Semantic Versioning**: For API changes
- **HTTP Status Codes**: Proper usage
- **OpenAPI 3.0**: API documentation

---

## Success Metrics (KPIs)

### User Engagement
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- DAU/MAU ratio (engagement rate)
- Time on site per user
- Pages per session

### Content Metrics
- Articles published per week
- Forum topics per day
- Comments per topic (average)
- Upvote/downvote ratio

### Jobs Module
- Jobs posted per week
- Applications per job (average)
- Match score accuracy (user feedback)
- Time to hire (average)

### Business Metrics
- User registrations (weekly)
- Premium conversion rate
- Company account signups
- Monthly Recurring Revenue (MRR)
- Churn rate

### Platform Health
- API error rate
- Page load time (p95)
- Uptime percentage
- User-reported issues

---

## Next Steps

1. **Review Technical Decisions Document** for architectural choices and rationale
2. **Review Database Schema** for detailed data model
3. **Review API Endpoints** for complete API specification
4. **Review Development Phases** for sprint planning and MoSCoW prioritization
5. **Set up development environment** and initialize project structure
6. **Begin MVP development** starting with authentication and core infrastructure

---

## Document Cross-References

- [Database Schema](./02-DATABASE_SCHEMA.md) - Complete data model
- [API Endpoints](./03-API_ENDPOINTS.md) - REST API specification
- [User Workflows](./04-USER_WORKFLOWS.md) - User journey flows
- [File Structure](./05-FILE_STRUCTURE.md) - Project organization
- [Technical Decisions](./06-TECHNICAL_DECISIONS.md) - Architecture rationale
- [Development Phases](./07-DEVELOPMENT_PHASES.md) - Sprint planning
