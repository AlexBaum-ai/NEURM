# Neurmatic Backend API

> Node.js + TypeScript + Express backend for the Neurmatic platform

## Overview

The Neurmatic backend is a robust REST API built with Node.js, Express, and TypeScript. It follows a layered architecture pattern with clear separation of concerns and implements comprehensive authentication, authorization, and security features.

## Features

- **Authentication System**: JWT + OAuth 2.0 (Google, LinkedIn, GitHub) + 2FA
- **Database**: PostgreSQL 15+ with Prisma ORM (50+ tables)
- **Caching**: Redis for sessions, rate limiting, and application cache
- **Background Jobs**: Bull queue for asynchronous task processing
- **Email Service**: Nodemailer with SendGrid/AWS SES integration
- **Error Tracking**: Sentry integration with performance monitoring
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston with daily file rotation
- **API Documentation**: OpenAPI/Swagger (coming soon)

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **PostgreSQL** >= 15
- **Redis** >= 7
- **Docker** (optional, for containerized development)

## Installation

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/neurmatic

# Redis
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your_jwt_secret_min_32_characters_long_change_this_in_production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_characters_long

# OAuth - Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/oauth/google/callback

# OAuth - LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:3000/api/v1/auth/oauth/linkedin/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/oauth/github/callback

# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@neurmatic.com
SUPPORT_EMAIL=support@neurmatic.com

# Sentry Error Tracking
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=1.0

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your_session_secret_min_32_characters_long

# Logging
LOG_LEVEL=info
```

### 4. Database Setup

#### Generate Prisma Client

```bash
npm run prisma:generate
```

#### Run Migrations

```bash
npm run prisma:migrate
```

This creates all 50+ tables in your PostgreSQL database.

#### Seed Database

```bash
npm run prisma:seed
```

This populates the database with:
- Admin user (email: `admin@neurmatic.com`, password: `Admin123!`)
- 47+ LLM models (GPT-4, Claude 3, Gemini, Llama 3, etc.)
- News categories and tags
- Forum categories
- Glossary terms
- Sample content

### 5. Start Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:3000`

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret for signing access tokens | Min 32 characters |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Min 32 characters |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |

### OAuth Configuration

To enable OAuth authentication:

1. **Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Set authorized redirect URI: `http://localhost:3000/api/v1/auth/oauth/google/callback`
   - Copy Client ID and Secret to `.env`

2. **LinkedIn OAuth**:
   - Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Create an app and add OAuth 2.0 credentials
   - Set redirect URL: `http://localhost:3000/api/v1/auth/oauth/linkedin/callback`

3. **GitHub OAuth**:
   - Go to [GitHub Settings > Developer settings](https://github.com/settings/developers)
   - Create OAuth App
   - Set callback URL: `http://localhost:3000/api/v1/auth/oauth/github/callback`

### Email Service Configuration

#### Option 1: SendGrid

```env
SENDGRID_API_KEY=your_api_key
FROM_EMAIL=noreply@neurmatic.com
```

Get API key from: https://sendgrid.com/

#### Option 2: AWS SES

```env
AWS_SES_REGION=eu-west-1
AWS_SES_ACCESS_KEY=your_access_key
AWS_SES_SECRET_KEY=your_secret_key
FROM_EMAIL=noreply@neurmatic.com
```

### Sentry Configuration

1. Create account at [Sentry.io](https://sentry.io/)
2. Create new project for Node.js
3. Copy DSN to `.env`:

```env
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=development
```

## Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server (requires build first) |
| `npm test` | Run test suite with Jest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Lint code with ESLint |
| `npm run lint:fix` | Fix linting issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Check TypeScript types without emitting |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (database GUI) |
| `npm run prisma:seed` | Seed database with initial data |
| `npm run prisma:reset` | Reset database (CAUTION: deletes all data) |

### Hot Reload Development

The development server uses `nodemon` for automatic reloading:

```bash
npm run dev
```

Any changes to `.ts` files will trigger automatic recompilation and server restart.

### Database Management

#### View Database

Launch Prisma Studio (visual database browser):

```bash
npm run prisma:studio
```

Opens at: `http://localhost:5555`

#### Create Migration

After modifying `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name your_migration_name
```

#### Reset Database

**WARNING**: This deletes all data!

```bash
npm run prisma:reset
```

Then re-seed:

```bash
npm run prisma:seed
```

### Background Jobs

Monitor background jobs at: `http://localhost:3000/admin/queues`

(Requires admin authentication)

Available queues:
- **email**: Email sending jobs
- **notifications**: Push notification processing
- **analytics**: Data aggregation and analytics

## Project Structure

```
backend/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── auth/            # Authentication (login, register, OAuth, 2FA)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validation.ts
│   │   ├── users/           # User management
│   │   ├── news/            # News articles (future)
│   │   ├── forum/           # Forum topics/replies (future)
│   │   ├── jobs/            # Job postings (future)
│   │   └── platform/        # Notifications, follows (future)
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts        # JWT verification
│   │   ├── errorHandler.middleware.ts # Global error handler
│   │   ├── validation.middleware.ts   # Zod validation
│   │   └── rateLimiter.middleware.ts  # Rate limiting
│   │
│   ├── config/              # Configuration
│   │   ├── database.ts      # Prisma client
│   │   ├── redis.ts         # Redis client
│   │   ├── env.ts           # Environment validation
│   │   └── passport.ts      # Passport strategies
│   │
│   ├── prisma/              # Database
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Migration files
│   │   └── seed.ts          # Seed script
│   │
│   ├── jobs/                # Background job workers
│   │   ├── email.worker.ts  # Email job processor
│   │   └── queue.ts         # Queue configuration
│   │
│   ├── utils/               # Utility functions
│   │   ├── logger.ts        # Winston logger
│   │   ├── email.ts         # Email helpers
│   │   └── crypto.ts        # Cryptography utilities
│   │
│   ├── types/               # TypeScript types
│   │   └── express.d.ts     # Express type extensions
│   │
│   ├── websocket/           # WebSocket handlers (future)
│   │
│   ├── instrument.ts        # Sentry initialization (MUST be first import)
│   ├── app.ts               # Express app configuration
│   └── server.ts            # Server entry point
│
├── tests/                   # Test files
│   ├── integration/         # Integration tests
│   └── unit/                # Unit tests
│
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment template
├── .eslintrc.json           # ESLint configuration
├── .prettierrc              # Prettier configuration
├── jest.config.js           # Jest configuration
├── nodemon.json             # Nodemon configuration
├── tsconfig.json            # TypeScript configuration
└── package.json
```

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│         Routes Layer                │  HTTP routing, request validation
│  (auth.routes.ts, users.routes.ts)  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│      Controllers Layer              │  Request handling, response formatting
│  (AuthController, UserController)   │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│        Services Layer               │  Business logic, orchestration
│   (authService, userService)        │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│     Repositories Layer              │  Data access, Prisma queries
│  (UserRepository, SessionRepo)      │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│          Database                   │  PostgreSQL with Prisma
└─────────────────────────────────────┘
```

### Request Flow Example

```
1. POST /api/v1/auth/login
   │
2. │── Validation Middleware (Zod schema)
   │
3. │── Rate Limiting Middleware (5 attempts per 15min)
   │
4. │── AuthController.login()
   │   │
   │   └── authService.login(email, password)
   │       │
   │       └── UserRepository.findByEmail(email)
   │       │
   │       └── bcrypt.compare(password, hash)
   │       │
   │       └── Generate JWT tokens
   │       │
   │       └── Store session in Redis
   │
5. │── Response: { accessToken, refreshToken }
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Controllers | PascalCase | `AuthController.ts` |
| Services | camelCase | `authService.ts` |
| Routes | camelCase + Routes | `authRoutes.ts` |
| Repositories | PascalCase + Repository | `UserRepository.ts` |
| Middleware | camelCase + Middleware | `authMiddleware.ts` |
| Types | PascalCase | `UserPayload.ts` |

## API Endpoints

### Authentication

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/v1/auth/register` | Register new user | 5/15min |
| POST | `/api/v1/auth/login` | Login with email/password | 5/15min |
| POST | `/api/v1/auth/refresh` | Refresh access token | 10/15min |
| POST | `/api/v1/auth/logout` | Logout and invalidate session | 10/min |
| POST | `/api/v1/auth/verify-email` | Verify email with token | 3/hr |
| POST | `/api/v1/auth/resend-verification` | Resend verification email | 3/hr |
| POST | `/api/v1/auth/forgot-password` | Request password reset | 3/hr |
| POST | `/api/v1/auth/reset-password` | Reset password with token | 3/hr |
| GET | `/api/v1/auth/oauth/:provider` | OAuth login (Google, LinkedIn, GitHub) | 10/15min |
| GET | `/api/v1/auth/oauth/:provider/callback` | OAuth callback | N/A |
| POST | `/api/v1/auth/2fa/setup` | Setup 2FA (returns QR code) | 3/hr |
| POST | `/api/v1/auth/2fa/verify` | Verify 2FA code | 5/15min |
| POST | `/api/v1/auth/2fa/disable` | Disable 2FA | 3/hr |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users/me` | Get current user profile | Yes |
| PATCH | `/api/v1/users/me` | Update current user profile | Yes |
| DELETE | `/api/v1/users/me` | Delete account | Yes |
| GET | `/api/v1/users/:id` | Get user by ID | No |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Overall health check |
| GET | `/api/v1/health/db` | Database connectivity |
| GET | `/api/v1/health/redis` | Redis connectivity |

Complete API documentation: `../projectdoc/03-API_ENDPOINTS.md`

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── integration/          # Integration tests
│   ├── auth.test.ts     # Auth flow tests
│   └── users.test.ts    # User endpoint tests
│
└── unit/                # Unit tests
    ├── services/        # Service layer tests
    └── utils/           # Utility function tests
```

### Writing Tests

Example test:

```typescript
import request from 'supertest';
import app from '../src/app';

describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');
  });
});
```

### Test Coverage Requirements

- **Minimum coverage**: 80%
- **Services**: 90% coverage
- **Controllers**: 80% coverage
- **Utilities**: 90% coverage

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  },
  "requestId": "req_abc123"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (duplicate email) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## Security

### Authentication Flow

1. **Registration**: Email + password → bcrypt hash (cost: 12)
2. **Login**: Verify credentials → Generate JWT access token (15min) + refresh token (30 days)
3. **Access Token**: Signed with RS256, includes user ID and role
4. **Refresh Token**: HTTPOnly cookie, single-use, stored in database
5. **Token Refresh**: Verify refresh token → Issue new access token
6. **Logout**: Invalidate refresh token in database

### Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

### Rate Limiting

Configured per-endpoint in routes:

```typescript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});
```

### CORS Configuration

Configured to allow requests only from frontend origin:

```typescript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
})
```

### Security Headers

Helmet.js provides:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

## Logging

### Log Levels

- **error**: Critical errors requiring immediate attention
- **warn**: Warning messages for potential issues
- **info**: General informational messages
- **debug**: Detailed debugging information

### Log Format

```json
{
  "level": "info",
  "message": "User logged in",
  "timestamp": "2025-11-04T12:00:00.000Z",
  "userId": "user_123",
  "ip": "192.168.1.1",
  "requestId": "req_abc123"
}
```

### Log Files

- **combined.log**: All logs
- **error.log**: Error-level logs only
- Daily rotation with max 14 days retention

## Troubleshooting

### Common Issues

#### Database Connection Error

```
Error: P1001: Can't reach database server
```

**Solution**:
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Verify database exists: `psql -l`

#### Redis Connection Error

```
Error: Redis connection failed
```

**Solution**:
1. Start Redis: `redis-server`
2. Check `REDIS_URL` in `.env`
3. Test connection: `redis-cli ping`

#### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

#### Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Solution**:
```bash
npm run prisma:generate
```

#### JWT Secret Too Short

```
Error: JWT_SECRET must be at least 32 characters
```

**Solution**: Update `.env` with a longer secret:
```bash
JWT_SECRET=$(openssl rand -base64 32)
```

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## Performance Optimization

### Database

- **Indexes**: Defined on frequently queried fields (email, username)
- **Connection Pooling**: Prisma connection pool configured
- **Query Optimization**: Use `include` and `select` to fetch only needed data

### Caching

Redis caching strategy:
- **Session data**: 30-day TTL
- **User profile**: 5-minute TTL
- **News articles**: 10-minute TTL
- **Forum posts**: 5-minute TTL

### Response Compression

Gzip compression enabled for responses > 1KB

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

Required changes in `.env`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/neurmatic
REDIS_URL=redis://prod-host:6379
JWT_SECRET=<strong-production-secret>
SENTRY_ENVIRONMENT=production
```

### Database Migrations

Run migrations in production:

```bash
npx prisma migrate deploy
```

**Do NOT use** `prisma migrate dev` in production!

### Health Checks

Configure your load balancer to poll:

```
GET /api/v1/health
```

Expected response (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

## Support

- **Documentation**: Check `../projectdoc/` directory
- **Issues**: GitHub Issues
- **Email**: dev@neurmatic.com

## License

MIT License - see LICENSE file

---

**Last Updated**: November 2025
