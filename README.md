# Neurmatic

> An integrated platform for the Large Language Model (LLM) community, combining news, forum discussions, and specialized job matching.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL Version](https://img.shields.io/badge/postgresql-%3E%3D15-blue)](https://www.postgresql.org/)
[![Redis Version](https://img.shields.io/badge/redis-%3E%3D7-red)](https://redis.io/)

## Overview

Neurmatic is a comprehensive platform designed for LLM enthusiasts, professionals, and organizations. It combines three core modules:

- **News Module**: Curated LLM content, model tracking (47+ models), and industry updates
- **Forum Module**: Community discussions, Q&A, reputation system, badges, and knowledge sharing
- **Jobs Module**: LLM-specialized job matching, application tracking, and recruitment

**Current Status**: Sprint 0 (Foundation) - Development Phase

## Features

### Authentication & User Management
- Email/password authentication with JWT tokens
- OAuth 2.0 integration (Google, LinkedIn, GitHub)
- Email verification flow
- Password reset functionality
- Two-factor authentication (2FA) with TOTP
- Session management with Redis

### Infrastructure
- PostgreSQL database with 50+ tables
- Redis for caching, sessions, and rate limiting
- Bull queue for background job processing
- Sentry for error tracking and performance monitoring
- Winston logging with file rotation
- Comprehensive security middleware (Helmet, CORS, rate limiting)

### Frontend Foundation
- React 18+ with TypeScript
- Vite for fast development and builds
- TailwindCSS for styling with Radix UI components
- TanStack Query for server state management
- Zustand for client state management
- React Router v7 for navigation
- i18n support (English and Dutch)
- Dark mode support

## Technology Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 5
- **Language**: TypeScript 5
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+ with ioredis
- **Queue**: Bull (Redis-based)
- **Authentication**: Passport.js, JWT, OAuth 2.0
- **Validation**: Zod schemas
- **Email**: Nodemailer (SendGrid/AWS SES)
- **Monitoring**: Sentry
- **Testing**: Jest with Supertest

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite 7
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 4
- **UI Components**: Radix UI
- **Routing**: React Router v7
- **State Management**: Zustand, TanStack Query
- **i18n**: react-i18next
- **Testing**: Vitest

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Cloud**: AWS/Railway/DigitalOcean (configurable)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **npm** >= 10.0.0 (comes with Node.js)
- **PostgreSQL** >= 15 ([Download](https://www.postgresql.org/download/))
- **Redis** >= 7 ([Download](https://redis.io/download))
- **Docker** (optional, for containerized development) ([Download](https://www.docker.com/get-started))
- **Git** ([Download](https://git-scm.com/downloads))

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/neurmatic.git
cd neurmatic
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with initial data
npm run prisma:seed

# Start development server
npm run dev
```

Backend will be available at: `http://localhost:3000`

API documentation: `http://localhost:3000/api/v1/health`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with backend API URL
nano .env  # or use your preferred editor

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 4. Using Docker Compose (Recommended)

For a complete local development environment with all services:

```bash
# From project root

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker compose up -d

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# Stop services
docker compose down

# Stop and remove volumes (CAUTION: deletes database data)
docker compose down -v
```

This starts:
- **PostgreSQL** on port 5432 (with persistent volume)
- **Redis** on port 6379 (with persistent volume)
- **Backend API** on port 3000 (with hot reload)
- **Frontend** on port 5173 (with hot reload)

All services are connected via the `neurmatic-network` Docker network and include health checks.

#### Docker Commands Reference

```bash
# Build services without starting
docker compose build

# Rebuild a specific service
docker compose build backend

# Execute commands in running containers
docker compose exec backend npm run prisma:migrate
docker compose exec backend npm run prisma:studio

# View service status
docker compose ps

# Remove stopped containers
docker compose rm

# Pull latest images
docker compose pull

# Restart a specific service
docker compose restart backend
```

## Project Structure

```
neurmatic/
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── modules/        # Feature modules (auth, users, news, forum, jobs)
│   │   ├── middleware/     # Express middleware
│   │   ├── config/         # Configuration files
│   │   ├── prisma/         # Database schema and migrations
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
│   ├── tests/              # Backend tests
│   └── package.json
│
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── features/      # Feature-based modules
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utilities and configurations
│   │   ├── stores/        # Zustand stores
│   │   └── styles/        # Global styles
│   └── package.json
│
├── projectdoc/            # Technical documentation
│   ├── README.md          # Documentation overview
│   ├── 02-DATABASE_SCHEMA.md
│   ├── 03-API_ENDPOINTS.md
│   └── ...
│
├── .claude/               # AI assistant configuration
│   ├── sprints/           # Sprint task definitions
│   └── skills/            # Development guidelines
│
├── docker-compose.yml     # Docker services configuration
├── .github/               # GitHub Actions workflows
└── README.md              # This file
```

## Architecture Overview

Neurmatic follows a **modular monolith** architecture with clear separation of concerns:

```
┌─────────────┐
│   Frontend  │  React + TypeScript + Vite
│   (Port     │  TanStack Query + Zustand
│    5173)    │  TailwindCSS + Radix UI
└──────┬──────┘
       │ HTTP/REST API
┌──────▼──────┐
│   Backend   │  Node.js + Express + TypeScript
│   (Port     │  Layered Architecture:
│    3000)    │  Routes → Controllers → Services → Repositories
└──────┬──────┘
       │
       ├──────────────┬──────────────┬─────────────┐
       │              │              │             │
┌──────▼──────┐ ┌────▼────┐  ┌──────▼──────┐ ┌───▼────┐
│  PostgreSQL │ │  Redis  │  │    Bull     │ │ Sentry │
│  (Port 5432)│ │(Port    │  │   Queue     │ │        │
│             │ │ 6379)   │  │  Workers    │ │        │
└─────────────┘ └─────────┘  └─────────────┘ └────────┘
```

### Backend Architecture

The backend follows a **layered architecture**:

- **Routes**: HTTP route definitions, request validation
- **Controllers**: Request handling, response formatting
- **Services**: Business logic, orchestration
- **Repositories**: Data access, Prisma queries
- **Middleware**: Authentication, error handling, logging

### Frontend Architecture

The frontend uses a **feature-based structure**:

- **Features**: Domain-specific modules (auth, news, forum, jobs)
- **Components**: Reusable UI components
- **Stores**: Global state management (Zustand)
- **Lib**: API clients, utilities, configurations

## Environment Variables

### Backend (.env)

See `backend/.env.example` for all available variables. Key variables:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/neurmatic
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_min_32_characters
SENTRY_DSN=your_sentry_dsn
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_SENTRY_DSN=your_sentry_dsn
```

Complete documentation: See `backend/README.md` and `frontend/README.md`

## Development Workflow

### Running Locally

**Backend:**
```bash
cd backend
npm run dev        # Start dev server with hot reload
npm run test       # Run tests
npm run lint       # Lint code
npm run type-check # TypeScript type checking
```

**Frontend:**
```bash
cd frontend
npm run dev        # Start dev server with HMR
npm run test       # Run Vitest tests
npm run lint       # Lint code
npm run build      # Production build
```

### Database Management

```bash
cd backend

# View database in GUI
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Reset database (CAUTION: deletes all data)
npm run prisma:reset

# Seed database with sample data
npm run prisma:seed
```

### Background Jobs

The application uses Bull for background job processing:

- **Email Queue**: Sends verification, password reset, and notification emails
- **Notification Queue**: Processes real-time notifications
- **Analytics Queue**: Aggregates user analytics and statistics

Monitor jobs at: `http://localhost:3000/admin/queues` (requires admin authentication)

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Interactive UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### End-to-End Tests

E2E tests use Playwright and are located in the `tests/e2e/` directory:

```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e
```

## API Documentation

API endpoints are documented in `projectdoc/03-API_ENDPOINTS.md`.

Key endpoints:

- **Authentication**: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`
- **Users**: `GET /api/v1/users/me`, `PATCH /api/v1/users/me`
- **OAuth**: `POST /api/v1/auth/oauth/{provider}`
- **Health Check**: `GET /api/v1/health`

Interactive API documentation (Swagger): `http://localhost:3000/api/docs` (coming soon)

## Database Schema

The database consists of 50+ tables organized into 6 domains:

- **Users** (10 tables): users, profiles, oauth_providers, sessions, skills, etc.
- **News** (8 tables): articles, categories, tags, bookmarks, media_library, etc.
- **Forum** (15 tables): topics, replies, votes, reputation, badges, prompts, polls, etc.
- **Jobs** (10 tables): jobs, companies, applications, matches, saved_jobs, etc.
- **LLM Guide** (4 tables): llm_models, use_cases, glossary_terms, etc.
- **Platform** (7 tables): notifications, follows, messages, analytics, etc.

Full schema documentation: `projectdoc/02-DATABASE_SCHEMA.md`

## Security

Neurmatic implements multiple security measures:

- **Authentication**: JWT with refresh tokens (RS256 algorithm)
- **Password Hashing**: bcrypt with cost factor 12
- **Rate Limiting**: Configurable per-endpoint limits
- **CORS**: Configured for specific frontend origin
- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options)
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Prevention**: Content sanitization
- **HTTPS**: Enforced in production
- **Session Management**: Redis-backed sessions with expiration

## CI/CD Pipeline

The project uses **GitHub Actions** for continuous integration and deployment.

### Continuous Integration (CI)

Runs automatically on push to `main` or `develop` branches and on pull requests.

**Workflow**: `.github/workflows/ci.yml`

The CI pipeline includes:

1. **Backend CI**:
   - Linting (ESLint)
   - Type checking (TypeScript)
   - Unit and integration tests (Jest)
   - Code coverage reporting (Codecov)
   - Build verification

2. **Frontend CI**:
   - Linting (ESLint)
   - Type checking (TypeScript)
   - Unit tests (Vitest)
   - Code coverage reporting (Codecov)
   - Build verification

3. **Docker Build Test**:
   - Build backend Docker image (production target)
   - Build frontend Docker image (production target)
   - Verify multi-stage builds work correctly

All jobs run in parallel for faster feedback.

**Status Badges**: Add these to your README:
```markdown
[![Backend CI](https://github.com/your-org/neurmatic/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/neurmatic/actions/workflows/ci.yml)
```

### Staging Deployment

**Workflow**: `.github/workflows/deploy-staging.yml`

- **Trigger**: Automatic on push to `develop` branch
- **Environment**: staging
- **Docker Images**: Pushed to GitHub Container Registry (ghcr.io)
- **Deployment**: SSH deployment to staging server
- **Database**: Runs Prisma migrations automatically
- **Sentry**: Creates staging release for error tracking
- **Notifications**: Slack notification on success/failure (optional)

**Required GitHub Secrets** (set in repository settings):
```
STAGING_HOST              # Staging server hostname/IP
STAGING_USERNAME          # SSH username
STAGING_SSH_KEY           # SSH private key
STAGING_API_URL           # Staging API URL
STAGING_WS_URL            # Staging WebSocket URL
VITE_SENTRY_DSN          # Frontend Sentry DSN
SENTRY_AUTH_TOKEN        # Sentry authentication token
SENTRY_ORG               # Sentry organization slug
SLACK_WEBHOOK_URL        # Slack webhook (optional)
```

### Production Deployment

**Workflow**: `.github/workflows/deploy-production.yml`

- **Trigger**: Manual workflow dispatch or GitHub release
- **Environment**: production (requires manual approval)
- **Pre-deployment**: Creates database backup automatically
- **Docker Images**: Tagged with version (e.g., v1.0.0, production-latest)
- **Health Check**: Verifies deployment success
- **Rollback**: Automatic rollback on failure
- **Sentry**: Creates production release with finalized status
- **Notifications**: Slack notification on success/failure

**Required GitHub Secrets**:
```
PRODUCTION_HOST           # Production server hostname/IP
PRODUCTION_USERNAME       # SSH username
PRODUCTION_SSH_KEY        # SSH private key
PRODUCTION_API_URL        # Production API URL
PRODUCTION_WS_URL         # Production WebSocket URL
```

**To deploy to production**:
```bash
# Option 1: Manual workflow dispatch
# Go to Actions → Deploy to Production → Run workflow → Enter version (e.g., v1.0.0)

# Option 2: Create a GitHub release
git tag v1.0.0
git push origin v1.0.0
# Then create a release from this tag in GitHub UI
```

### Docker Registry

Docker images are stored in **GitHub Container Registry**:
```
ghcr.io/your-org/neurmatic-backend:latest
ghcr.io/your-org/neurmatic-backend:staging-SHA
ghcr.io/your-org/neurmatic-backend:v1.0.0
ghcr.io/your-org/neurmatic-frontend:latest
ghcr.io/your-org/neurmatic-frontend:staging-SHA
ghcr.io/your-org/neurmatic-frontend:v1.0.0
```

**Pull images**:
```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull specific version
docker pull ghcr.io/your-org/neurmatic-backend:v1.0.0
docker pull ghcr.io/your-org/neurmatic-frontend:v1.0.0
```

## Deployment

### Local Deployment with Docker

See **Docker Compose** section above for local development setup.

### Server Deployment

#### Prerequisites
1. Server with Docker and Docker Compose installed
2. Domain name configured (optional but recommended)
3. SSL certificates (Let's Encrypt recommended)
4. Environment variables configured

#### Deployment Steps

1. **Clone repository on server**:
```bash
ssh user@your-server
cd /opt
git clone https://github.com/your-org/neurmatic.git
cd neurmatic
```

2. **Configure environment**:
```bash
cp .env.example .env
nano .env  # Update with production values
```

3. **Start services**:
```bash
docker compose -f docker-compose.production.yml up -d
```

4. **Run migrations**:
```bash
docker compose exec backend npx prisma migrate deploy
```

5. **Verify deployment**:
```bash
curl http://your-server:3000/api/v1/health
```

### Environment Setup

**Required for all environments**:

1. Configure environment variables in your hosting platform
2. Set up PostgreSQL database (v15+)
3. Set up Redis instance (v7+)
4. Configure Sentry project for error tracking
5. Set up email service (SendGrid or AWS SES)
6. Configure OAuth credentials:
   - Google OAuth 2.0
   - LinkedIn OAuth 2.0
   - GitHub OAuth

**Supported hosting platforms**:
- **Docker-based**: AWS (ECS, EC2), DigitalOcean, Railway, Render
- **Frontend only**: Vercel, Netlify, Cloudflare Pages
- **Database**: AWS RDS, DigitalOcean Managed PostgreSQL, Supabase
- **Cache**: AWS ElastiCache, Redis Cloud, Upstash

### SSL/HTTPS Configuration

For production, configure HTTPS using:
- **Let's Encrypt** with Certbot
- **Cloudflare** SSL
- **AWS Certificate Manager** (if using AWS)

Update nginx configuration in `frontend/nginx.conf` for SSL termination.

## Monitoring & Logging

### Sentry Error Tracking

Both backend and frontend are integrated with Sentry for comprehensive error tracking.

**Backend** (`backend/src/instrument.ts`):
- Automatically captures all unhandled exceptions
- Performance monitoring with profiling
- Filters out 4xx errors (except 401/403)
- Includes user context when authenticated
- Release tracking via CI/CD

**Frontend** (`frontend/src/lib/sentry.ts`):
- Browser error tracking
- Session replay for debugging
- Performance monitoring
- Error boundary component (`ErrorBoundary.tsx`)
- Filters out browser extension errors
- User context integration

**Configuration**:
```env
# Backend
SENTRY_DSN=your_backend_sentry_dsn
SENTRY_ENVIRONMENT=development|staging|production
SENTRY_TRACES_SAMPLE_RATE=1.0  # 100% in dev, 0.1 (10%) in prod
SENTRY_PROFILES_SAMPLE_RATE=1.0

# Frontend
VITE_SENTRY_DSN=your_frontend_sentry_dsn
VITE_SENTRY_ENVIRONMENT=development|staging|production
```

**Usage in code**:
```typescript
// Frontend
import { captureException, addSentryBreadcrumb } from '@/lib/sentry-helpers';

try {
  // Your code
} catch (error) {
  captureException(error, { context: 'additional info' });
}

// Add breadcrumbs for debugging
addSentryBreadcrumb('User clicked button', 'user', 'info', { buttonId: 'submit' });
```

### Winston Logging
- Structured JSON logs
- Daily log file rotation
- Different log levels: error, warn, info, debug
- Console output in development
- File output in production (`logs/` directory)

**Usage**:
```typescript
import logger from '@/utils/logger';

logger.info('User logged in', { userId: user.id });
logger.error('Database connection failed', { error: error.message });
```

### Health Checks

The application provides health check endpoints for monitoring:

- **Overall health**: `GET /api/v1/health`
  - Returns 200 if all systems operational
  - Checks: API, Database, Redis

- **Database**: `GET /api/v1/health/db`
  - Verifies PostgreSQL connection
  - Tests query execution

- **Redis**: `GET /api/v1/health/redis`
  - Verifies Redis connection
  - Tests read/write operations

**Example response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T23:00:00.000Z",
  "services": {
    "api": "up",
    "database": "up",
    "redis": "up"
  }
}
```

**Docker health checks**:
All Docker services include health checks that restart containers on failure:
- Backend: Checks `/api/v1/health` endpoint
- PostgreSQL: `pg_isready` command
- Redis: `redis-cli ping` command

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code style and standards
- Commit message conventions
- Pull request process
- Testing requirements
- Development workflow

## Documentation

Comprehensive documentation is available in the `projectdoc/` directory:

- [Project Overview](projectdoc/01-PROJECT_OVERVIEW.md)
- [Database Schema](projectdoc/02-DATABASE_SCHEMA.md)
- [API Endpoints](projectdoc/03-API_ENDPOINTS.md)
- [User Workflows](projectdoc/04-USER_WORKFLOWS.md)
- [File Structure](projectdoc/05-FILE_STRUCTURE.md)
- [Technical Decisions](projectdoc/06-TECHNICAL_DECISIONS.md)
- [Development Phases](projectdoc/07-DEVELOPMENT_PHASES.md)

## Sprint Progress

The project follows a 15-sprint development plan (30 weeks):

- **Sprint 0** (Current): Foundation & Infrastructure - IN PROGRESS
- **Sprints 1-10**: Core modules (User Management, News, Forum, Jobs)
- **Sprints 11-13**: Integration (LLM Guide, Admin, Notifications)
- **Sprint 14**: Polish & Launch Preparation

Progress tracking: `.claude/PROGRESS.md`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check the `projectdoc/` directory
- **Issues**: [GitHub Issues](https://github.com/your-org/neurmatic/issues)
- **Email**: support@neurmatic.com
- **Discord**: [Join our community](https://discord.gg/neurmatic) (coming soon)

## Acknowledgments

- LLM community for inspiration and feedback
- Open source projects that made this possible
- All contributors and early adopters

---

**Built with** ❤️ **by the Neurmatic Team**

**Last Updated**: November 2025
