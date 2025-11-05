# Deployment Guide

This guide covers deploying Neurmatic to production and staging environments.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Code coverage >= 80%
- [ ] No console.log statements in production code
- [ ] All TODO comments resolved
- [ ] Security audit passed (`npm audit`)

### Configuration

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Seed data prepared (if applicable)
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] OAuth credentials configured
- [ ] Email service configured
- [ ] Sentry project created
- [ ] CI/CD pipeline tested

### Documentation

- [ ] API documentation updated
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Migration guide written (if breaking changes)

## Environment Setup

### Supported Platforms

- **AWS** (EC2, RDS, ElastiCache, S3, CloudFront)
- **Railway** (easiest option for PostgreSQL + Redis)
- **DigitalOcean** (Droplets, Managed Databases)
- **Render** (good for simple deploys)
- **Vercel** (frontend only)
- **Netlify** (frontend only)

### Required Services

1. **Compute**: Node.js hosting (EC2, Railway, Render)
2. **Database**: PostgreSQL 15+ (RDS, Railway, DO Managed DB)
3. **Cache**: Redis 7+ (ElastiCache, Railway, DO Managed Redis)
4. **Storage**: S3 or R2 for media files
5. **CDN**: CloudFront or Cloudflare for static assets
6. **Email**: SendGrid or AWS SES
7. **Monitoring**: Sentry for error tracking

## Database Setup

### PostgreSQL Configuration

#### Production Settings

```ini
# postgresql.conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
```

#### Create Database

```bash
# On production server
psql -U postgres

CREATE DATABASE neurmatic_production;
CREATE USER neurmatic_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE neurmatic_production TO neurmatic_user;
\c neurmatic_production
GRANT ALL ON SCHEMA public TO neurmatic_user;
```

#### Enable Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
```

### Run Migrations

```bash
cd backend

# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@prod-host:5432/neurmatic_production"

# Run migrations (NEVER use migrate dev in production!)
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### Database Backups

#### Automated Backups (pg_dump)

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="neurmatic_$DATE.sql.gz"

pg_dump -h $DB_HOST -U $DB_USER -d neurmatic_production | gzip > "$BACKUP_DIR/$FILENAME"

# Keep only last 30 days
find $BACKUP_DIR -name "neurmatic_*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp "$BACKUP_DIR/$FILENAME" s3://neurmatic-backups/db/
```

Schedule with cron:
```cron
0 2 * * * /opt/scripts/backup.sh
```

## Backend Deployment

### Build Application

```bash
cd backend

# Install dependencies
npm ci --production=false

# Generate Prisma Client
npm run prisma:generate

# Build TypeScript
npm run build

# Install only production dependencies
rm -rf node_modules
npm ci --production
```

### Environment Variables

Create `.env.production`:

```env
NODE_ENV=production
PORT=3000
API_URL=https://api.neurmatic.com
FRONTEND_URL=https://neurmatic.com

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/neurmatic_production

# Redis
REDIS_URL=redis://prod-redis:6379

# JWT (Generate strong secrets)
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# OAuth
GOOGLE_CLIENT_ID=prod_google_client_id
GOOGLE_CLIENT_SECRET=prod_google_secret
GOOGLE_CALLBACK_URL=https://api.neurmatic.com/api/v1/auth/oauth/google/callback

# Email
SENDGRID_API_KEY=prod_sendgrid_key
FROM_EMAIL=noreply@neurmatic.com

# AWS S3
AWS_ACCESS_KEY_ID=prod_aws_key
AWS_SECRET_ACCESS_KEY=prod_aws_secret
AWS_S3_BUCKET=neurmatic-production-media
AWS_REGION=eu-west-1

# Sentry
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=<64-char-random-string>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Process Manager (PM2)

Install PM2:
```bash
npm install -g pm2
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'neurmatic-api',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/neurmatic-api
upstream backend {
    least_conn;
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name api.neurmatic.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.neurmatic.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.neurmatic.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.neurmatic.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Proxy settings
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check endpoint (no logging)
    location /api/v1/health {
        proxy_pass http://backend;
        access_log off;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/neurmatic-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Frontend Deployment

### Build for Production

```bash
cd frontend

# Install dependencies
npm ci

# Build
npm run build

# Output in dist/ directory
ls -lh dist/
```

### Static Hosting Options

#### Vercel (Recommended for Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "@vite_api_url",
    "VITE_WS_URL": "@vite_ws_url",
    "VITE_SENTRY_DSN": "@vite_sentry_dsn"
  }
}
```

#### Nginx (Self-Hosted)

```nginx
# /etc/nginx/sites-available/neurmatic-frontend
server {
    listen 80;
    server_name neurmatic.com www.neurmatic.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name neurmatic.com www.neurmatic.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/neurmatic.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/neurmatic.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/neurmatic/dist;
    index index.html;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache";
    }
}
```

Deploy files:
```bash
# Copy dist to server
scp -r dist/* user@server:/var/www/neurmatic/dist/

# Or use rsync
rsync -avz --delete dist/ user@server:/var/www/neurmatic/dist/
```

## Post-Deployment

### Verify Deployment

#### Backend Health Checks

```bash
# Health check
curl https://api.neurmatic.com/api/v1/health

# Database connectivity
curl https://api.neurmatic.com/api/v1/health/db

# Redis connectivity
curl https://api.neurmatic.com/api/v1/health/redis
```

#### Frontend Checks

```bash
# Homepage loads
curl -I https://neurmatic.com

# JavaScript bundles load
curl -I https://neurmatic.com/assets/index.js

# Check for errors in browser console
```

### Smoke Tests

Test critical user journeys:

1. **Registration**:
   - Navigate to /register
   - Fill form and submit
   - Verify email received
   - Verify email link works

2. **Login**:
   - Navigate to /login
   - Enter credentials
   - Verify redirect to dashboard
   - Verify token stored

3. **OAuth**:
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Verify redirect back to app

4. **API Endpoints**:
   ```bash
   # Test protected endpoint
   curl -H "Authorization: Bearer $TOKEN" \
     https://api.neurmatic.com/api/v1/users/me
   ```

### DNS and SSL

#### Configure DNS

```dns
# A Records
neurmatic.com        A     <server-ip>
www.neurmatic.com    A     <server-ip>
api.neurmatic.com    A     <server-ip>

# CNAME (if using CDN)
www.neurmatic.com    CNAME <cdn-url>
```

#### SSL Certificates (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d neurmatic.com -d www.neurmatic.com -d api.neurmatic.com

# Auto-renewal (certbot installs a cron job automatically)
sudo certbot renew --dry-run
```

## Monitoring

### Application Monitoring

- **Sentry**: Error tracking and performance monitoring
  - Dashboard: https://sentry.io/organizations/neurmatic/
  - View errors, releases, and performance metrics

- **PM2 Monitoring**:
  ```bash
  pm2 monit
  pm2 logs
  pm2 status
  ```

### Infrastructure Monitoring

- **Server Metrics**: CPU, Memory, Disk
  - Use AWS CloudWatch, DigitalOcean Monitoring, or custom solution

- **Database Monitoring**:
  ```sql
  -- Active connections
  SELECT count(*) FROM pg_stat_activity;

  -- Long-running queries
  SELECT pid, now() - query_start as duration, query
  FROM pg_stat_activity
  WHERE state = 'active' AND now() - query_start > interval '1 minute';
  ```

- **Redis Monitoring**:
  ```bash
  redis-cli INFO
  redis-cli INFO memory
  redis-cli INFO stats
  ```

### Alerting

Set up alerts for:
- High error rate (> 1% of requests)
- Slow response times (p95 > 1s)
- High CPU usage (> 80%)
- High memory usage (> 90%)
- Database connection errors
- Redis connection errors

## Rollback Procedures

### Backend Rollback

```bash
# List PM2 processes
pm2 list

# Stop current version
pm2 stop neurmatic-api

# Checkout previous version
cd /opt/neurmatic/backend
git fetch --all
git checkout <previous-tag-or-commit>

# Reinstall dependencies
npm ci --production

# Rebuild
npm run build

# Restart
pm2 restart neurmatic-api

# Verify
curl https://api.neurmatic.com/api/v1/health
```

### Frontend Rollback

```bash
# Copy previous build
sudo cp -r /var/www/neurmatic/dist.backup /var/www/neurmatic/dist

# Or rebuild from previous version
cd /opt/neurmatic/frontend
git checkout <previous-tag>
npm ci
npm run build
sudo rsync -avz --delete dist/ /var/www/neurmatic/dist/
```

### Database Rollback

**WARNING**: Rolling back migrations can cause data loss!

```bash
# View migration history
npx prisma migrate status

# Rollback one migration (use with extreme caution!)
# This is not directly supported by Prisma
# You need to manually write down migration to revert changes

# Better approach: Deploy a hotfix
```

## Troubleshooting

### Common Issues

**Backend not starting**:
```bash
pm2 logs neurmatic-api --err
# Check for:
# - Missing environment variables
# - Database connection issues
# - Port already in use
```

**Database connection timeout**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection from backend server
psql -h <db-host> -U <db-user> -d neurmatic_production

# Check firewall rules
sudo ufw status
```

**Redis connection failed**:
```bash
# Check Redis is running
sudo systemctl status redis

# Test connection
redis-cli -h <redis-host> ping

# Check authentication
redis-cli -h <redis-host> -a <password> ping
```

### Performance Issues

**Slow API responses**:
1. Check database query performance
2. Enable query logging: `log_statement = 'all'` in postgresql.conf
3. Use EXPLAIN ANALYZE on slow queries
4. Add missing indexes
5. Review N+1 query issues

**High memory usage**:
1. Check for memory leaks with `heapdump`
2. Review cache sizes
3. Optimize query results
4. Consider horizontal scaling

---

For additional help, contact the DevOps team or refer to [Infrastructure Documentation](../projectdoc/README.md).

**Last Updated**: November 2025
