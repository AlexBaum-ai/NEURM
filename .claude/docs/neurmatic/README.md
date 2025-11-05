# Neurmatic - Technical Documentation

**Version**: 2.0
**Status**: Planning Phase
**Last Updated**: November 2025

---

## What is Neurmatic?

Neurmatic is an integrated platform for the Large Language Model (LLM) community, combining:

1. **News Module** - Curated LLM content, model tracking, and industry updates
2. **Forum Module** - Community discussions, Q&A, and knowledge sharing
3. **Jobs Module** - LLM-specialized job matching and recruitment

**Vision**: Become the central hub where LLM professionals discover news, engage with community, and advance their careers.

---

## Documentation Overview

This technical documentation suite provides everything AI development teams need to build Neurmatic from scratch.

### Core Documentation

| Document | Purpose | For Whom |
|----------|---------|----------|
| [01-PROJECT_OVERVIEW.md](./01-PROJECT_OVERVIEW.md) | High-level architecture, tech stack, system design | All team members, stakeholders |
| [02-DATABASE_SCHEMA.md](./02-DATABASE_SCHEMA.md) | Complete database design with tables, relationships, indexes | Backend developers, DBAs |
| [03-API_ENDPOINTS.md](./03-API_ENDPOINTS.md) | REST API specification with examples | Frontend & backend developers |
| [04-USER_WORKFLOWS.md](./04-USER_WORKFLOWS.md) | User journeys and interaction flows | Developers, designers, QA |
| [05-FILE_STRUCTURE.md](./05-FILE_STRUCTURE.md) | Project directory organization | All developers |
| [06-TECHNICAL_DECISIONS.md](./06-TECHNICAL_DECISIONS.md) | Architectural choices and rationale | Tech leads, architects |
| [07-DEVELOPMENT_PHASES.md](./07-DEVELOPMENT_PHASES.md) | Sprint planning and MoSCoW prioritization | Project managers, developers |

---

## Quick Start Guide

### For New Developers

**Step 1**: Understand the vision
- Read: [PROJECT_OVERVIEW.md](./01-PROJECT_OVERVIEW.md) - System architecture and design principles

**Step 2**: Set up your environment
- Read: [DEVELOPMENT_PHASES.md](./07-DEVELOPMENT_PHASES.md) → Phase 0: Foundation & Setup
- Follow setup instructions for frontend and backend

**Step 3**: Understand the data model
- Read: [DATABASE_SCHEMA.md](./02-DATABASE_SCHEMA.md)
- Study entity relationships and constraints

**Step 4**: Learn the API
- Read: [API_ENDPOINTS.md](./03-API_ENDPOINTS.md)
- Test endpoints with Postman/Thunder Client

**Step 5**: Understand user flows
- Read: [USER_WORKFLOWS.md](./04-USER_WORKFLOWS.md)
- Visualize how users interact with the platform

**Step 6**: Start coding
- Read: [FILE_STRUCTURE.md](./05-FILE_STRUCTURE.md) - Understand code organization
- Pick a task from [DEVELOPMENT_PHASES.md](./07-DEVELOPMENT_PHASES.md)

---

### For AI Agents

**Context**: You are building the Neurmatic platform based on these specifications.

**Recommended Reading Order**:
1. [PROJECT_OVERVIEW.md](./01-PROJECT_OVERVIEW.md) - Understand the system
2. [DATABASE_SCHEMA.md](./02-DATABASE_SCHEMA.md) - Learn the data model
3. [API_ENDPOINTS.md](./03-API_ENDPOINTS.md) - Know what APIs to build
4. [FILE_STRUCTURE.md](./05-FILE_STRUCTURE.md) - Organize your code correctly
5. [TECHNICAL_DECISIONS.md](./06-TECHNICAL_DECISIONS.md) - Understand why decisions were made
6. [DEVELOPMENT_PHASES.md](./07-DEVELOPMENT_PHASES.md) - Follow the implementation plan

**Key Principles**:
- **Prioritize security**: Input validation, authentication, authorization
- **Type safety**: Use TypeScript strictly, share types between frontend/backend
- **Test coverage**: Write tests for critical paths (>80% coverage)
- **Follow conventions**: REST API standards, naming conventions
- **Document changes**: Update docs when implementing features

---

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand or Redux Toolkit
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **UI Components**: Radix UI or MUI
- **i18n**: react-i18next

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: Passport.js (JWT + OAuth)

### Database & Infrastructure
- **Primary DB**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Search**: PostgreSQL (MVP) → Elasticsearch (Phase 2)
- **Storage**: AWS S3 or CloudFlare R2
- **Email**: SendGrid or AWS SES
- **Queue**: Bull (Redis-based)
- **WebSocket**: Socket.IO

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**: Railway, Render, or AWS
- **Monitoring**: Sentry
- **Logging**: Winston

---

## Key Features Overview

### News Module
- Article CMS with WYSIWYG/Markdown editor
- Hierarchical categories and tags
- Model tracker pages (47+ LLMs)
- Bookmarks with collections
- Advanced search with filters
- Personalized feed with AI recommendations
- Email digests

### Forum Module
- Hierarchical categories
- 6 topic types (Question, Discussion, Showcase, Tutorial, Announcement, Paper)
- Threaded replies (3 levels deep)
- Voting system with reputation
- Badges and leaderboards
- Prompt Library (community prompts)
- Polls and private messaging
- Moderation tools

### Jobs Module
- Job posting with LLM-specific metadata
- Advanced filtering (location, salary, tech stack, LLMs)
- Match algorithm (skills, experience, location, salary)
- Easy Apply (one-click with profile)
- Application tracking with status pipeline
- Company profiles
- Candidate profiles with portfolio
- ATS features (for companies)

### Platform-Wide
- Universal search (cross-content)
- Personalized dashboard
- Following system (users, companies, tags, categories, models)
- AI recommendation engine
- Notification system (in-app, email, push)
- Responsive design + PWA
- Dark mode
- Internationalization (Dutch, English)
- WCAG 2.1 AA accessibility

---

## Database Overview

**Total Tables**: 50+

### Main Entities
- **Users**: users, profiles, oauth_providers, sessions
- **News**: articles, categories, tags, bookmarks, media_library
- **Forum**: topics, replies, votes, reputation, badges, prompts, polls
- **Jobs**: jobs, companies, applications, matches
- **LLM Guide**: llm_models, use_cases, glossary_terms
- **Platform**: notifications, follows, messages, analytics

**Key Relationships**:
- Users → Articles (bookmarks)
- Users → Topics → Replies (forum threads)
- Users → Jobs (applications)
- Companies → Jobs
- Articles ↔ LLM Models
- Jobs ↔ LLM Models

See [DATABASE_SCHEMA.md](./02-DATABASE_SCHEMA.md) for complete schema.

---

## API Overview

**Base URL**: `/api/v1`
**Authentication**: JWT Bearer Token
**Total Endpoints**: 100+

### Endpoint Categories
1. **Authentication** (12 endpoints): Register, login, OAuth, 2FA, password reset
2. **Users** (15 endpoints): Profile, settings, skills, experience, portfolio
3. **News** (10 endpoints): Articles, categories, tags, bookmarks
4. **Forum** (20 endpoints): Topics, replies, votes, reputation, prompts
5. **Jobs** (15 endpoints): Jobs, applications, companies, matches
6. **LLM Guide** (8 endpoints): Models, use cases, glossary
7. **Platform** (10 endpoints): Search, notifications, follows, dashboard
8. **Admin** (10 endpoints): User management, moderation, analytics

See [API_ENDPOINTS.md](./03-API_ENDPOINTS.md) for complete API specification.

---

## Development Phases

### Phase 0: Foundation (1-2 weeks)
- Project setup (frontend + backend)
- Database schema and migrations
- Authentication system
- Core infrastructure

### Phase 1: MVP (8-10 weeks)
- User management (2 weeks)
- News module - core (2 weeks)
- Forum module - core (2 weeks)
- Jobs module - core (2 weeks)
- Platform features (1 week)
- Polish & testing (1 week)

**Deliverable**: Launch-ready platform with Must Have features

### Phase 2: Post-MVP (3 months)
- News enhancement (model trackers, advanced search)
- Forum enhancement (polls, messaging, badges, prompt library)
- Jobs enhancement (match algorithm v2, alerts, ATS)
- Platform enhancement (personalized dashboard, AI recommendations)
- Admin & moderation tools

**Deliverable**: Should Have features for better engagement

### Phase 3: Advanced Features (3 months)
- Advanced news (author profiles, series, native comments)
- Advanced forum (advanced polls, code playground, anonymous posting)
- Advanced jobs (ML matching, salary tools, interview prep)
- LLM Guide (use cases library, comparison tool)
- Platform advanced (achievements, mentorship, events)

**Deliverable**: Could Have features for differentiation

### Phase 4: Scale & Optimize (Ongoing)
- Database optimization (read replicas, partitioning)
- Search scaling (Elasticsearch migration)
- Performance optimization (caching, code splitting)
- Microservices migration (if needed)
- Mobile apps

See [DEVELOPMENT_PHASES.md](./07-DEVELOPMENT_PHASES.md) for detailed sprint planning.

---

## User Roles & Permissions

| Role | Key Capabilities |
|------|------------------|
| **Visitor** | Read news, browse forum (read-only), view jobs (limited), basic search |
| **User** | All visitor + forum participation, bookmarks, apply to jobs, manage profile, notifications |
| **Premium** | All user + ad-free, profile analytics, "who viewed", priority support, profile boost |
| **Company** | Post jobs, manage applications, company profile, analytics, search candidates |
| **Moderator** | Forum moderation, content review, user warnings, category management |
| **Admin** | Full platform control, publish news, user management, platform settings, analytics |

---

## Security Highlights

- **Authentication**: JWT + refresh tokens, OAuth (Google, LinkedIn, GitHub), 2FA
- **Input Validation**: Zod schemas, SQL injection prevention (Prisma), HTML sanitization
- **Rate Limiting**: Per-user and per-IP limits (login: 5/15min, API: 100/min, topics: 10/hr)
- **XSS Protection**: CSP headers, HTTPOnly cookies, output escaping
- **CSRF Protection**: SameSite cookies, CSRF tokens
- **HTTPS Only**: Force SSL, HSTS headers, secure cookies
- **GDPR Compliance**: Privacy settings, data export, right to deletion, audit logs

See [TECHNICAL_DECISIONS.md](./06-TECHNICAL_DECISIONS.md) → ADR-013 for security strategy.

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Page Load Time | < 2s (desktop), < 3s (mobile) |
| Time to Interactive | < 3s |
| API Response Time | < 200ms (p95) |
| Database Query Time | < 50ms (p95) |
| Search Response Time | < 300ms |
| Uptime | 99.9% |
| Error Rate | < 0.1% |

---

## MoSCoW Prioritization

### Must Have (MVP)
✅ User auth & profiles
✅ News (CRUD, read, bookmark)
✅ Forum (topics, replies, voting)
✅ Jobs (post, browse, apply)
✅ Basic search
✅ Responsive design
✅ Notifications

### Should Have (Post-MVP)
- Model trackers
- Advanced search
- Polls & messaging
- Badges & leaderboards
- Match algorithm v2
- Personalized dashboard
- Admin tools

### Could Have (Advanced)
- Article series
- Advanced polls
- Prompt Library (advanced)
- Use cases library
- Model comparison
- Achievements
- Events & webinars

### Won't Have
- Video hosting
- Live streaming
- E-commerce
- Native mobile apps (Phase 1-3)
- Blockchain features

---

## Common Workflows

### User Registration Flow
```
Landing → Register Form → Email Verification → Onboarding (8 steps) → Dashboard
```

### Forum Question Flow
```
Forum → Create Question → Post → Receive Replies → Upvote Helpful Replies → Mark Accepted Answer
```

### Job Application Flow
```
Browse Jobs → Filter & Sort → View Job Detail → Easy Apply → Track Application → Status Updates
```

See [USER_WORKFLOWS.md](./04-USER_WORKFLOWS.md) for detailed flows.

---

## File Organization

### Frontend (React)
```
src/
├── features/        # Feature modules (news, forum, jobs)
├── components/      # Shared UI components
├── hooks/           # Custom hooks
├── services/        # API clients
├── store/           # State management
├── utils/           # Utilities
└── types/           # TypeScript types
```

### Backend (Node.js)
```
src/
├── modules/         # Feature modules (auth, news, forum, jobs)
├── middleware/      # Express middleware
├── utils/           # Utilities
├── jobs/            # Background jobs (Bull)
├── websocket/       # WebSocket server
└── prisma/          # Database schema & migrations
```

See [FILE_STRUCTURE.md](./05-FILE_STRUCTURE.md) for complete structure.

---

## Architecture Decisions

Key decisions documented in [TECHNICAL_DECISIONS.md](./06-TECHNICAL_DECISIONS.md):

- **ADR-001**: Modular monolith → microservices (fast MVP, scale when needed)
- **ADR-002**: Feature-based code organization (maintainability)
- **ADR-003**: REST API over GraphQL (simplicity, caching)
- **ADR-004**: React + TypeScript (type safety, ecosystem)
- **ADR-005**: Node.js + Express (JavaScript full-stack)
- **ADR-006**: Prisma ORM (type-safe database access)
- **ADR-007**: PostgreSQL (complex relationships, ACID)
- **ADR-008**: Redis (caching, sessions, rate limiting)
- **ADR-009**: PostgreSQL search → Elasticsearch (phased approach)
- **ADR-010**: JWT authentication (stateless, scalable)

---

## Testing Strategy

### Unit Tests
- **Coverage Target**: >80%
- **Tools**: Jest (backend), Vitest (frontend)
- **Focus**: Services, utilities, complex components

### Integration Tests
- **Tools**: Supertest (API), React Testing Library (components)
- **Focus**: API endpoints, data flows, user interactions

### End-to-End Tests
- **Tools**: Playwright or Cypress
- **Focus**: Critical user journeys (registration, forum post, job application)

### Performance Tests
- **Tools**: k6, Artillery
- **Focus**: API response times, database query performance, load testing

---

## Deployment Strategy

### Environments
1. **Development**: Local (Docker Compose)
2. **Staging**: Cloud (Railway/Render) - test before production
3. **Production**: Cloud (AWS/Railway) - live platform

### CI/CD Pipeline
```
Push Code → GitHub Actions
  ├─→ Lint & Type Check
  ├─→ Run Tests
  ├─→ Build Docker Images
  ├─→ Deploy to Staging
  ├─→ Smoke Tests
  └─→ Deploy to Production (manual approval)
```

### Monitoring
- **Errors**: Sentry (frontend + backend)
- **Logs**: Winston → CloudWatch/Datadog
- **Metrics**: Custom metrics (DAU, MAU, API latency)
- **Uptime**: Better Uptime or UptimeRobot

---

## Success Metrics

### Phase 1 (MVP Launch)
- 0 critical bugs
- Lighthouse score >85
- 100+ beta users
- 50+ articles, 100+ topics, 20+ jobs

### Phase 2 (Post-MVP)
- 1,000+ users
- 500+ articles, 1,000+ topics, 100+ jobs
- Email open rate >25%
- User retention >40%

### Phase 3 (Advanced)
- 10,000+ users
- 100+ premium subscriptions
- 50+ company accounts
- Session duration >8 min

### Phase 4 (Scale)
- 100,000+ users
- 99.9% uptime
- Sub-second API responses (p99)
- <0.1% error rate

---

## Contributing

### For Team Members
1. Read all documentation before starting
2. Follow the [FILE_STRUCTURE.md](./05-FILE_STRUCTURE.md) conventions
3. Write tests for new features (>80% coverage)
4. Update documentation when making changes
5. Follow Git workflow (feature branches, PRs, code review)

### For AI Agents
1. Read specifications thoroughly before implementing
2. Follow TypeScript strictly (no `any` types)
3. Implement security best practices (input validation, rate limiting)
4. Write comprehensive tests
5. Document your code (JSDoc for complex functions)
6. Update API documentation (OpenAPI) when adding endpoints

---

## Support & Resources

### Documentation
- **Neurmatic Spec**: [/home/neurmatic/nEURM/Neurmatic.md](../../../Neurmatic.md)
- **Technical Docs**: This directory

### External Resources
- React Docs: https://react.dev
- Express Docs: https://expressjs.com
- Prisma Docs: https://www.prisma.io/docs
- PostgreSQL Docs: https://www.postgresql.org/docs
- TypeScript Docs: https://www.typescriptlang.org/docs

---

## License

[To be determined]

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Nov 2025 | Complete technical documentation suite created |
| 1.0 | Nov 2025 | Initial Neurmatic specification (Dutch) |

---

## Contact

For questions about this documentation, contact the project architect or tech lead.

---

**Happy Building!** 🚀

This documentation is designed to empower AI agents and human developers to build Neurmatic efficiently, securely, and scalably. Each document serves a specific purpose and cross-references related documentation for comprehensive understanding.
