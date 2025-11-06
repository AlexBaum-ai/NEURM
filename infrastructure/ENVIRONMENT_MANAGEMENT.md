# Environment Variables Management Guide

This guide covers how to manage environment variables securely across different environments.

## Table of Contents

1. [Environment Overview](#environment-overview)
2. [Secret Generation](#secret-generation)
3. [Storage Options](#storage-options)
4. [GitHub Secrets](#github-secrets)
5. [Local Development](#local-development)
6. [Staging Environment](#staging-environment)
7. [Production Environment](#production-environment)
8. [Secret Rotation](#secret-rotation)
9. [Security Best Practices](#security-best-practices)

---

## Environment Overview

Neurmatic uses three environments:

| Environment | Purpose | Domain | CI/CD |
|-------------|---------|--------|-------|
| **Development** | Local development | localhost | No |
| **Staging** | Pre-production testing | staging.neurmatic.com | Auto-deploy on `develop` |
| **Production** | Live application | neurmatic.com | Manual deploy on release |

---

## Secret Generation

### Generate Strong Secrets

```bash
# Generate 64-character secret for JWT
openssl rand -base64 64 | tr -d '\n' && echo

# Generate UUID
uuidgen

# Generate 32-character password
openssl rand -base64 32

# Generate bcrypt hash for password
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('password', 12, (err, hash) => console.log(hash));"
```

### Required Secrets

**JWT Secrets:**
- `JWT_SECRET` - Main JWT signing key (64+ chars)
- `JWT_REFRESH_SECRET` - Refresh token signing key (64+ chars)

**Database:**
- `POSTGRES_PASSWORD` - Database password (32+ chars)
- `DATABASE_URL` - Full connection string with password

**Redis:**
- `REDIS_PASSWORD` - Redis auth password (32+ chars)

**Session:**
- `SESSION_SECRET` - Express session secret (64+ chars)

**OAuth Providers:**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

**Email:**
- `SENDGRID_API_KEY`

**AWS:**
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`

**Monitoring:**
- `SENTRY_DSN` / `SENTRY_AUTH_TOKEN`

---

## Storage Options

### 1. Environment Files (.env)

**Pros:** Simple, works with Docker Compose
**Cons:** Risk of committing to Git, not encrypted
**Use for:** Development only

```bash
# .env.development (NEVER commit this!)
DATABASE_URL=postgresql://user:pass@localhost:5432/neurmatic
JWT_SECRET=dev_secret_not_for_production
```

### 2. GitHub Secrets

**Pros:** Encrypted, integrated with CI/CD
**Cons:** Only accessible in GitHub Actions
**Use for:** CI/CD pipeline variables

```bash
# Set via GitHub UI: Settings → Secrets and variables → Actions
```

### 3. AWS Secrets Manager

**Pros:** Encrypted, audited, versioned, IAM-controlled
**Cons:** AWS-specific, costs money
**Use for:** Production secrets

```bash
# Store secret
aws secretsmanager create-secret \
  --name /neurmatic/production/database-url \
  --secret-string "postgresql://..."

# Retrieve secret
aws secretsmanager get-secret-value \
  --secret-id /neurmatic/production/database-url \
  --query SecretString \
  --output text
```

### 4. HashiCorp Vault

**Pros:** Platform-agnostic, fine-grained access, dynamic secrets
**Cons:** Complex setup, self-hosted
**Use for:** Multi-cloud production environments

```bash
# Store secret
vault kv put secret/neurmatic/production database_url="postgresql://..."

# Retrieve secret
vault kv get -field=database_url secret/neurmatic/production
```

### 5. Docker Secrets (Swarm/Kubernetes)

**Pros:** Native to container orchestration
**Cons:** Requires Swarm or Kubernetes
**Use for:** Containerized production deployments

```yaml
# docker-compose with secrets
secrets:
  db_password:
    external: true

services:
  backend:
    secrets:
      - db_password
```

---

## GitHub Secrets

### Configure GitHub Secrets

**Navigate to:** `https://github.com/AlexBaum-ai/NEURM/settings/secrets/actions`

### Required Secrets for CI/CD

**Deployment:**
```
PRODUCTION_HOST=vps-1a707765.vps.ovh.net
PRODUCTION_USERNAME=root
PRODUCTION_SSH_KEY=<private-ssh-key-content>
PRODUCTION_API_URL=https://api.neurmatic.com
PRODUCTION_WS_URL=wss://api.neurmatic.com

STAGING_HOST=vps-1a707765.vps.ovh.net
STAGING_USERNAME=root
STAGING_SSH_KEY=<private-ssh-key-content>
STAGING_API_URL=https://api.staging.neurmatic.com
STAGING_WS_URL=wss://api.staging.neurmatic.com
```

**Application Secrets:**
```
POSTGRES_PASSWORD=<64-char-secret>
REDIS_PASSWORD=<64-char-secret>
JWT_SECRET=<64-char-secret>
JWT_REFRESH_SECRET=<64-char-secret>
SESSION_SECRET=<64-char-secret>

GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
LINKEDIN_CLIENT_ID=<client-id>
LINKEDIN_CLIENT_SECRET=<client-secret>
GITHUB_CLIENT_ID=<client-id>
GITHUB_CLIENT_SECRET=<client-secret>

SENDGRID_API_KEY=<api-key>
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_S3_BUCKET=neurmatic-production-media

SENTRY_DSN=<dsn>
SENTRY_AUTH_TOKEN=<auth-token>
SENTRY_ORG=<org-slug>

VITE_SENTRY_DSN=<frontend-dsn>
```

**Notifications:**
```
SLACK_WEBHOOK_URL=<webhook-url>
```

### Use Secrets in GitHub Actions

```yaml
# .github/workflows/deploy-production.yml
- name: Deploy to production server
  uses: appleboy/ssh-action@v1.2.0
  with:
    host: ${{ secrets.PRODUCTION_HOST }}
    username: ${{ secrets.PRODUCTION_USERNAME }}
    key: ${{ secrets.PRODUCTION_SSH_KEY }}
    script: |
      cd /opt/neurmatic
      docker-compose -f docker-compose.production.yml up -d
```

---

## Local Development

### Setup Local Environment

```bash
# 1. Copy example environment file
cp backend/.env.example backend/.env.development
cp frontend/.env.example frontend/.env.development

# 2. Generate local secrets
echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')" >> backend/.env.development
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')" >> backend/.env.development
echo "SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')" >> backend/.env.development

# 3. Edit .env.development with your local values
vim backend/.env.development
```

### Local Environment File

**backend/.env.development:**

```env
NODE_ENV=development
PORT=3000

# Database (Docker Compose)
DATABASE_URL=postgresql://neurmatic:neurmatic_dev_password@localhost:5432/neurmatic

# Redis (Docker Compose)
REDIS_URL=redis://localhost:6379

# JWT (Local development secrets)
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# Session
SESSION_SECRET=<generated-secret>
BCRYPT_ROUNDS=10

# OAuth (Test credentials)
GOOGLE_CLIENT_ID=test_client_id
GOOGLE_CLIENT_SECRET=test_client_secret
GOOGLE_CALLBACK_URL=http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/oauth/google/callback

# Email (Test mode)
SENDGRID_API_KEY=test_key
FROM_EMAIL=dev@localhost
SUPPORT_EMAIL=support@localhost

# AWS (LocalStack or test credentials)
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=neurmatic-dev
AWS_REGION=eu-west-1

# Sentry (Optional in development)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0

# Logging
LOG_LEVEL=debug

# URLs
FRONTEND_URL=http://vps-1a707765.vps.ovh.net:5173
API_URL=http://vps-1a707765.vps.ovh.net:3000

# Rate Limiting (More permissive in dev)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

**frontend/.env.development:**

```env
VITE_API_URL=http://vps-1a707765.vps.ovh.net:3000/api/v1
VITE_WS_URL=ws://vps-1a707765.vps.ovh.net:3000
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=development
```

---

## Staging Environment

### Setup Staging Environment

```bash
# 1. SSH to server
ssh root@vps-1a707765.vps.ovh.net

# 2. Create staging environment file
cd /opt/neurmatic
cp .env.example .env.staging

# 3. Generate staging secrets
./infrastructure/scripts/generate-secrets.sh > .env.staging

# 4. Edit with staging-specific values
vim .env.staging
```

### Staging Environment File

**.env.staging:**

```env
NODE_ENV=staging
ENVIRONMENT=staging

# Server
HOST=vps-1a707765.vps.ovh.net
API_URL=https://api.staging.neurmatic.com
FRONTEND_URL=https://staging.neurmatic.com

# Database
POSTGRES_USER=neurmatic_staging
POSTGRES_PASSWORD=<generated-secret>
DATABASE_URL=postgresql://neurmatic_staging:<password>@postgres:5432/neurmatic_staging

# Redis
REDIS_PASSWORD=<generated-secret>
REDIS_URL=redis://:<password>@redis:6379

# JWT
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# Session
SESSION_SECRET=<generated-secret>
BCRYPT_ROUNDS=12

# OAuth (Staging credentials)
GOOGLE_CLIENT_ID=<staging-client-id>
GOOGLE_CLIENT_SECRET=<staging-client-secret>
GOOGLE_CALLBACK_URL=https://api.staging.neurmatic.com/api/v1/auth/oauth/google/callback

# Email (Real but test domain)
SENDGRID_API_KEY=<staging-api-key>
FROM_EMAIL=noreply@staging.neurmatic.com
SUPPORT_EMAIL=support@staging.neurmatic.com

# AWS (Staging bucket)
AWS_ACCESS_KEY_ID=<staging-access-key>
AWS_SECRET_ACCESS_KEY=<staging-secret-key>
AWS_S3_BUCKET=neurmatic-staging-media
AWS_REGION=eu-west-1

# Sentry (Staging environment)
SENTRY_DSN=<staging-dsn>
SENTRY_ENVIRONMENT=staging
SENTRY_TRACES_SAMPLE_RATE=0.5

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200

# Logging
LOG_LEVEL=info

# Docker Registry
REGISTRY=ghcr.io
IMAGE_NAME_BACKEND=alexbaum-ai/neurm-backend
IMAGE_NAME_FRONTEND=alexbaum-ai/neurm-frontend
IMAGE_TAG=staging-latest
```

---

## Production Environment

### Setup Production Environment

```bash
# 1. SSH to production server
ssh root@vps-1a707765.vps.ovh.net

# 2. Create production environment file
cd /opt/neurmatic
touch .env.production
chmod 600 .env.production  # Restrict permissions

# 3. Generate production secrets (STRONG!)
./infrastructure/scripts/generate-secrets.sh --production > .env.production

# 4. Edit with production-specific values
vim .env.production

# 5. Verify secrets are strong
./infrastructure/scripts/verify-secrets.sh .env.production
```

### Production Environment File

See [PRODUCTION_INFRASTRUCTURE.md](./PRODUCTION_INFRASTRUCTURE.md#environment-variables-management) for complete production environment variables.

---

## Secret Rotation

### When to Rotate Secrets

**Immediately:**
- Secret compromised or leaked
- Employee departure (access revocation)
- Security breach

**Regularly:**
- Every 90 days: Database passwords
- Every 90 days: API keys
- Every 180 days: JWT secrets
- After major security update

### Rotation Procedure

**1. Generate New Secret:**

```bash
NEW_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "New secret: $NEW_SECRET"
```

**2. Update Environment:**

```bash
# Update .env.production
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" .env.production
```

**3. Update GitHub Secrets:**

Navigate to: `Settings → Secrets and variables → Actions → Edit secret`

**4. Deploy with Zero Downtime:**

```bash
# For secrets that support dual-mode (e.g., JWT):
# 1. Add NEW_JWT_SECRET alongside JWT_SECRET
# 2. Accept tokens signed with either secret
# 3. Deploy
# 4. Wait for all old tokens to expire (30 days)
# 5. Remove old JWT_SECRET
# 6. Rename NEW_JWT_SECRET to JWT_SECRET

# For secrets that require immediate rotation:
# 1. Schedule maintenance window
# 2. Update secret
# 3. Deploy
# 4. All users must re-authenticate
```

**5. Verify:**

```bash
# Test authentication with new secret
curl -X POST https://api.neurmatic.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

---

## Security Best Practices

### 1. Never Commit Secrets to Git

**Prevent accidental commits:**

```bash
# Add to .gitignore
echo "*.env*" >> .gitignore
echo "!*.env.example" >> .gitignore

# Use git-secrets to scan commits
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets && make install
git secrets --install
git secrets --register-aws
```

### 2. Use Different Secrets Per Environment

Never reuse production secrets in development or staging!

```
✅ GOOD: Different secrets for dev, staging, production
❌ BAD: Same JWT_SECRET across all environments
```

### 3. Restrict Access

```bash
# File permissions (production server)
chmod 600 .env.production
chown root:root .env.production

# Limit who can access GitHub Secrets
# Settings → Collaborators → Adjust permissions
```

### 4. Encrypt Secrets at Rest

**Use AWS Secrets Manager or HashiCorp Vault** for production secrets.

### 5. Audit Secret Access

```bash
# GitHub: Settings → Security → Audit log
# AWS: CloudTrail logs
# Vault: Audit logs
```

### 6. Monitor for Leaked Secrets

**GitHub Secret Scanning:**
- Automatically scans commits for known secret patterns
- Alerts repository admins

**GitGuardian:**
- Third-party service for secret detection
- Integrates with GitHub

### 7. Use Environment-Specific Validation

```typescript
// backend/src/config/unifiedConfig.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  JWT_SECRET: z.string().min(64, 'JWT_SECRET must be at least 64 characters'),
  DATABASE_URL: z.string().url(),
});

// Validate on startup
export const config = envSchema.parse(process.env);
```

### 8. Implement Secret Expiry

```typescript
// Example: Rotate API keys every 90 days
const API_KEY_MAX_AGE = 90 * 24 * 60 * 60 * 1000; // 90 days

if (Date.now() - apiKeyCreatedAt > API_KEY_MAX_AGE) {
  throw new Error('API key expired. Please rotate.');
}
```

---

## Troubleshooting

### Issue: "Missing environment variable"

```bash
# Check if variable is set
docker-compose -f docker-compose.production.yml config | grep JWT_SECRET

# Restart services to pick up new env vars
docker-compose -f docker-compose.production.yml restart backend-1
```

### Issue: "Invalid JWT secret"

```bash
# Verify JWT_SECRET is correctly set
docker-compose -f docker-compose.production.yml exec backend-1 printenv JWT_SECRET

# If empty or wrong, update .env.production and restart
vim .env.production
docker-compose -f docker-compose.production.yml restart backend-1
```

### Issue: "Database connection failed"

```bash
# Verify DATABASE_URL is correct
docker-compose -f docker-compose.production.yml exec backend-1 printenv DATABASE_URL

# Test connection manually
docker-compose -f docker-compose.production.yml exec backend-1 \
  node -e "require('./dist/config/database').testConnection()"
```

---

## Quick Reference

### Development

```bash
# Generate .env.development
cp backend/.env.example backend/.env.development
# Edit with local values
```

### Staging

```bash
# Deploy with staging secrets
docker-compose -f docker-compose.staging.yml --env-file .env.staging up -d
```

### Production

```bash
# Deploy with production secrets
docker-compose -f docker-compose.production.yml --env-file .env.production up -d
```

### Rotate Secret

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# 2. Update .env file
sed -i "s/OLD_SECRET=.*/OLD_SECRET=$NEW_SECRET/" .env.production

# 3. Restart services
docker-compose -f docker-compose.production.yml restart
```

---

**Last Updated:** 2025-01-06
**Maintained by:** DevOps Team
