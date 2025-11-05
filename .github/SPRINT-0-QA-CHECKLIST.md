# Sprint 0 QA Testing Checklist

This checklist provides step-by-step instructions for testing all Sprint 0 components once infrastructure is deployed.

## Prerequisites Checklist

- [ ] PostgreSQL 15+ installed and running
- [ ] Redis 7+ installed and running
- [ ] Node.js 20+ installed
- [ ] npm 10+ installed
- [ ] Docker and Docker Compose installed (optional)
- [ ] Git repository cloned
- [ ] Environment variables configured

## Phase 1: Infrastructure Setup

### 1.1 PostgreSQL Setup
```bash
# Test connection
psql -h vps-1a707765.vps.ovh.net -U neurmatic_user -d neurmatic

# Expected: Connection successful
```

- [ ] Database connection successful
- [ ] User has proper permissions
- [ ] Database 'neurmatic' exists

### 1.2 Redis Setup
```bash
# Test connection
redis-cli -h vps-1a707765.vps.ovh.net ping

# Expected: PONG
```

- [ ] Redis connection successful
- [ ] SET/GET operations work
- [ ] No authentication errors

### 1.3 Database Migrations
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

- [ ] Prisma Client generated
- [ ] Migrations applied successfully
- [ ] Seed data populated
- [ ] Admin user created (admin@neurmatic.com)
- [ ] 47+ LLM models seeded
- [ ] Categories and tags created

## Phase 2: Backend Server

### 2.1 Server Startup
```bash
cd backend
npm run dev
```

- [ ] Server starts without errors
- [ ] Listening on port 3000
- [ ] Sentry initialized successfully
- [ ] Database connected
- [ ] Redis connected
- [ ] No critical errors in console

### 2.2 Health Check Endpoints
```bash
# Overall health
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/health

# Database health
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/health/db

# Redis health
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/health/redis
```

- [ ] /api/v1/health returns 200 OK
- [ ] /api/v1/health/db returns "connected"
- [ ] /api/v1/health/redis returns "connected"
- [ ] Response time < 100ms

## Phase 3: Authentication Testing

### 3.1 User Registration
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "username": "testuser"
  }'
```

- [ ] Returns 201 Created
- [ ] User created in database
- [ ] Verification email sent
- [ ] Response includes user ID
- [ ] Password is hashed in database

### 3.2 Duplicate Registration
```bash
# Try to register same email again
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "username": "testuser2"
  }'
```

- [ ] Returns 409 Conflict
- [ ] Error message: "Email already exists"

### 3.3 Invalid Email Format
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "Password123!",
    "username": "testuser3"
  }'
```

- [ ] Returns 400 Bad Request
- [ ] Error message indicates invalid email format

### 3.4 Weak Password
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "weak",
    "username": "testuser4"
  }'
```

- [ ] Returns 400 Bad Request
- [ ] Error message indicates password requirements

### 3.5 User Login (Valid)
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

- [ ] Returns 200 OK
- [ ] Response includes accessToken
- [ ] Response includes refreshToken
- [ ] Session created in Redis
- [ ] Session created in database

### 3.6 User Login (Invalid)
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }'
```

- [ ] Returns 401 Unauthorized
- [ ] Error message: "Invalid credentials"

### 3.7 Rate Limiting
```bash
# Attempt 6 failed logins rapidly
for i in {1..6}; do
  curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "wrong"
    }'
  echo ""
done
```

- [ ] First 5 attempts return 401
- [ ] 6th attempt returns 429 Too Many Requests
- [ ] Rate limit message displayed

### 3.8 Protected Route Access
```bash
# Get current user (without token)
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me

# Expected: 401 Unauthorized
```

- [ ] Returns 401 Unauthorized
- [ ] Error message: "Authentication required"

### 3.9 Protected Route with Token
```bash
# First, login to get token
TOKEN=$(curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}' \
  | jq -r '.accessToken')

# Then access protected route
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Returns 200 OK
- [ ] User data returned
- [ ] No sensitive data exposed (no passwordHash)

### 3.10 Token Refresh
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  --cookie "refreshToken=<refresh_token_from_login>"
```

- [ ] Returns 200 OK
- [ ] New accessToken issued
- [ ] Old refreshToken invalidated
- [ ] New refreshToken issued

### 3.11 Email Verification
```bash
# Get verification token from database or email
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<verification_token>"
  }'
```

- [ ] Returns 200 OK
- [ ] User's emailVerified set to true
- [ ] User can now access protected routes

### 3.12 Resend Verification Email
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

- [ ] Returns 200 OK
- [ ] New verification email sent
- [ ] Rate limited to 3 per hour

### 3.13 Forgot Password
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

- [ ] Returns 200 OK (even if email doesn't exist - security)
- [ ] Reset email sent if email exists
- [ ] Reset token created in database
- [ ] Rate limited to 3 per hour

### 3.14 Reset Password
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<reset_token>",
    "password": "NewPassword123!"
  }'
```

- [ ] Returns 200 OK
- [ ] Password updated in database
- [ ] All user sessions invalidated
- [ ] Reset token deleted
- [ ] Can login with new password

### 3.15 Logout
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  --cookie "refreshToken=<refresh_token>"
```

- [ ] Returns 200 OK
- [ ] Session removed from Redis
- [ ] Session removed from database
- [ ] RefreshToken invalidated
- [ ] Cannot use old accessToken

## Phase 4: OAuth Testing (Optional)

### 4.1 Google OAuth
```bash
# Open in browser
http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/oauth/google
```

- [ ] Redirects to Google login
- [ ] After auth, redirects back to app
- [ ] User created/logged in
- [ ] OAuth provider linked in database

### 4.2 LinkedIn OAuth
- [ ] Similar flow works for LinkedIn

### 4.3 GitHub OAuth
- [ ] Similar flow works for GitHub

## Phase 5: 2FA Testing

### 5.1 Setup 2FA
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/2fa/setup \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Returns QR code image
- [ ] Returns TOTP secret
- [ ] Returns backup codes
- [ ] Backup codes are hashed in database

### 5.2 Verify 2FA Setup
```bash
# Get TOTP code from authenticator app
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/2fa/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "<totp_code>"
  }'
```

- [ ] Returns 200 OK
- [ ] 2FA enabled for user
- [ ] twoFactorEnabled set to true in database

### 5.3 Login with 2FA
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "totpCode": "<totp_code>"
  }'
```

- [ ] Login successful with valid code
- [ ] Login fails with invalid code

### 5.4 Disable 2FA
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/2fa/disable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "<totp_code>"
  }'
```

- [ ] Returns 200 OK
- [ ] 2FA disabled
- [ ] TOTP secret removed

## Phase 6: Background Jobs

### 6.1 Email Queue
```bash
# Check Bull Board dashboard
http://vps-1a707765.vps.ovh.net:3000/admin/queues
```

- [ ] Dashboard loads (requires admin auth)
- [ ] Email queue visible
- [ ] Jobs are being processed
- [ ] Completed jobs shown
- [ ] Failed jobs shown (if any)

### 6.2 Job Processing
- [ ] Verification emails sent
- [ ] Password reset emails sent
- [ ] Jobs retry on failure (3 attempts)
- [ ] Failed jobs logged

## Phase 7: Sentry Integration

### 7.1 Trigger Test Error
```bash
# Access a route that triggers an error
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/test-error
```

- [ ] Error captured in Sentry
- [ ] Stack trace visible
- [ ] User context attached (if authenticated)
- [ ] Environment set to "development"

### 7.2 Performance Monitoring
- [ ] API transactions tracked in Sentry
- [ ] Slow transactions flagged
- [ ] Database query performance tracked

## Phase 8: Frontend Testing

### 8.1 Frontend Startup
```bash
cd frontend
npm run dev
```

- [ ] Server starts on port 5173
- [ ] No errors in console
- [ ] Hot reload works

### 8.2 Homepage
- [ ] Homepage loads
- [ ] No console errors
- [ ] Dark mode toggle works
- [ ] Language switcher works (EN/NL)

### 8.3 Registration Flow
- [ ] Navigate to /register
- [ ] Form displays correctly
- [ ] Validation errors show properly
- [ ] Successful registration redirects
- [ ] Verification message shown

### 8.4 Login Flow
- [ ] Navigate to /login
- [ ] Form displays correctly
- [ ] OAuth buttons visible
- [ ] Successful login redirects to dashboard
- [ ] Token stored in Zustand

### 8.5 Protected Routes
- [ ] Logged out users redirected to /login
- [ ] Logged in users can access /profile

### 8.6 API Integration
- [ ] Frontend can call backend API
- [ ] CORS configured correctly
- [ ] Auth tokens sent in headers
- [ ] Token refresh works on 401

## Phase 9: Docker Compose

### 9.1 Full Stack Startup
```bash
docker-compose up -d
docker-compose ps
```

- [ ] All 4 services running (postgres, redis, backend, frontend)
- [ ] All health checks passing
- [ ] No errors in logs

### 9.2 Service Communication
```bash
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend curl http://localhost:3000/api/v1/health
```

- [ ] Backend can connect to PostgreSQL
- [ ] Backend can connect to Redis
- [ ] Frontend can reach backend API

### 9.3 Data Persistence
```bash
# Stop services
docker-compose down

# Start services again
docker-compose up -d

# Check data still exists
```

- [ ] PostgreSQL data persisted
- [ ] Redis data persisted
- [ ] Users still exist after restart

## Phase 10: Performance Testing

### 10.1 API Response Times
```bash
# Use Apache Bench or similar
ab -n 100 -c 10 http://vps-1a707765.vps.ovh.net:3000/api/v1/health
```

- [ ] Health check < 50ms (p95)
- [ ] No errors under load

### 10.2 Database Query Performance
```bash
# Check slow queries in PostgreSQL
psql -h vps-1a707765.vps.ovh.net -U neurmatic_user -d neurmatic \
  -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

- [ ] No queries > 50ms average
- [ ] Indexes being used

### 10.3 Frontend Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Bundle size < 500KB (check dist/ size)
- [ ] No performance warnings in Lighthouse

## Phase 11: Security Testing

### 11.1 SQL Injection Attempts
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com'\'' OR '\''1'\''='\''1",
    "password": "anything"
  }'
```

- [ ] Returns 401 (not vulnerable)
- [ ] No database error
- [ ] Prisma prevents injection

### 11.2 XSS Attempts
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "xss@example.com",
    "password": "Password123!",
    "username": "<script>alert(1)</script>"
  }'
```

- [ ] Script tags sanitized or escaped
- [ ] No script execution in frontend

### 11.3 CORS Testing
```bash
curl -H "Origin: http://malicious.com" \
  http://vps-1a707765.vps.ovh.net:3000/api/v1/health
```

- [ ] CORS headers restrict to allowed origins
- [ ] Unauthorized origins blocked

### 11.4 Password Security
- [ ] Check database: passwords are hashed
- [ ] Hashing algorithm: bcrypt
- [ ] Cost factor: 12
- [ ] No plaintext passwords stored

## Phase 12: Final Checks

### 12.1 Documentation Accuracy
- [ ] README instructions work
- [ ] Backend README accurate
- [ ] Frontend README accurate
- [ ] DEPLOYMENT.md steps valid

### 12.2 Environment Configuration
- [ ] All required env vars documented
- [ ] .env.example files complete
- [ ] No secrets in .env.example

### 12.3 CI/CD Pipeline
```bash
# Push to GitHub and check Actions
git push origin main
```

- [ ] GitHub Actions workflow triggers
- [ ] All CI checks pass (lint, test, build)
- [ ] Coverage reports generated

### 12.4 Code Quality
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Test coverage >= 80%
- [ ] No critical security vulnerabilities (npm audit)

## Sign-Off

### Documentation
- [ ] All documentation reviewed and accurate
- [ ] README files comprehensive
- [ ] API endpoints documented
- [ ] Database schema documented

### Functionality
- [ ] All authentication flows work
- [ ] OAuth integration functional
- [ ] 2FA working correctly
- [ ] Email verification working
- [ ] Password reset working
- [ ] Protected routes secured

### Infrastructure
- [ ] Database running and accessible
- [ ] Redis running and accessible
- [ ] Backend server stable
- [ ] Frontend server stable
- [ ] Docker Compose working
- [ ] Health checks passing

### Security
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] CORS properly configured
- [ ] Rate limiting working
- [ ] Passwords properly hashed
- [ ] JWT tokens secure

### Performance
- [ ] Response times acceptable
- [ ] No N+1 query issues
- [ ] Frontend loads quickly
- [ ] No memory leaks

### Quality
- [ ] Code linted and formatted
- [ ] Type checking passes
- [ ] Tests written and passing
- [ ] Coverage >= 80%
- [ ] CI/CD pipeline working

## Sprint 0 Completion Criteria

✅ All checkboxes in this document checked
✅ No critical bugs or security issues
✅ All acceptance criteria from sprint-0.json met
✅ Documentation complete and accurate
✅ Infrastructure stable and monitored
✅ Ready for Sprint 1 development

---

**Checklist Version**: 1.0
**Last Updated**: November 4, 2025
**Reviewer**: QA Team
