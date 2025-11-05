# Neurmatic - Development Phases

**Version**: 2.0
**Methodology**: Agile with 2-week sprints
**MoSCoW Prioritization**: Must → Should → Could → Won't

---

## Table of Contents

1. [Phase 0: Foundation & Setup](#phase-0-foundation--setup)
2. [Phase 1: MVP (Must Have)](#phase-1-mvp-must-have)
3. [Phase 2: Post-MVP Enhancement](#phase-2-post-mvp-enhancement)
4. [Phase 3: Advanced Features](#phase-3-advanced-features)
5. [Phase 4: Scale & Optimize](#phase-4-scale--optimize)

---

## Phase 0: Foundation & Setup
**Duration**: 1-2 weeks
**Goal**: Project initialization and infrastructure setup

### Week 1: Project Setup

#### Backend Setup
- [ ] Initialize Node.js + TypeScript project
- [ ] Set up Express server structure
- [ ] Configure Prisma ORM
- [ ] Set up PostgreSQL database (local + cloud)
- [ ] Configure Redis (local + cloud)
- [ ] Set up environment configuration (.env management)
- [ ] Configure ESLint + Prettier
- [ ] Set up basic folder structure (modules)

#### Frontend Setup
- [ ] Initialize React + TypeScript + Vite project
- [ ] Configure Tailwind CSS
- [ ] Set up folder structure (features)
- [ ] Configure ESLint + Prettier
- [ ] Set up path aliases (@/components, etc.)
- [ ] Install UI library (Radix UI or MUI)
- [ ] Configure i18next (Dutch, English)

#### DevOps Setup
- [ ] Create Git repository
- [ ] Set up GitHub Actions (CI/CD skeleton)
- [ ] Create Docker Compose for local development
- [ ] Set up Sentry for error tracking (dev)
- [ ] Configure deployment pipeline (Railway/AWS)

#### Documentation
- [ ] Create README with setup instructions
- [ ] Document environment variables
- [ ] Create CONTRIBUTING.md

**Deliverable**: Running local development environment

---

### Week 2: Core Infrastructure

#### Database Schema
- [ ] Design and review complete Prisma schema
- [ ] Create initial migration
- [ ] Seed script for development data
  - Default categories (news + forum)
  - LLM models (47+ models)
  - Sample users (admin, moderator, users)
  - Glossary terms
  - Sample articles

#### Authentication System
- [ ] Implement JWT authentication
- [ ] Email/password registration
- [ ] Login endpoint
- [ ] Password reset flow
- [ ] Email verification system
- [ ] Session management (Redis)
- [ ] OAuth setup (Google, LinkedIn, GitHub)
- [ ] 2FA implementation (TOTP)

#### Core Middleware
- [ ] Error handling middleware
- [ ] Validation middleware (Zod)
- [ ] Rate limiting middleware (Redis)
- [ ] Authentication middleware (JWT verification)
- [ ] Role-based authorization middleware
- [ ] CORS configuration
- [ ] Request logging (Winston)

**Deliverable**: Auth system fully functional

---

## Phase 1: MVP (Must Have)
**Duration**: 8-10 weeks
**Goal**: Launch-ready platform with core features

### Sprint 1-2: User Management (2 weeks)

#### User Features
- [ ] User registration flow
- [ ] Email verification
- [ ] Login/logout
- [ ] Password reset
- [ ] Basic profile page
  - Avatar upload
  - Display name, headline, bio
  - Location
- [ ] Profile privacy settings (basic)
- [ ] Account settings
  - Change email
  - Change password
  - Delete account (GDPR)

#### Backend
- [ ] Users API endpoints
- [ ] Profile API endpoints
- [ ] File upload to S3 (avatars)
- [ ] Email service (SendGrid/SES)
- [ ] Email templates (welcome, verification, reset)

#### Frontend
- [ ] Login/register modals
- [ ] Password reset flow
- [ ] Profile page
- [ ] Edit profile form
- [ ] Settings page
- [ ] Upload avatar component

**Deliverable**: Users can register, login, and manage profiles

---

### Sprint 3-4: News Module - Core (2 weeks)

#### News Features
- [ ] Article listing (homepage)
  - Grid/list view
  - Pagination
- [ ] Article detail page
  - Reading time
  - Related articles
- [ ] Category browsing
- [ ] Tag filtering
- [ ] Basic search (PostgreSQL full-text)
- [ ] Bookmarks
  - Save article
  - "Read Later" default collection
  - View bookmarks

#### Backend
- [ ] Articles API (CRUD)
- [ ] Categories API
- [ ] Tags API
- [ ] Bookmarks API
- [ ] Full-text search setup (tsvector)
- [ ] View count tracking
- [ ] Analytics events tracking

#### Frontend
- [ ] News homepage
- [ ] Article card component
- [ ] Article detail page
- [ ] Category filter sidebar
- [ ] Tag filter
- [ ] Search bar with autocomplete
- [ ] Bookmark button
- [ ] Bookmarks page

**Deliverable**: Users can browse, read, search, and bookmark articles

---

### Sprint 5-6: Forum Module - Core (2 weeks)

#### Forum Features
- [ ] Forum homepage
  - Category list
  - Recent topics
- [ ] Topic listing by category
  - Filters (type, status)
  - Sort (recent, most voted)
- [ ] Topic detail page
  - Threaded replies (3 levels)
  - Vote buttons
- [ ] Create topic
  - Rich text editor (markdown)
  - Category selection
  - Tag selection (max 5)
  - Code blocks
- [ ] Reply to topic/reply
- [ ] Voting system
  - Upvote/downvote
  - Daily limit (50)
- [ ] Basic reputation system
  - Points calculation
  - Reputation display

#### Backend
- [ ] Forum categories API
- [ ] Topics API (CRUD)
- [ ] Replies API (CRUD)
- [ ] Votes API
- [ ] Reputation calculation
- [ ] Rate limiting (10 topics/hour, 50 votes/day)
- [ ] Spam detection (basic)

#### Frontend
- [ ] Forum homepage
- [ ] Category page
- [ ] Topic list component
- [ ] Topic detail page
- [ ] Create topic form
- [ ] Reply editor component
- [ ] Vote buttons component
- [ ] Reputation display
- [ ] Markdown editor (Tiptap/TinyMCE)

**Deliverable**: Users can create topics, reply, and vote

---

### Sprint 7-8: Jobs Module - Core (2 weeks)

#### Job Features
- [ ] Job listing page
  - Filters (location, type, experience, salary)
  - Sort (newest, best match)
- [ ] Job detail page
  - Match score (if logged in)
  - Company profile
- [ ] Basic filters
  - Location type (remote/hybrid/on-site)
  - Experience level
  - Salary range
- [ ] Easy Apply
  - One-click with profile data
  - Cover letter (optional)
- [ ] Application tracking
  - View all applications
  - Status tracking

#### Candidate Profile
- [ ] Skills section
  - Add skills with proficiency
- [ ] Work experience
  - Add past roles
- [ ] Portfolio
  - Add projects (max 5 featured)
- [ ] Job preferences
  - Availability status
  - Desired roles
  - Salary expectations

#### Company Features
- [ ] Company profile (basic)
  - Logo, description
  - Active jobs
- [ ] Post job
  - Job form with LLM-specific fields
  - Skills with levels
- [ ] View applications (basic ATS)
  - Application list
  - View candidate profile
  - Change status

#### Backend
- [ ] Jobs API (CRUD)
- [ ] Companies API
- [ ] Applications API
- [ ] Basic matching algorithm
  - Skills overlap
  - Experience match
- [ ] Candidate profile API
  - Skills, experience, portfolio

#### Frontend
- [ ] Jobs homepage
- [ ] Job card component
- [ ] Job detail page
- [ ] Job filters sidebar
- [ ] Easy Apply modal
- [ ] Applications dashboard
- [ ] Candidate profile builder
- [ ] Company profile page
- [ ] Post job form
- [ ] Basic ATS dashboard

**Deliverable**: Users can browse jobs, apply, and companies can post jobs

---

### Sprint 9: Platform Features (1 week)

#### Platform-Wide
- [ ] Unified dashboard
  - For You feed (basic recommendations)
  - Latest news
  - Active forum topics
  - Job matches
- [ ] Universal search (basic)
  - Search across news, forum, jobs
  - Simple autocomplete
- [ ] Notifications system
  - In-app notifications
  - Email notifications
  - Notification preferences
- [ ] Following system
  - Follow users
  - Follow tags
  - Follow companies
- [ ] Responsive design
  - Mobile navigation
  - Tablet layout
  - Desktop layout

#### Backend
- [ ] Dashboard API (aggregated data)
- [ ] Universal search API
- [ ] Notifications API
- [ ] Follows API
- [ ] Email notification worker (Bull)

#### Frontend
- [ ] Dashboard page
- [ ] Universal search component
- [ ] Notification bell + dropdown
- [ ] Follow buttons
- [ ] Responsive navigation
- [ ] Mobile menu

**Deliverable**: Unified platform experience

---

### Sprint 10: Polish & Testing (1 week)

#### Quality Assurance
- [ ] End-to-end testing (critical paths)
  - Registration → onboarding
  - Article browsing → bookmark
  - Forum post → reply → vote
  - Job application flow
- [ ] Performance testing
  - Lighthouse audit (target: >90)
  - API response times (<200ms p95)
- [ ] Security audit
  - OWASP Top 10 check
  - Penetration testing (basic)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Browser compatibility testing
- [ ] Mobile device testing

#### Bug Fixes & Polish
- [ ] Fix critical bugs
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Improve empty states
- [ ] Optimize images
- [ ] Add analytics tracking (Mixpanel/GA4)

#### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide (help center articles)
- [ ] Admin guide
- [ ] Update README

#### Deployment
- [ ] Production environment setup
- [ ] Database migration (staging → production)
- [ ] SSL certificate
- [ ] CDN configuration
- [ ] Monitoring setup (Sentry, logs)
- [ ] Backup configuration

**Deliverable**: Production-ready MVP

---

## Phase 2: Post-MVP Enhancement
**Duration**: 3 months (6 sprints)
**Goal**: "Should Have" features

### Sprint 11-12: News Enhancement (2 weeks)

#### Features
- [ ] Model tracker pages
  - Dedicated page per LLM
  - All news about model
  - Model specs & benchmarks
  - Related jobs
- [ ] Advanced search
  - More filters (difficulty, has code, model)
  - Save searches
  - Search alerts
- [ ] Related articles algorithm
  - Tag-based similarity
  - Content-based similarity
- [ ] Reading progress tracking
- [ ] Newsletter
  - Weekly digest email
  - Custom frequency settings
- [ ] RSS feed integration (admin)
  - Auto-import articles
  - Review queue

#### Implementation
- [ ] Model tracker API & UI
- [ ] Enhanced search service
- [ ] Saved searches feature
- [ ] Email alert system (scheduler)
- [ ] Recommendation algorithm (v1)
- [ ] Newsletter template & scheduler
- [ ] RSS feed importer

**Deliverable**: Enhanced news discovery

---

### Sprint 13-14: Forum Enhancement (2 weeks)

#### Features
- [ ] Additional topic types
  - Showcase
  - Tutorial
  - Announcement (mod only)
- [ ] Polls
  - Single/multiple choice
  - Deadline
  - Results visualization
- [ ] Private messaging
  - One-on-one conversations
  - Message threads
  - Attachments
- [ ] Badges system
  - Skill badges (Prompt Master, RAG Expert)
  - Activity badges (Streak Master, Popular)
  - Special badges (Beta Tester)
- [ ] Leaderboards
  - Weekly top contributors
  - Monthly hall of fame
  - All-time legends
- [ ] Advanced reputation
  - Reputation levels (Novice → Legend)
  - Global rank
- [ ] Prompt Library (basic)
  - Community prompts
  - Categorize by use case
  - Upvote/downvote
- [ ] @mentions
- [ ] Emoji reactions (👍👎❤️🎉🤔)

#### Implementation
- [ ] Polls API & UI
- [ ] Direct messaging system (WebSocket)
- [ ] Badges system
- [ ] Leaderboard API & UI
- [ ] Reputation levels & ranks
- [ ] Prompt Library API & UI
- [ ] Mentions notification system
- [ ] Emoji reactions

**Deliverable**: Richer forum engagement

---

### Sprint 15-16: Jobs Enhancement (2 weeks)

#### Features
- [ ] Match algorithm v2
  - ML-based scoring
  - Multiple factors (40% skills, etc.)
  - Match explanations ("Why this match")
- [ ] Saved searches
  - Save job filters
  - Email alerts for new matches
- [ ] Job alerts
  - Daily/weekly digest
  - High-match notifications (>80%)
- [ ] Favorite jobs
  - Save for later
  - Notes per job
- [ ] Company analytics (basic)
  - Job views
  - Application count
  - Conversion rate
- [ ] ATS enhancements
  - Kanban pipeline view
  - Team notes & ratings
  - Bulk actions
- [ ] LLM-specific filtering
  - Filter by models (GPT-4, Claude, etc.)
  - Filter by frameworks (LangChain, etc.)

#### Implementation
- [ ] Enhanced matching service
- [ ] Background matching worker
- [ ] Saved job searches
- [ ] Job alert scheduler
- [ ] Company analytics dashboard
- [ ] Enhanced ATS UI (Kanban)
- [ ] LLM filter components

**Deliverable**: Smarter job matching

---

### Sprint 17-18: Platform Enhancement (2 weeks)

#### Features
- [ ] Personalized dashboard
  - AI-recommended content
  - Customizable widgets
  - Drag & drop layout
- [ ] Following system enhancements
  - Follow categories
  - Follow models
  - Following feed
- [ ] AI recommendations (basic)
  - Collaborative filtering
  - Content-based filtering
  - For You feed
- [ ] Universal search v2
  - Cross-content search
  - Better autocomplete
  - Search history
  - Filters post-search
- [ ] Email digest improvements
  - Weekly summary
  - Personalized content

#### Implementation
- [ ] Recommendation engine (v1)
- [ ] Dashboard customization
- [ ] Enhanced following system
- [ ] Improved search service
- [ ] Email digest templates

**Deliverable**: Personalized experience

---

### Sprint 19-20: Admin & Moderation (2 weeks)

#### Features
- [ ] Admin dashboard
  - Platform stats (DAU, MAU)
  - Key metrics
  - Quick actions
- [ ] Content moderation
  - Moderation queue
  - Bulk actions
  - Moderation logs
- [ ] User management
  - User list with filters
  - User detail view
  - Suspend/ban users
- [ ] News CMS improvements
  - Article scheduling
  - Revision history
  - Workflow (Draft → Review → Published)
- [ ] Forum moderation tools
  - Pin/lock topics
  - Move to category
  - Merge duplicates
  - Tag management

#### Implementation
- [ ] Admin dashboard API & UI
- [ ] Moderation queue system
- [ ] User management UI
- [ ] CMS workflow
- [ ] Moderation tools UI
- [ ] Audit logs

**Deliverable**: Efficient platform management

---

## Phase 3: Advanced Features
**Duration**: 3 months (6 sprints)
**Goal**: "Could Have" features

### Sprint 21-22: Advanced News (2 weeks)

- [ ] Author profiles
- [ ] Article series/collections
- [ ] Native comments (not Disqus)
- [ ] Reading lists (curated)
- [ ] Audio version (text-to-speech)
- [ ] Content rating system
- [ ] Auto-link related forum discussions

---

### Sprint 23-24: Advanced Forum (2 weeks)

- [ ] Advanced polls (ranked choice)
- [ ] Best answer of week
- [ ] Solved questions filter
- [ ] Unanswered queue
- [ ] Prompt Library v2
  - Fork prompts
  - Version history
  - Effectiveness rating
- [ ] Code playground integration
- [ ] Paper discussion type (arXiv links)
- [ ] Anonymous posting (optional)

---

### Sprint 25-26: Advanced Jobs (2 weeks)

- [ ] Advanced matching (ML-based)
- [ ] Salary calculator/negotiator
- [ ] Interview prep tools
- [ ] Portfolio optimizer
- [ ] Screening questions (custom per job)
- [ ] Video interview integration
- [ ] Referral system
- [ ] Talent pool search (recruiters)

---

### Sprint 27-28: LLM Guide (2 weeks)

- [ ] Use Cases Library
  - Community submissions
  - Review workflow
  - Rich content (code, metrics)
- [ ] Model comparison tool
  - Side-by-side comparison (2-5 models)
  - Benchmark charts
  - Export comparison
- [ ] Use case finder tool
  - Match use case to models
- [ ] Glossary enhancements
  - Related terms
  - Examples
- [ ] API quickstart per model
  - Code snippets
  - Best practices

---

### Sprint 29-30: Platform Advanced (2 weeks)

- [ ] Advanced analytics (users)
  - Personal stats
  - Activity trends
- [ ] Achievements/quests
  - Gamification
- [ ] Mentorship matching
  - Connect learners with experts
- [ ] Events calendar
  - Webinars, conferences
- [ ] Live webinars (integration)
- [ ] Learning paths
  - Curated content collections
  - Progress tracking

---

## Phase 4: Scale & Optimize
**Duration**: Ongoing
**Goal**: Performance, scalability, and growth

### Infrastructure Scaling

#### Database Optimization
- [ ] Set up read replicas (PostgreSQL)
- [ ] Implement database partitioning (analytics table)
- [ ] Optimize slow queries (EXPLAIN ANALYZE)
- [ ] Archive old data (soft deletes, analytics)
- [ ] Database connection pooling (PgBouncer)

#### Search Scaling
- [ ] Migrate to Elasticsearch
  - Set up Elasticsearch cluster
  - Implement data syncing (Bull jobs)
  - Migrate search queries
  - Add advanced features (autocomplete, typo tolerance)
- [ ] Implement search analytics

#### Caching Optimization
- [ ] Expand Redis caching
  - Cache hot articles
  - Cache user profiles
  - Cache leaderboards
- [ ] Implement CDN caching
  - Static assets
  - Public API responses
- [ ] Cache warming strategies

#### Performance
- [ ] Frontend performance
  - Code splitting per route
  - Lazy load images
  - Implement virtual scrolling (long lists)
  - Optimize bundle size
  - Service worker optimization
- [ ] Backend performance
  - API response time optimization
  - Database query optimization
  - Implement GraphQL (if needed)
- [ ] Load testing
  - Simulate high traffic (k6, Artillery)
  - Identify bottlenecks
  - Stress test critical paths

---

### Microservices Migration (If Needed)

**When to Migrate**:
- >100K MAU (Monthly Active Users)
- Specific bottlenecks (e.g., job matching CPU-heavy)
- Team size justifies complexity

**Migration Order**:
1. Search Service (first to extract)
2. Job Matching Service
3. Notification Service
4. Analytics Service

**Implementation**:
- [ ] Set up API Gateway
- [ ] Implement service mesh (optional)
- [ ] Event-driven architecture (message queue)
- [ ] Service discovery
- [ ] Distributed tracing (Jaeger)

---

### Advanced Features

#### AI/ML Enhancements
- [ ] Personalized recommendations (v2)
  - Deep learning models
  - A/B testing
- [ ] Content moderation AI
  - Spam detection
  - Toxic content detection
- [ ] Smart job matching
  - Resume parsing
  - Skill extraction
  - Match score ML model

#### Internationalization
- [ ] Add languages (German, French, Spanish)
- [ ] RTL support (Arabic, Hebrew)
- [ ] Locale-specific content

#### Mobile Apps
- [ ] React Native mobile app
  - iOS app
  - Android app
  - Push notifications
- [ ] App store deployment

---

## MoSCoW Mapping

### Must Have (MVP - Phase 1)
✅ User authentication (email + OAuth)
✅ User profiles (basic)
✅ News articles (CRUD, read, bookmark)
✅ Categories & tags
✅ Forum (topics, replies, voting)
✅ Reputation system (basic)
✅ Moderation tools (basic)
✅ Jobs (post, browse, apply)
✅ Company profiles (basic)
✅ Candidate profiles
✅ Application tracking
✅ Basic search
✅ Responsive design
✅ Dark mode
✅ Notifications (in-app + email)

### Should Have (Post-MVP - Phase 2)
- Model tracker pages
- Advanced search & saved searches
- Polls & private messaging
- Badges & leaderboards
- Prompt Library (basic)
- Match algorithm v2
- Job alerts & saved searches
- Company analytics
- ATS enhancements
- Personalized dashboard
- AI recommendations (basic)
- Following system (enhanced)
- Admin dashboard
- CMS workflow

### Could Have (Advanced - Phase 3)
- Author profiles
- Article series
- Native comments
- Advanced polls
- Prompt Library (advanced: fork, versioning)
- Code playground
- Use Cases Library
- Model comparison tool
- Achievements/gamification
- Mentorship matching
- Events & webinars

### Won't Have (Out of Scope)
- Video hosting
- Live streaming
- E-commerce/payments
- Native mobile apps (Phase 1-3)
- Real-time collaboration
- Blockchain features

---

## Sprint Template

### Sprint Planning
1. **Sprint Goal**: Clear objective
2. **User Stories**: From backlog
3. **Acceptance Criteria**: Definition of done
4. **Estimation**: Story points
5. **Capacity**: Team availability

### Daily Standup
- What did you do yesterday?
- What will you do today?
- Any blockers?

### Sprint Review
- Demo completed features
- Stakeholder feedback
- Update product backlog

### Sprint Retrospective
- What went well?
- What could improve?
- Action items for next sprint

---

## Success Metrics per Phase

### Phase 1 (MVP)
- [ ] Platform launches successfully
- [ ] 0 critical bugs in production
- [ ] Lighthouse score >85
- [ ] API response times <300ms (p95)
- [ ] 100+ beta users registered
- [ ] 50+ articles published
- [ ] 100+ forum topics created
- [ ] 20+ jobs posted

### Phase 2 (Post-MVP)
- [ ] 1,000+ registered users
- [ ] 500+ articles published
- [ ] 1,000+ forum topics
- [ ] 100+ jobs posted
- [ ] 500+ applications submitted
- [ ] Email open rate >25%
- [ ] User retention >40% (monthly)
- [ ] Average session duration >5 min

### Phase 3 (Advanced)
- [ ] 10,000+ registered users
- [ ] 5,000+ articles
- [ ] 10,000+ forum topics
- [ ] 500+ jobs
- [ ] Premium subscriptions: 100+
- [ ] Company accounts: 50+
- [ ] User engagement: 60% MAU/MAU ratio
- [ ] Average session duration >8 min

### Phase 4 (Scale)
- [ ] 100,000+ users
- [ ] Sub-second API responses (p99)
- [ ] 99.9% uptime
- [ ] <0.1% error rate
- [ ] Successful microservices migration (if needed)

---

## Risk Management

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database performance degradation | High | Implement caching, indexing, read replicas early |
| Third-party service outage (OAuth, email) | Medium | Fallback mechanisms, queue retries |
| Security breach | Critical | Regular audits, penetration testing, rate limiting |
| Scalability bottlenecks | High | Load testing, monitoring, modular architecture |
| Data loss | Critical | Automated backups, point-in-time recovery |

### Project Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Feature creep | High | Strict MoSCoW prioritization, sprint discipline |
| Underestimated complexity | Medium | Buffer time, regular re-estimation |
| Key developer unavailability | Medium | Documentation, knowledge sharing, pair programming |
| Delayed launch | Medium | MVP focus, cut scope if needed |
| Low user adoption | High | Beta testing, user feedback loops, marketing |

---

## Definition of Done

### Feature Complete When:
- [ ] Code written and reviewed (PR approved)
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests written (critical paths)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] No critical/high bugs
- [ ] Accessibility tested (WCAG AA)
- [ ] Performance tested (meets targets)
- [ ] Deployed to staging
- [ ] Stakeholder approved

### Sprint Complete When:
- [ ] All planned stories completed
- [ ] Sprint goal achieved
- [ ] Demo given to stakeholders
- [ ] Retrospective completed
- [ ] Backlog updated

### Phase Complete When:
- [ ] All phase objectives met
- [ ] Success metrics achieved
- [ ] Documentation complete
- [ ] Production deployment successful
- [ ] Post-launch monitoring stable

---

## Related Documentation

- [Project Overview](./01-PROJECT_OVERVIEW.md) - System architecture
- [Database Schema](./02-DATABASE_SCHEMA.md) - Data model to implement
- [API Endpoints](./03-API_ENDPOINTS.md) - APIs to build
- [User Workflows](./04-USER_WORKFLOWS.md) - Features to implement
- [File Structure](./05-FILE_STRUCTURE.md) - Code organization
- [Technical Decisions](./06-TECHNICAL_DECISIONS.md) - Why these choices
