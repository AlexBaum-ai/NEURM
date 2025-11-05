# Neurmatic - File Structure

**Version**: 2.0
**Stack**: React + TypeScript (Frontend) | Node.js + TypeScript (Backend)

---

## Repository Structure Overview

```
neurmatic/
├── frontend/              # React frontend application
├── backend/               # Node.js backend API
├── shared/                # Shared types, constants, utilities
├── infrastructure/        # DevOps, Docker, deployment configs
├── docs/                  # Additional documentation
└── README.md
```

---

## Frontend Structure (React + TypeScript + Vite)

```
frontend/
├── public/                          # Static assets
│   ├── favicon.ico
│   ├── manifest.json               # PWA manifest
│   ├── robots.txt
│   └── sw.js                       # Service worker
│
├── src/
│   ├── assets/                     # Images, fonts, icons
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── common/                 # Generic components
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Card/
│   │   │   ├── Dropdown/
│   │   │   ├── Tabs/
│   │   │   ├── Pagination/
│   │   │   └── LoadingSpinner/
│   │   │
│   │   ├── layout/                 # Layout components
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   ├── UserMenu.tsx
│   │   │   │   └── SearchBar.tsx
│   │   │   ├── Footer/
│   │   │   ├── Sidebar/
│   │   │   └── MobileNav/
│   │   │
│   │   ├── forms/                  # Form components
│   │   │   ├── LoginForm/
│   │   │   ├── RegisterForm/
│   │   │   ├── ProfileForm/
│   │   │   └── validators/         # Zod schemas
│   │   │
│   │   └── editors/                # Rich text editors
│   │       ├── MarkdownEditor/
│   │       ├── WYSIWYGEditor/
│   │       └── CodeEditor/
│   │
│   ├── features/                   # Feature-based modules
│   │   │
│   │   ├── auth/                   # Authentication feature
│   │   │   ├── components/
│   │   │   │   ├── LoginModal.tsx
│   │   │   │   ├── RegisterModal.tsx
│   │   │   │   └── TwoFactorSetup.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useSession.ts
│   │   │   ├── api/
│   │   │   │   └── authApi.ts      # API calls
│   │   │   ├── store/
│   │   │   │   └── authStore.ts    # Zustand store
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts
│   │   │   └── utils/
│   │   │       ├── tokenManager.ts
│   │   │       └── authHelpers.ts
│   │   │
│   │   ├── news/                   # News module
│   │   │   ├── components/
│   │   │   │   ├── ArticleCard.tsx
│   │   │   │   ├── ArticleDetail.tsx
│   │   │   │   ├── ArticleList.tsx
│   │   │   │   ├── CategoryFilter.tsx
│   │   │   │   ├── TagFilter.tsx
│   │   │   │   ├── BookmarkButton.tsx
│   │   │   │   └── RelatedArticles.tsx
│   │   │   ├── pages/
│   │   │   │   ├── NewsHomePage.tsx
│   │   │   │   ├── ArticlePage.tsx
│   │   │   │   ├── CategoryPage.tsx
│   │   │   │   ├── ModelTrackerPage.tsx
│   │   │   │   └── BookmarksPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useArticles.ts
│   │   │   │   ├── useBookmarks.ts
│   │   │   │   └── useCategories.ts
│   │   │   ├── api/
│   │   │   │   └── newsApi.ts
│   │   │   ├── store/
│   │   │   │   └── newsStore.ts
│   │   │   └── types/
│   │   │       └── news.types.ts
│   │   │
│   │   ├── forum/                  # Forum module
│   │   │   ├── components/
│   │   │   │   ├── TopicCard.tsx
│   │   │   │   ├── TopicDetail.tsx
│   │   │   │   ├── ReplyList.tsx
│   │   │   │   ├── ReplyForm.tsx
│   │   │   │   ├── VoteButtons.tsx
│   │   │   │   ├── AcceptedAnswerBadge.tsx
│   │   │   │   ├── ReputationDisplay.tsx
│   │   │   │   ├── BadgeDisplay.tsx
│   │   │   │   └── PromptLibraryCard.tsx
│   │   │   ├── pages/
│   │   │   │   ├── ForumHomePage.tsx
│   │   │   │   ├── TopicPage.tsx
│   │   │   │   ├── CreateTopicPage.tsx
│   │   │   │   ├── CategoryPage.tsx
│   │   │   │   ├── PromptLibraryPage.tsx
│   │   │   │   └── LeaderboardPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useTopics.ts
│   │   │   │   ├── useReplies.ts
│   │   │   │   ├── useVoting.ts
│   │   │   │   └── useReputation.ts
│   │   │   ├── api/
│   │   │   │   └── forumApi.ts
│   │   │   ├── store/
│   │   │   │   └── forumStore.ts
│   │   │   └── types/
│   │   │       └── forum.types.ts
│   │   │
│   │   ├── jobs/                   # Jobs module
│   │   │   ├── components/
│   │   │   │   ├── JobCard.tsx
│   │   │   │   ├── JobDetail.tsx
│   │   │   │   ├── JobFilters.tsx
│   │   │   │   ├── MatchScore.tsx
│   │   │   │   ├── EasyApplyModal.tsx
│   │   │   │   ├── ApplicationCard.tsx
│   │   │   │   ├── CompanyProfile.tsx
│   │   │   │   └── ATSDashboard.tsx
│   │   │   ├── pages/
│   │   │   │   ├── JobsHomePage.tsx
│   │   │   │   ├── JobDetailPage.tsx
│   │   │   │   ├── CompanyPage.tsx
│   │   │   │   ├── ApplicationsPage.tsx
│   │   │   │   ├── PostJobPage.tsx
│   │   │   │   └── JobMatchesPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useJobs.ts
│   │   │   │   ├── useApplications.ts
│   │   │   │   ├── useMatches.ts
│   │   │   │   └── useCompany.ts
│   │   │   ├── api/
│   │   │   │   └── jobsApi.ts
│   │   │   ├── store/
│   │   │   │   └── jobsStore.ts
│   │   │   └── types/
│   │   │       └── jobs.types.ts
│   │   │
│   │   ├── guide/                  # LLM Guide module
│   │   │   ├── components/
│   │   │   │   ├── ModelCard.tsx
│   │   │   │   ├── ModelComparison.tsx
│   │   │   │   ├── UseCaseCard.tsx
│   │   │   │   ├── GlossaryList.tsx
│   │   │   │   └── BenchmarkChart.tsx
│   │   │   ├── pages/
│   │   │   │   ├── ModelsPage.tsx
│   │   │   │   ├── ModelDetailPage.tsx
│   │   │   │   ├── CompareModelsPage.tsx
│   │   │   │   ├── UseCasesPage.tsx
│   │   │   │   ├── UseCaseDetailPage.tsx
│   │   │   │   └── GlossaryPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useModels.ts
│   │   │   │   └── useUseCases.ts
│   │   │   ├── api/
│   │   │   │   └── guideApi.ts
│   │   │   └── types/
│   │   │       └── guide.types.ts
│   │   │
│   │   ├── user/                   # User profile & settings
│   │   │   ├── components/
│   │   │   │   ├── ProfileHeader.tsx
│   │   │   │   ├── SkillsList.tsx
│   │   │   │   ├── WorkExperienceList.tsx
│   │   │   │   ├── PortfolioGrid.tsx
│   │   │   │   ├── PrivacySettings.tsx
│   │   │   │   └── ProfileStats.tsx
│   │   │   ├── pages/
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   ├── EditProfilePage.tsx
│   │   │   │   ├── SettingsPage.tsx
│   │   │   │   └── NotificationPrefsPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useProfile.ts
│   │   │   │   └── useSettings.ts
│   │   │   └── api/
│   │   │       └── userApi.ts
│   │   │
│   │   ├── dashboard/              # Unified dashboard
│   │   │   ├── components/
│   │   │   │   ├── DashboardWidget.tsx
│   │   │   │   ├── ForYouFeed.tsx
│   │   │   │   ├── TrendingWidget.tsx
│   │   │   │   ├── StatsWidget.tsx
│   │   │   │   └── QuickActions.tsx
│   │   │   ├── pages/
│   │   │   │   └── DashboardPage.tsx
│   │   │   └── hooks/
│   │   │       └── useDashboard.ts
│   │   │
│   │   ├── search/                 # Universal search
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── SearchResults.tsx
│   │   │   │   ├── AutocompleteDropdown.tsx
│   │   │   │   └── SavedSearches.tsx
│   │   │   ├── pages/
│   │   │   │   └── SearchPage.tsx
│   │   │   └── hooks/
│   │   │       └── useSearch.ts
│   │   │
│   │   ├── notifications/          # Notifications system
│   │   │   ├── components/
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   ├── NotificationList.tsx
│   │   │   │   └── NotificationItem.tsx
│   │   │   └── hooks/
│   │   │       ├── useNotifications.ts
│   │   │       └── useWebSocket.ts
│   │   │
│   │   ├── messages/               # Direct messaging
│   │   │   ├── components/
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   ├── MessageThread.tsx
│   │   │   │   └── MessageInput.tsx
│   │   │   ├── pages/
│   │   │   │   └── MessagesPage.tsx
│   │   │   └── hooks/
│   │   │       └── useMessages.ts
│   │   │
│   │   └── admin/                  # Admin panel
│   │       ├── components/
│   │       │   ├── AdminDashboard.tsx
│   │       │   ├── UserManagement.tsx
│   │       │   ├── ContentModeration.tsx
│   │       │   └── AnalyticsCharts.tsx
│   │       ├── pages/
│   │       │   ├── AdminHomePage.tsx
│   │       │   ├── UsersPage.tsx
│   │       │   ├── ContentPage.tsx
│   │       │   └── ModerationQueue.tsx
│   │       └── hooks/
│   │           └── useAdmin.ts
│   │
│   ├── hooks/                      # Global custom hooks
│   │   ├── useDebounce.ts
│   │   ├── useInfiniteScroll.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   ├── usePagination.ts
│   │   └── useClickOutside.ts
│   │
│   ├── lib/                        # Third-party lib configs
│   │   ├── axios.ts               # Axios instance config
│   │   ├── reactQuery.ts          # React Query config
│   │   ├── i18n.ts                # i18next config
│   │   └── sentry.ts              # Sentry error tracking
│   │
│   ├── services/                   # API service layer
│   │   ├── api.ts                 # Base API client
│   │   ├── auth.service.ts
│   │   ├── news.service.ts
│   │   ├── forum.service.ts
│   │   ├── jobs.service.ts
│   │   └── websocket.service.ts
│   │
│   ├── store/                      # Global state management
│   │   ├── index.ts               # Store configuration
│   │   ├── authSlice.ts           # Auth state
│   │   ├── uiSlice.ts             # UI state (theme, modals)
│   │   └── notificationsSlice.ts  # Notifications state
│   │
│   ├── utils/                      # Utility functions
│   │   ├── formatters.ts          # Date, number formatting
│   │   ├── validators.ts          # Validation helpers
│   │   ├── helpers.ts             # Generic helpers
│   │   ├── constants.ts           # App constants
│   │   └── errorHandlers.ts       # Error handling
│   │
│   ├── styles/                     # Global styles
│   │   ├── globals.css            # Global CSS
│   │   ├── variables.css          # CSS variables
│   │   ├── themes/                # Theme definitions
│   │   │   ├── light.css
│   │   │   └── dark.css
│   │   └── tailwind.css           # Tailwind imports
│   │
│   ├── types/                      # Global TypeScript types
│   │   ├── api.types.ts
│   │   ├── models.types.ts
│   │   └── global.d.ts
│   │
│   ├── routes/                     # Routing configuration
│   │   ├── index.tsx              # Route definitions
│   │   ├── ProtectedRoute.tsx     # Auth guard
│   │   └── RoleRoute.tsx          # Role-based guard
│   │
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   └── vite-env.d.ts              # Vite types
│
├── .env.example                    # Environment variables template
├── .env.development
├── .env.production
├── .eslintrc.json                  # ESLint configuration
├── .prettierrc                     # Prettier configuration
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── package.json
└── README.md
```

---

## Backend Structure (Node.js + TypeScript + Express)

```
backend/
├── src/
│   ├── app.ts                      # Express app setup
│   ├── server.ts                   # Server entry point
│   │
│   ├── config/                     # Configuration
│   │   ├── database.ts            # Prisma client
│   │   ├── redis.ts               # Redis client
│   │   ├── elasticsearch.ts       # Elasticsearch client
│   │   ├── aws.ts                 # AWS S3 config
│   │   ├── email.ts               # Email service config
│   │   ├── passport.ts            # OAuth strategies
│   │   └── env.ts                 # Environment validation
│   │
│   ├── modules/                    # Feature modules
│   │   │
│   │   ├── auth/                   # Authentication module
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.validation.ts  # Zod schemas
│   │   │   └── strategies/
│   │   │       ├── jwt.strategy.ts
│   │   │       ├── google.strategy.ts
│   │   │       ├── linkedin.strategy.ts
│   │   │       └── github.strategy.ts
│   │   │
│   │   ├── users/                  # User management
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts # Prisma queries
│   │   │   ├── users.validation.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-profile.dto.ts
│   │   │
│   │   ├── news/                   # News module
│   │   │   ├── articles/
│   │   │   │   ├── articles.routes.ts
│   │   │   │   ├── articles.controller.ts
│   │   │   │   ├── articles.service.ts
│   │   │   │   ├── articles.repository.ts
│   │   │   │   └── articles.validation.ts
│   │   │   ├── categories/
│   │   │   │   └── ... (same structure)
│   │   │   ├── bookmarks/
│   │   │   │   └── ...
│   │   │   └── index.ts           # Module exports
│   │   │
│   │   ├── forum/                  # Forum module
│   │   │   ├── topics/
│   │   │   │   ├── topics.routes.ts
│   │   │   │   ├── topics.controller.ts
│   │   │   │   ├── topics.service.ts
│   │   │   │   ├── topics.repository.ts
│   │   │   │   └── topics.validation.ts
│   │   │   ├── replies/
│   │   │   │   └── ...
│   │   │   ├── votes/
│   │   │   │   └── ...
│   │   │   ├── reputation/
│   │   │   │   └── ...
│   │   │   ├── prompts/
│   │   │   │   └── ...
│   │   │   └── index.ts
│   │   │
│   │   ├── jobs/                   # Jobs module
│   │   │   ├── jobs/
│   │   │   │   ├── jobs.routes.ts
│   │   │   │   ├── jobs.controller.ts
│   │   │   │   ├── jobs.service.ts
│   │   │   │   ├── jobs.repository.ts
│   │   │   │   └── jobs.validation.ts
│   │   │   ├── applications/
│   │   │   │   └── ...
│   │   │   ├── companies/
│   │   │   │   └── ...
│   │   │   ├── matching/
│   │   │   │   ├── matching.service.ts  # Match algorithm
│   │   │   │   └── matching.worker.ts   # Background job
│   │   │   └── index.ts
│   │   │
│   │   ├── guide/                  # LLM Guide module
│   │   │   ├── models/
│   │   │   ├── use-cases/
│   │   │   ├── glossary/
│   │   │   └── index.ts
│   │   │
│   │   ├── search/                 # Universal search
│   │   │   ├── search.routes.ts
│   │   │   ├── search.controller.ts
│   │   │   ├── search.service.ts   # Elasticsearch queries
│   │   │   └── indexing.service.ts # Index management
│   │   │
│   │   ├── notifications/          # Notifications
│   │   │   ├── notifications.routes.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── notifications.worker.ts  # Background sending
│   │   │   └── templates/          # Email templates
│   │   │       ├── welcome.html
│   │   │       ├── verification.html
│   │   │       └── digest.html
│   │   │
│   │   ├── messages/               # Direct messaging
│   │   │   ├── messages.routes.ts
│   │   │   ├── messages.controller.ts
│   │   │   ├── messages.service.ts
│   │   │   └── websocket/
│   │   │       └── messaging.gateway.ts
│   │   │
│   │   ├── admin/                  # Admin module
│   │   │   ├── admin.routes.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── moderation/
│   │   │       ├── moderation.controller.ts
│   │   │       └── moderation.service.ts
│   │   │
│   │   └── analytics/              # Analytics tracking
│   │       ├── analytics.service.ts
│   │       └── analytics.worker.ts
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── auth.middleware.ts      # JWT verification
│   │   ├── role.middleware.ts      # Role-based access
│   │   ├── rateLimiter.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   ├── logger.middleware.ts
│   │   ├── cors.middleware.ts
│   │   └── upload.middleware.ts    # File upload (Multer)
│   │
│   ├── utils/                      # Utility functions
│   │   ├── logger.ts              # Winston logger
│   │   ├── password.ts            # bcrypt helpers
│   │   ├── jwt.ts                 # JWT helpers
│   │   ├── email.ts               # Email sender
│   │   ├── slug.ts                # Slug generation
│   │   ├── sanitize.ts            # HTML sanitization
│   │   ├── pagination.ts          # Pagination helper
│   │   └── errors.ts              # Custom error classes
│   │
│   ├── types/                      # TypeScript types
│   │   ├── express.d.ts           # Express type extensions
│   │   ├── models.types.ts
│   │   └── api.types.ts
│   │
│   ├── jobs/                       # Background jobs (Bull)
│   │   ├── queues/
│   │   │   ├── email.queue.ts
│   │   │   ├── notification.queue.ts
│   │   │   ├── matching.queue.ts
│   │   │   └── analytics.queue.ts
│   │   ├── workers/
│   │   │   ├── email.worker.ts
│   │   │   ├── notification.worker.ts
│   │   │   └── matching.worker.ts
│   │   └── schedulers/
│   │       ├── daily-digest.scheduler.ts
│   │       └── cleanup.scheduler.ts
│   │
│   ├── websocket/                  # WebSocket server
│   │   ├── server.ts
│   │   ├── handlers/
│   │   │   ├── notification.handler.ts
│   │   │   └── messaging.handler.ts
│   │   └── middleware/
│   │       └── auth.middleware.ts
│   │
│   └── prisma/                     # Prisma ORM
│       ├── schema.prisma           # Database schema
│       ├── migrations/             # Migration files
│       └── seed.ts                 # Database seeding
│
├── tests/                          # Test files
│   ├── unit/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── utils/
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── news.test.ts
│   │   ├── forum.test.ts
│   │   └── jobs.test.ts
│   ├── e2e/
│   │   └── user-journeys.test.ts
│   └── setup.ts                    # Test configuration
│
├── .env.example
├── .env.development
├── .env.test
├── .env.production
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── jest.config.js                  # Jest configuration
├── nodemon.json                    # Nodemon configuration
├── package.json
└── README.md
```

---

## Shared Module (Monorepo Pattern)

```
shared/
├── src/
│   ├── types/                      # Shared TypeScript types
│   │   ├── user.types.ts
│   │   ├── article.types.ts
│   │   ├── topic.types.ts
│   │   ├── job.types.ts
│   │   └── api.types.ts
│   │
│   ├── constants/                  # Shared constants
│   │   ├── roles.ts
│   │   ├── statuses.ts
│   │   ├── categories.ts
│   │   └── limits.ts
│   │
│   ├── utils/                      # Shared utilities
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   └── schemas/                    # Shared Zod schemas
│       ├── user.schema.ts
│       ├── article.schema.ts
│       └── job.schema.ts
│
├── tsconfig.json
└── package.json
```

---

## Infrastructure & DevOps

```
infrastructure/
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   ├── Dockerfile.nginx
│   └── docker-compose.yml
│
├── kubernetes/                     # K8s manifests (if needed)
│   ├── deployments/
│   ├── services/
│   └── ingress/
│
├── nginx/
│   ├── nginx.conf
│   └── ssl/
│
├── terraform/                      # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
│
└── scripts/
    ├── deploy.sh
    ├── backup.sh
    └── migrate.sh
```

---

## CI/CD Configuration

```
.github/
└── workflows/
    ├── ci.yml                      # Continuous Integration
    ├── cd.yml                      # Continuous Deployment
    ├── test.yml                    # Test runner
    └── lint.yml                    # Linting
```

---

## Documentation

```
docs/
├── api/
│   ├── openapi.yaml               # OpenAPI specification
│   └── postman_collection.json
├── architecture/
│   ├── diagrams/
│   └── decisions/                 # Architecture Decision Records
├── guides/
│   ├── setup.md
│   ├── development.md
│   └── deployment.md
└── contributing.md
```

---

## Root Files

```
neurmatic/
├── .gitignore
├── .dockerignore
├── .editorconfig
├── .nvmrc                          # Node version
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── package.json                    # Monorepo root
```

---

## Key Design Principles

### 1. Feature-Based Organization
- Frontend features organized by domain (news, forum, jobs)
- Backend modules mirror frontend features
- Each feature is self-contained with components, hooks, API, types

### 2. Separation of Concerns
- **Components**: Pure UI components
- **Hooks**: Reusable logic
- **Services**: API communication
- **Store**: State management
- **Utils**: Pure functions

### 3. Colocation
- Keep related files together (component + styles + tests)
- Feature modules contain all related code
- Easier to find and modify related code

### 4. Scalability
- Modular architecture allows easy addition of new features
- Clear boundaries between modules
- Shared code in dedicated directories

### 5. Type Safety
- Shared types between frontend and backend
- Zod for runtime validation
- Prisma for database type safety

---

## File Naming Conventions

### Frontend
- **Components**: PascalCase (`ArticleCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useArticles.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Types**: camelCase with `.types.ts` suffix
- **Tests**: `*.test.tsx` or `*.spec.tsx`
- **Styles**: `*.module.css` for CSS Modules

### Backend
- **Controllers**: camelCase with `.controller.ts` suffix
- **Services**: camelCase with `.service.ts` suffix
- **Routes**: camelCase with `.routes.ts` suffix
- **Repositories**: camelCase with `.repository.ts` suffix
- **Validation**: camelCase with `.validation.ts` suffix
- **Tests**: `*.test.ts` or `*.spec.ts`

---

## Import Aliases (TypeScript Path Mapping)

### Frontend (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/components/*": ["components/*"],
      "@/features/*": ["features/*"],
      "@/hooks/*": ["hooks/*"],
      "@/utils/*": ["utils/*"],
      "@/types/*": ["types/*"],
      "@/store/*": ["store/*"],
      "@/services/*": ["services/*"],
      "@/assets/*": ["assets/*"]
    }
  }
}
```

**Usage**:
```typescript
import { Button } from '@/components/common/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatDate } from '@/utils/formatters';
```

### Backend (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/modules/*": ["modules/*"],
      "@/middleware/*": ["middleware/*"],
      "@/utils/*": ["utils/*"],
      "@/config/*": ["config/*"],
      "@/types/*": ["types/*"]
    }
  }
}
```

---

## Environment Variables

### Frontend (`.env.development`)
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_SENTRY_DSN=your_sentry_dsn
VITE_GA_TRACKING_ID=your_ga_id
```

### Backend (`.env.development`)
```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/neurmatic

# Redis
REDIS_URL=redis://localhost:6379

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=neurmatic-media
AWS_REGION=eu-west-1

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@neurmatic.com

# Sentry
SENTRY_DSN=your_sentry_dsn

# Other
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Package.json Scripts

### Frontend
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "type-check": "tsc --noEmit"
  }
}
```

### Backend
```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

---

## Related Documentation

- [Database Schema](./02-DATABASE_SCHEMA.md) - Prisma schema details
- [API Endpoints](./03-API_ENDPOINTS.md) - API route organization
- [Technical Decisions](./06-TECHNICAL_DECISIONS.md) - Why this structure was chosen
- [Development Phases](./07-DEVELOPMENT_PHASES.md) - Implementation order
