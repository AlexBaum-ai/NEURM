# Neurmatic Technical Documentation - Start Here

**Created**: November 2025
**Total Documentation**: 10,748 lines across 8 comprehensive files
**Status**: Complete and ready for AI agent development teams

---

## Documentation Suite Overview

This comprehensive technical documentation provides everything needed to build the Neurmatic platform from scratch. It has been specifically designed to enable AI development agents to immediately begin implementation with clear specifications, rationale, and guidance.

---

## Quick Navigation

### 📚 **Read First**
**[README.md](./README.md)** - Quick reference guide with overview of all documentation

### 🏗️ **Architecture & Design**
1. **[01-PROJECT_OVERVIEW.md](./01-PROJECT_OVERVIEW.md)** (692 lines)
   - High-level system architecture
   - Technology stack recommendations with rationale
   - Design principles and patterns
   - Security considerations
   - Performance targets

### 💾 **Data Layer**
2. **[02-DATABASE_SCHEMA.md](./02-DATABASE_SCHEMA.md)** (1,729 lines)
   - Complete PostgreSQL database schema (50+ tables)
   - All relationships, constraints, and indexes
   - Performance optimization strategies
   - Prisma schema examples
   - Migration strategy

### 🔌 **API Layer**
3. **[03-API_ENDPOINTS.md](./03-API_ENDPOINTS.md)** (3,579 lines)
   - 100+ REST API endpoints fully documented
   - Request/response examples for every endpoint
   - Authentication and authorization requirements
   - Error handling and status codes
   - Rate limiting specifications

### 👥 **User Experience**
4. **[04-USER_WORKFLOWS.md](./04-USER_WORKFLOWS.md)** (1,376 lines)
   - Complete user journey flows
   - Registration and onboarding
   - News, Forum, Jobs workflows
   - AI recommendation engine flow
   - Notification system flows

### 📁 **Code Organization**
5. **[05-FILE_STRUCTURE.md](./05-FILE_STRUCTURE.md)** (875 lines)
   - Frontend structure (React + TypeScript)
   - Backend structure (Node.js + Express)
   - Feature-based organization
   - File naming conventions
   - Import aliases and configurations

### 🎯 **Technical Decisions**
6. **[06-TECHNICAL_DECISIONS.md](./06-TECHNICAL_DECISIONS.md)** (825 lines)
   - 20 Architecture Decision Records (ADRs)
   - Technology choices with rationale
   - Trade-offs and alternatives considered
   - Security strategy
   - Performance decisions

### 🚀 **Implementation Plan**
7. **[07-DEVELOPMENT_PHASES.md](./07-DEVELOPMENT_PHASES.md)** (846 lines)
   - Phase 0: Foundation (1-2 weeks)
   - Phase 1: MVP (8-10 weeks) - Must Have features
   - Phase 2: Post-MVP (3 months) - Should Have features
   - Phase 3: Advanced (3 months) - Could Have features
   - Phase 4: Scale & Optimize (ongoing)
   - Sprint-by-sprint breakdown with checklists

---

## For AI Development Agents

### Recommended Reading Order

**Step 1: Understand the System** (30 min)
- Read [README.md](./README.md) for quick overview
- Read [01-PROJECT_OVERVIEW.md](./01-PROJECT_OVERVIEW.md) for architecture

**Step 2: Learn the Data Model** (45 min)
- Read [02-DATABASE_SCHEMA.md](./02-DATABASE_SCHEMA.md)
- Study entity relationships
- Understand constraints and indexes

**Step 3: Understand the API** (1 hour)
- Read [03-API_ENDPOINTS.md](./03-API_ENDPOINTS.md)
- Study request/response formats
- Note authentication requirements

**Step 4: Visualize User Flows** (30 min)
- Read [04-USER_WORKFLOWS.md](./04-USER_WORKFLOWS.md)
- Understand how features connect

**Step 5: Know the Code Structure** (20 min)
- Read [05-FILE_STRUCTURE.md](./05-FILE_STRUCTURE.md)
- Understand where to place new code

**Step 6: Understand Why** (30 min)
- Read [06-TECHNICAL_DECISIONS.md](./06-TECHNICAL_DECISIONS.md)
- Learn the rationale behind choices

**Step 7: Plan Your Work** (30 min)
- Read [07-DEVELOPMENT_PHASES.md](./07-DEVELOPMENT_PHASES.md)
- Follow the implementation roadmap

**Total Time**: ~4 hours to fully understand the system

---

## For Human Developers

### Day 1: Orientation
- [ ] Read [README.md](./README.md)
- [ ] Read [01-PROJECT_OVERVIEW.md](./01-PROJECT_OVERVIEW.md)
- [ ] Skim all other documents to understand scope

### Day 2: Deep Dive
- [ ] Study [02-DATABASE_SCHEMA.md](./02-DATABASE_SCHEMA.md) in detail
- [ ] Review [03-API_ENDPOINTS.md](./03-API_ENDPOINTS.md) for your feature area

### Day 3: Setup & Start
- [ ] Follow Phase 0 setup in [07-DEVELOPMENT_PHASES.md](./07-DEVELOPMENT_PHASES.md)
- [ ] Review [05-FILE_STRUCTURE.md](./05-FILE_STRUCTURE.md)
- [ ] Start coding!

---

## Key Features Summary

### News Module
- 📰 Article CMS with rich editor
- 📂 Hierarchical categories (3 levels)
- 🏷️ Tag system with autocomplete
- 🔖 Bookmarks with collections (max 500)
- 🤖 Model tracker pages (47+ LLMs)
- 🔍 Advanced search with filters
- 📧 Email digests

### Forum Module
- 💬 6 topic types (Question, Discussion, Showcase, Tutorial, Announcement, Paper)
- 🧵 Threaded replies (3 levels deep)
- ⬆️ Voting system with reputation
- 🏆 Badges and leaderboards
- 💡 Prompt Library (community prompts)
- 📊 Polls (single/multiple choice)
- ✉️ Private messaging
- 🛡️ Moderation tools

### Jobs Module
- 💼 Job posting with LLM-specific metadata
- 🎯 Match algorithm (skills, tech stack, location, salary)
- ⚡ Easy Apply (one-click)
- 📊 Application tracking with pipeline
- 🏢 Company profiles
- 👤 Candidate profiles with portfolio
- 📈 ATS features for companies

### Platform-Wide
- 🔍 Universal search (cross-content)
- 📱 Responsive design + PWA
- 🌓 Dark mode
- 🌍 i18n (Dutch, English)
- 🔔 Notifications (in-app, email, push)
- 🤝 Following system
- 🤖 AI recommendations
- ♿ WCAG 2.1 AA accessibility

---

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- TanStack Query (data fetching)
- React Hook Form + Zod (forms)
- Radix UI or MUI (components)

### Backend
- Node.js 20 LTS with TypeScript
- Express.js (framework)
- Prisma (ORM)
- PostgreSQL 15+ (database)
- Redis 7+ (cache)
- Bull (job queue)
- Socket.IO (WebSocket)

### DevOps
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Sentry (error tracking)
- AWS/Railway (hosting)

---

## Database Overview

**Total Tables**: 50+
**Total Lines of Schema Documentation**: 1,729

### Core Entities
- **Users**: 10 tables (users, profiles, skills, experience, portfolio, etc.)
- **News**: 8 tables (articles, categories, tags, bookmarks, etc.)
- **Forum**: 15 tables (topics, replies, votes, reputation, badges, prompts, polls, etc.)
- **Jobs**: 10 tables (jobs, companies, applications, matches, etc.)
- **LLM Guide**: 4 tables (models, use cases, glossary)
- **Platform**: 7 tables (notifications, follows, messages, analytics, etc.)

---

## API Overview

**Total Endpoints**: 100+
**Total Lines of API Documentation**: 3,579

### Endpoint Breakdown
- **Authentication**: 12 endpoints (register, login, OAuth, 2FA, etc.)
- **Users**: 15 endpoints (profile, settings, skills, etc.)
- **News**: 10 endpoints (articles, categories, bookmarks)
- **Forum**: 20 endpoints (topics, replies, votes, prompts)
- **Jobs**: 15 endpoints (jobs, applications, companies, matches)
- **LLM Guide**: 8 endpoints (models, use cases, glossary)
- **Platform**: 10 endpoints (search, notifications, follows)
- **Admin**: 10 endpoints (user management, moderation)

---

## Development Timeline

### Phase 0: Foundation (1-2 weeks)
- Project setup
- Database schema
- Authentication system
- Core infrastructure

### Phase 1: MVP (8-10 weeks)
**Must Have Features**
- Sprint 1-2: User management
- Sprint 3-4: News module core
- Sprint 5-6: Forum module core
- Sprint 7-8: Jobs module core
- Sprint 9: Platform features
- Sprint 10: Polish & testing

**Deliverable**: Launch-ready platform

### Phase 2: Post-MVP (3 months)
**Should Have Features**
- News enhancement (model trackers, advanced search)
- Forum enhancement (polls, messaging, badges)
- Jobs enhancement (match v2, alerts, ATS)
- Platform enhancement (AI recommendations)
- Admin tools

### Phase 3: Advanced (3 months)
**Could Have Features**
- Advanced news (series, native comments)
- Advanced forum (code playground, anonymous posting)
- Advanced jobs (ML matching, interview prep)
- LLM Guide (use cases library, comparison tool)

### Phase 4: Scale & Optimize (Ongoing)
- Database optimization
- Elasticsearch migration
- Performance tuning
- Microservices (if needed)
- Mobile apps

---

## Security Highlights

✅ **Authentication**: JWT + refresh tokens, OAuth, 2FA
✅ **Input Validation**: Zod schemas, SQL injection prevention
✅ **Rate Limiting**: Per-user and per-IP limits
✅ **XSS Protection**: CSP headers, sanitization
✅ **CSRF Protection**: SameSite cookies
✅ **HTTPS Only**: Force SSL, secure cookies
✅ **GDPR Compliance**: Privacy controls, data export, deletion

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Page Load | < 2s (desktop), < 3s (mobile) |
| API Response | < 200ms (p95) |
| Database Query | < 50ms (p95) |
| Search | < 300ms |
| Uptime | 99.9% |
| Error Rate | < 0.1% |

---

## Success Metrics

### MVP Launch
- 0 critical bugs
- 100+ beta users
- 50+ articles
- 100+ topics
- 20+ jobs

### Post-MVP (3 months)
- 1,000+ users
- 500+ articles
- 1,000+ topics
- 100+ jobs

### Advanced (6 months)
- 10,000+ users
- 100+ premium subscriptions
- 50+ company accounts

### Scale (12+ months)
- 100,000+ users
- 99.9% uptime
- Sub-second responses

---

## Documentation Quality

This documentation suite has been created to be:

✅ **Comprehensive**: Covers all aspects of the platform
✅ **Actionable**: Specific enough to implement immediately
✅ **Consistent**: Cross-referenced and aligned across documents
✅ **AI-Optimized**: Structured for AI agent comprehension
✅ **Human-Readable**: Clear language and organization
✅ **Future-Proof**: Considers scalability and evolution

**Total**: 10,748 lines of detailed specifications

---

## Next Steps

### For Project Kickoff
1. ✅ Review all documentation (completed - you're here!)
2. ⬜ Set up development environment (Phase 0, Week 1)
3. ⬜ Create database schema (Phase 0, Week 2)
4. ⬜ Implement authentication (Phase 0, Week 2)
5. ⬜ Begin Sprint 1: User Management (Phase 1)

### For Ongoing Development
- Follow [07-DEVELOPMENT_PHASES.md](./07-DEVELOPMENT_PHASES.md) sprint by sprint
- Update documentation as you implement
- Write tests for all features (>80% coverage)
- Deploy to staging frequently
- Gather user feedback early and often

---

## Questions?

**For Clarifications**: Review the specific document related to your question
**For Missing Information**: Check cross-references in related documents
**For Design Rationale**: See [06-TECHNICAL_DECISIONS.md](./06-TECHNICAL_DECISIONS.md)
**For Implementation Order**: See [07-DEVELOPMENT_PHASES.md](./07-DEVELOPMENT_PHASES.md)

---

## Document Maintenance

This documentation should be updated when:
- New features are added
- Architecture changes are made
- API endpoints are modified
- Database schema is altered
- Technical decisions are revised

Keep documentation in sync with implementation to ensure accuracy.

---

**Ready to Build?** 🚀

Start with [README.md](./README.md) for a quick overview, then dive into the specific documentation you need. The entire platform specification is at your fingertips, ready for implementation.

**Happy Coding!**
