# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Neurmatic** is an integrated platform for the Large Language Model (LLM) community combining three core modules:

1. **News Module** - Curated LLM content, model tracking, and industry updates
2. **Forum Module** - Community discussions, Q&A, and knowledge sharing
3. **Jobs Module** - LLM-specialized job matching and recruitment

**Status**: Planning phase - ready to begin Sprint 0 (Foundation)

## Technology Stack

### Frontend
- React 18+ with TypeScript and Vite
- TailwindCSS for styling (UI library: Radix UI or MUI)
- State management: Zustand or Redux Toolkit
- Data fetching: TanStack Query (React Query)
- Forms: React Hook Form + Zod validation
- i18n: react-i18next

### Backend
- Node.js 20 LTS with Express.js and TypeScript
- ORM: Prisma with PostgreSQL 15+
- Authentication: Passport.js (JWT + OAuth: Google, LinkedIn, GitHub)
- Validation: Zod schemas
- Caching: Redis 7+
- Background jobs: Bull (Redis-based)
- WebSocket: Socket.IO

### Infrastructure
- Docker + Docker Compose (local development)
- PostgreSQL (primary database, 50+ tables)
- Redis (cache, sessions, rate limiting, queues)
- AWS S3 or CloudFlare R2 (media storage)
- SendGrid or AWS SES (email)
- Sentry (monitoring)
- CI/CD: GitHub Actions

## Project Structure

```
neurmatic/
├── frontend/          # React frontend (not created yet)
├── backend/           # Node.js backend (not created yet)
├── shared/            # Shared types/constants (not created yet)
├── infrastructure/    # Docker, deployment configs
├── projectdoc/        # Technical documentation
├── .claude/           # Claude Code configuration
│   ├── sprints/       # Sprint task definitions (15 sprints, 172 tasks)
│   ├── skills/        # Development guidelines
│   └── PROGRESS.md    # Sprint progress tracking
├── Neurmatic.md       # Dutch project specification (original)
└── CLAUDE.md          # This file
```

## Essential Documentation

**Read these files to understand the project:**

1. `projectdoc/README.md` - Technical overview and quick start
2. `projectdoc/02-DATABASE_SCHEMA.md` - Complete database design (50+ tables)
3. `projectdoc/03-API_ENDPOINTS.md` - REST API specification (100+ endpoints)
4. `projectdoc/05-FILE_STRUCTURE.md` - Expected directory structure
5. `.claude/sprints/sprint-0.json` - Foundation sprint (first to implement)
6. `.claude/PROGRESS.md` - Current status and next steps

## Development Workflow

### Getting Started

The project follows a **15-sprint plan** (30 weeks total):

- **Sprint 0** (2 weeks): Foundation & Infrastructure - START HERE
- **Sprints 1-10** (20 weeks): Core modules (User Management, News, Forum, Jobs)
- **Sprints 11-13** (6 weeks): Integration (LLM Guide, Admin, Notifications)
- **Sprint 14** (2 weeks): Polish & Launch Preparation

### Current Phase

**Phase**: Foundation (Sprint 0) - Not started
**Next Task**: Initialize backend project structure (SPRINT-0-001)

### Sprint Commands

```bash
# View current sprint details
cat .claude/sprints/sprint-0.json

# List tasks with status
jq '.tasks[] | {id: .taskId, title: .title, status: .status}' .claude/sprints/sprint-0.json

# Count tasks by status
jq '[.tasks[].status] | group_by(.) | map({status: .[0], count: length})' .claude/sprints/sprint-0.json
```

## Architecture Guidelines

### Frontend Guidelines (`.claude/skills/frontend-dev-guidelines/`)

**Key Patterns:**
- Use `React.lazy()` for code splitting and lazy loading
- Wrap async components in `<SuspenseLoader>` (NO early returns with loading spinners)
- Use `useSuspenseQuery` for data fetching (TanStack Query)
- Feature-based directory structure: `src/features/{feature}/`
- Import aliases: `@/` (src), `~types`, `~components`, `~features`
- Components: `React.FC<Props>` with TypeScript
- Event handlers: Use `useCallback` when passed to children
- Default export at bottom of file

**Styling:**
- Inline styles if <100 lines
- Separate file if >100 lines
- Use MUI v7 components with `sx` prop
- TailwindCSS for utilities

### Backend Guidelines (`.claude/skills/backend-dev-guidelines/`)

**Layered Architecture:**
```
Routes (routing) → Controllers (request handling) → Services (business logic) → Repositories (data access) → Database
```

**Key Patterns:**
- Controllers extend `BaseController` class
- Use dependency injection in services
- Zod schemas for validation
- Prisma for database access
- Sentry for error tracking (`instrument.ts` MUST be first import)
- Configuration via `unifiedConfig`
- Async/await with proper error handling

**Naming Conventions:**
- Controllers: `PascalCase` - `UserController.ts`
- Services: `camelCase` - `userService.ts`
- Routes: `camelCase + Routes` - `userRoutes.ts`
- Repositories: `PascalCase + Repository` - `UserRepository.ts`

### Database

**Schema**: 50+ tables across 6 main entity groups:
- Users (users, profiles, oauth_providers, sessions)
- News (articles, categories, tags, bookmarks, media_library)
- Forum (topics, replies, votes, reputation, badges, prompts, polls)
- Jobs (jobs, companies, applications, matches)
- LLM Guide (llm_models, use_cases, glossary_terms)
- Platform (notifications, follows, messages, analytics)

**ORM**: Prisma
- Schema location: `backend/src/prisma/schema.prisma`
- Migrations: `backend/src/prisma/migrations/`
- Seeding: `backend/src/prisma/seed.ts`

## Common Commands

### Development Setup (Sprint 0)

```bash
# Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend setup
cd frontend
npm install
npm run dev

# Docker (local environment)
docker-compose up -d
```

### Testing

```bash
# Backend tests
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Frontend tests
cd frontend
npm test                 # Vitest
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report
```

### Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Formatting
npm run format
```

### Database Operations

```bash
cd backend
npx prisma studio          # Database GUI
npx prisma migrate dev     # Create migration
npx prisma migrate deploy  # Deploy migrations
npx prisma db seed         # Seed database
```

## Important Constraints

### Security Requirements
- **Input Validation**: Always use Zod schemas before processing user input
- **SQL Injection**: Prisma ORM prevents this, but validate inputs
- **XSS Prevention**: Sanitize HTML content, use CSP headers
- **Rate Limiting**: Implement per-endpoint (defined in API_ENDPOINTS.md)
- **Authentication**: JWT + refresh tokens, HTTPOnly cookies
- **CORS**: Configure properly for frontend domain
- **HTTPS Only**: Force SSL in production

### Performance Targets
- Page Load Time: < 2s (desktop), < 3s (mobile)
- API Response Time: < 200ms (p95)
- Database Query Time: < 50ms (p95)
- Test Coverage: > 80%

### MoSCoW Prioritization

**MUST HAVE (MVP - Sprints 0-10):**
- User authentication (email + OAuth + 2FA)
- Article CMS with categories/tags
- Forum with topics, replies, voting, reputation
- Job posting, browsing, applications
- Basic search and filtering
- Responsive design + dark mode
- Notification system
- Admin panel

**SHOULD HAVE (Post-MVP - Sprints 11-13):**
- Model tracker pages (47+ LLMs)
- Badges and leaderboards
- Prompt Library
- Polls and private messaging
- Match algorithm v2
- Advanced search
- Email digests

**COULD HAVE (Future):**
- Use cases library
- Model comparison tool
- ML-based matching
- Events calendar
- Mentorship matching

## Key Design Decisions

Reference: `projectdoc/06-TECHNICAL_DECISIONS.md`

- **Modular monolith**: Start with monolith, migrate to microservices if needed
- **Feature-based organization**: Group by domain (news, forum, jobs)
- **REST over GraphQL**: Simpler caching, easier debugging
- **PostgreSQL**: Handle complex relationships with ACID guarantees
- **Redis**: Multi-purpose (cache, sessions, rate limiting, queues)
- **Phased search**: PostgreSQL FTS initially → Elasticsearch when needed
- **JWT authentication**: Stateless, scalable, refresh token rotation

## Sprint Task Tracking

### Task Format

Each task in sprint files follows this structure:
```json
{
  "taskId": "SPRINT-0-001",
  "title": "Task title",
  "assignedTo": "backend-developer|frontend-developer|qa-software-tester",
  "priority": "high|medium|low",
  "estimatedHours": 8,
  "status": "pending|in-progress|completed|blocked",
  "dependencies": [],
  "acceptanceCriteria": [],
  "technicalNotes": []
}
```

### Using Claude Skills

The project includes specialized skills for common tasks:

- `todo-sync`: Sync sprint tasks with TodoWrite tool
- `task-tracker`: Update task status in sprint JSON files
- `test-validator`: Validate implementations
- `error-tracking`: Add Sentry integration

## File Organization Conventions

### Frontend ()
```
FOLLOW 4. `projectdoc/05-FILE_STRUCTURE.md` - Expected directory structure
```

### Backend ()
```
FOLLOW 4. `projectdoc/05-FILE_STRUCTURE.md` - Expected directory structure
```

## TypeScript Configuration

### Import Paths (Frontend)
```typescript
import { Button } from '@/components/common/Button';
import { useAuth } from '~features/auth/hooks/useAuth';
import type { User } from '~types/user';
import { formatDate } from '@/utils/formatters';
```

### Import Paths (Backend)
```typescript
import { UserController } from '@/modules/users/users.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { logger } from '@/utils/logger';
```

**IMPORTANT** Use the right agents for the sprints

## Testing Strategy

### Unit Tests
- **Focus**: Services, utilities, complex components
- **Frontend**: Vitest
- **Backend**: Jest
- **Coverage Target**: > 80%

### Integration Tests
- **Focus**: API endpoints, data flows
- **Tools**: Supertest (backend), React Testing Library (frontend)

### E2E Tests
- **Focus**: Critical user journeys
- **Tools**: Playwright or Cypress
- **Journeys**: Registration, forum post, job application

## Common Pitfalls to Avoid

1. **NO early returns with loading spinners** - Use Suspense boundaries instead
2. **NO `any` types** - Use proper TypeScript types
3. **NO hardcoded configuration** - Use environment variables
4. **NO missing error tracking** - Instrument with Sentry
5. **NO missing input validation** - Use Zod schemas
6. **NO direct Prisma calls in controllers** - Use repositories/services
7. **NO missing rate limiting** - Add to sensitive endpoints
8. **NO console.log in production** - Use Winston logger
9. **NO large bundle sizes** - Use lazy loading and code splitting
10. **NO missing tests** - Write tests for all new features

## Environment Setup

### Required Environment Variables

**Frontend** (`.env.development`):
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_SENTRY_DSN=your_sentry_dsn
```

**Backend** (`.env.development`):
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/neurmatic
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
# OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=neurmatic-media
# Email
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@neurmatic.com
# Monitoring
SENTRY_DSN=your_sentry_dsn
# Other
FRONTEND_URL=http://localhost:5173
```

## Support Resources

### Documentation Files
- `Neurmatic.md` - Original Dutch specification
- `projectdoc/` - All technical documentation
- `.claude/sprints/` - Sprint task definitions
- `.claude/skills/` - Development guidelines

### External Resources
- React: https://react.dev
- Express: https://expressjs.com
- Prisma: https://www.prisma.io/docs
- PostgreSQL: https://www.postgresql.org/docs
- TypeScript: https://www.typescriptlang.org/docs

## Getting Help

When stuck, consult these resources in order:

1. Check `projectdoc/README.md` for technical overview
2. Review relevant sprint file in `.claude/sprints/`
3. Check `.claude/skills/` for pattern guidelines
4. Consult `projectdoc/03-API_ENDPOINTS.md` for API contracts
5. Review `projectdoc/02-DATABASE_SCHEMA.md` for data model

## Notes for AI Agents

- **Start with Sprint 0**: Don't skip foundation setup
- **Follow the architecture**: Use layered architecture (routes → controllers → services → repositories)
- **Type everything**: No `any` types, use strict TypeScript
- **Test comprehensively**: > 80% coverage requirement
- **Track progress**: Update sprint JSON files and PROGRESS.md
- **Document decisions**: Update technical docs when making architectural choices
- **Security first**: Validate inputs, implement rate limiting, use parameterized queries
- **Performance aware**: Cache aggressively, optimize queries, lazy load components
- **Implement Sentry**: implement Sentry
- **HOST** dont use localhost. use vps-1a707765.vps.ovh.net
---

**Last Updated**: November 2025
**Project Status**: Planning phase, ready for Sprint 0
**Target Launch**: Q3 2026 (7-8 months from start)
- ALWAYS USE AGENTS FOR THE SPRINTS -> LOOK FOR DEPENDACIES TO CHECK WHICH TASKS GO PARALEL