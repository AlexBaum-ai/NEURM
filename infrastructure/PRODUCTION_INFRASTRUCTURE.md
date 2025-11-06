# Production Infrastructure Guide

This comprehensive guide covers all aspects of Neurmatic's production infrastructure, deployment, and operations.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Server Configuration](#server-configuration)
3. [Environment Setup](#environment-setup)
4. [SSL/TLS Configuration](#ssltls-configuration)
5. [Load Balancing](#load-balancing)
6. [Database Configuration](#database-configuration)
7. [Redis Configuration](#redis-configuration)
8. [Backup Strategy](#backup-strategy)
9. [Disaster Recovery](#disaster-recovery)
10. [Scaling Strategy](#scaling-strategy)
11. [Monitoring & Alerting](#monitoring--alerting)
12. [Security Hardening](#security-hardening)
13. [Deployment Procedures](#deployment-procedures)
14. [Rollback Procedures](#rollback-procedures)
15. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Production Stack

```
                                     ┌─────────────┐
                                     │  Cloudflare │
                                     │     CDN     │
                                     └──────┬──────┘
                                            │
                                            ▼
                                     ┌──────────────┐
                                     │    Nginx     │
                                     │Load Balancer │
                                     └──────┬───────┘
                                            │
                       ┌────────────────────┼────────────────────┐
                       │                    │                    │
                       ▼                    ▼                    ▼
              ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
              │  Backend 1  │      │  Backend 2  │      │  Frontend   │
              │   Node.js   │      │   Node.js   │      │    Nginx    │
              └──────┬──────┘      └──────┬──────┘      └─────────────┘
                     │                     │
                     └──────────┬──────────┘
                                │
                     ┌──────────┴──────────┐
                     │                     │
                     ▼                     ▼
            ┌─────────────────┐   ┌──────────────┐
            │   PostgreSQL    │   │    Redis     │
            │  Primary + Hot  │   │ Master+Slave │
            │     Standby     │   │   Sentinel   │
            └─────────────────┘   └──────────────┘
```

### Infrastructure Components

| Component | Technology | Purpose | Redundancy |
|-----------|-----------|---------|------------|
| Load Balancer | Nginx | Traffic distribution, SSL termination | Active-Passive |
| Backend API | Node.js 20 (Express) | Business logic, API endpoints | 2+ instances |
| Frontend | React 18 (Vite + Nginx) | User interface | Static files on CDN |
| Database | PostgreSQL 15 | Primary data store | Hot standby replica |
| Cache/Queue | Redis 7 | Session, cache, job queue | Master-Slave with Sentinel |
| Object Storage | AWS S3 / R2 | Media files, backups | Multi-region |
| CDN | Cloudflare | Static assets, edge caching | Global |
| Monitoring | Sentry, Custom | Error tracking, metrics | SaaS |

### Server Requirements

**Production Server (VPS):**
- Host: `vps-1a707765.vps.ovh.net`
- OS: Ubuntu 22.04 LTS
- CPU: 4+ cores (8 recommended)
- RAM: 16GB minimum (32GB recommended)
- Storage: 200GB+ SSD
- Network: 1Gbps

---

## Server Configuration

### Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
    curl wget git vim \
    docker.io docker-compose \
    nginx certbot python3-certbot-nginx \
    postgresql-client redis-tools \
    ufw fail2ban \
    htop iotop nethogs

# Enable Docker
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Directory Structure

```bash
/opt/neurmatic/
├── backend/              # Backend application
├── frontend/             # Frontend application
├── infrastructure/       # Infrastructure configs
│   ├── nginx/           # Nginx configurations
│   ├── scripts/         # Operational scripts
│   └── terraform/       # Infrastructure as Code
├── backups/             # Database backups
├── logs/                # Application logs
├── docker-compose.production.yml
└── .env.production
```

### System Limits

```bash
# Edit /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768

# Edit /etc/sysctl.conf
fs.file-max = 2097152
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.ip_local_port_range = 1024 65535
vm.swappiness = 10
```

---

## Environment Setup

### Environment Variables Management

**Production Environment File (`.env.production`):**

```env
# Environment
NODE_ENV=production
ENVIRONMENT=production

# Server Configuration
HOST=vps-1a707765.vps.ovh.net
API_URL=https://api.neurmatic.com
FRONTEND_URL=https://neurmatic.com

# Database
POSTGRES_USER=neurmatic_prod
POSTGRES_PASSWORD=<generate-strong-password-64-chars>
DATABASE_URL=postgresql://neurmatic_prod:<password>@postgres:5432/neurmatic_production?connection_limit=50&pool_timeout=30

# Redis
REDIS_PASSWORD=<generate-strong-password-64-chars>
REDIS_URL=redis://:<password>@redis:6379

# JWT Secrets (Generate with: openssl rand -base64 64)
JWT_SECRET=<generate-64-char-random-string>
JWT_REFRESH_SECRET=<generate-64-char-random-string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# Session
SESSION_SECRET=<generate-64-char-random-string>
BCRYPT_ROUNDS=12

# OAuth - Google
GOOGLE_CLIENT_ID=<production-google-client-id>
GOOGLE_CLIENT_SECRET=<production-google-client-secret>
GOOGLE_CALLBACK_URL=https://api.neurmatic.com/api/v1/auth/oauth/google/callback

# OAuth - LinkedIn
LINKEDIN_CLIENT_ID=<production-linkedin-client-id>
LINKEDIN_CLIENT_SECRET=<production-linkedin-client-secret>
LINKEDIN_CALLBACK_URL=https://api.neurmatic.com/api/v1/auth/oauth/linkedin/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=<production-github-client-id>
GITHUB_CLIENT_SECRET=<production-github-client-secret>
GITHUB_CALLBACK_URL=https://api.neurmatic.com/api/v1/auth/oauth/github/callback

# Email (SendGrid)
SENDGRID_API_KEY=<production-sendgrid-api-key>
FROM_EMAIL=noreply@neurmatic.com
SUPPORT_EMAIL=support@neurmatic.com

# AWS S3
AWS_ACCESS_KEY_ID=<production-aws-access-key>
AWS_SECRET_ACCESS_KEY=<production-aws-secret-key>
AWS_S3_BUCKET=neurmatic-production-media
AWS_REGION=eu-west-1

# Sentry
SENTRY_DSN=<production-sentry-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=warn

# Docker Registry
REGISTRY=ghcr.io
IMAGE_NAME_BACKEND=alexbaum-ai/neurm-backend
IMAGE_NAME_FRONTEND=alexbaum-ai/neurm-frontend
IMAGE_TAG=production-latest
```

### Secrets Management

**Use GitHub Secrets for CI/CD:**

```bash
# Required GitHub Secrets:
PRODUCTION_HOST=vps-1a707765.vps.ovh.net
PRODUCTION_USERNAME=root
PRODUCTION_SSH_KEY=<private-ssh-key>
PRODUCTION_API_URL=https://api.neurmatic.com
PRODUCTION_WS_URL=wss://api.neurmatic.com

POSTGRES_PASSWORD=<secret>
REDIS_PASSWORD=<secret>
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
SESSION_SECRET=<secret>

GOOGLE_CLIENT_ID=<secret>
GOOGLE_CLIENT_SECRET=<secret>
# ... (all other secrets)

SENTRY_AUTH_TOKEN=<sentry-auth-token>
SENTRY_ORG=<sentry-org-slug>
SLACK_WEBHOOK_URL=<slack-webhook-for-notifications>
```

**Generate Strong Secrets:**

```bash
# Generate 64-character random string
openssl rand -base64 64 | tr -d '\n' && echo

# Generate UUID
uuidgen

# Generate password
openssl rand -base64 32
```

---

## SSL/TLS Configuration

### Let's Encrypt SSL Certificates

**Install Certbot:**

```bash
sudo apt install certbot python3-certbot-nginx
```

**Obtain Certificates:**

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Obtain certificates for all domains
sudo certbot certonly --standalone \
  -d neurmatic.com \
  -d www.neurmatic.com \
  -d api.neurmatic.com \
  --email admin@neurmatic.com \
  --agree-tos \
  --no-eff-email

# Start nginx
sudo systemctl start nginx
```

**Certificate Locations:**

```
/etc/letsencrypt/live/neurmatic.com/
├── fullchain.pem   # Full certificate chain
├── privkey.pem     # Private key
├── cert.pem        # Certificate only
└── chain.pem       # Intermediate certificates
```

**Auto-Renewal:**

```bash
# Certbot automatically installs a cron job
# Verify with:
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew

# Post-renewal hook (reload nginx)
sudo certbot renew --deploy-hook "systemctl reload nginx"
```

**Link Certificates for Docker:**

```bash
# Create infrastructure SSL directory
mkdir -p /opt/neurmatic/infrastructure/nginx/ssl/production

# Symlink certificates
sudo ln -s /etc/letsencrypt/live/neurmatic.com/fullchain.pem \
  /opt/neurmatic/infrastructure/nginx/ssl/production/fullchain.pem

sudo ln -s /etc/letsencrypt/live/neurmatic.com/privkey.pem \
  /opt/neurmatic/infrastructure/nginx/ssl/production/privkey.pem

sudo ln -s /etc/letsencrypt/live/neurmatic.com/chain.pem \
  /opt/neurmatic/infrastructure/nginx/ssl/production/chain.pem
```

### SSL Configuration Best Practices

- **Use TLS 1.2 and 1.3 only** (disable TLS 1.0/1.1)
- **Strong cipher suites** (ECDHE preferred)
- **Enable OCSP stapling** (faster certificate validation)
- **Enable HSTS** (HTTP Strict Transport Security)
- **Perfect Forward Secrecy** (PFS with ECDHE)
- **Certificate transparency** (check with SSLLabs)

---

## Load Balancing

### Nginx Load Balancer Configuration

The production Nginx configuration (`infrastructure/nginx/production.conf`) provides:

- **Load balancing** across multiple backend instances
- **SSL termination** (offload TLS from backends)
- **Rate limiting** (API protection)
- **Response caching** (reduce backend load)
- **Health checks** (automatic failover)
- **WebSocket support** (persistent connections)

### Load Balancing Algorithms

**Least Connections (Current):**
```nginx
upstream backend_api {
    least_conn;  # Route to backend with fewest active connections
    server backend-1:3000 max_fails=3 fail_timeout=30s weight=1;
    server backend-2:3000 max_fails=3 fail_timeout=30s weight=1;
}
```

**Alternative: Round Robin:**
```nginx
upstream backend_api {
    server backend-1:3000;
    server backend-2:3000;
}
```

**Alternative: IP Hash (Sticky Sessions):**
```nginx
upstream backend_api {
    ip_hash;  # Same client always goes to same backend
    server backend-1:3000;
    server backend-2:3000;
}
```

### Health Checks

Nginx performs passive health checks:
- `max_fails=3`: Mark backend unhealthy after 3 failed requests
- `fail_timeout=30s`: Try again after 30 seconds

**Active Health Checks (Nginx Plus or custom):**
```nginx
location / {
    proxy_pass http://backend_api;
    health_check interval=10s fails=3 passes=2 uri=/api/v1/health;
}
```

### Scaling Backend Instances

**Add more backend instances:**

Edit `docker-compose.production.yml`:

```yaml
  backend-3:
    image: ${REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}
    container_name: neurmatic-backend-3-production
    # ... (same config as backend-1)
```

Update Nginx upstream:

```nginx
upstream backend_api {
    least_conn;
    server backend-1:3000 max_fails=3 fail_timeout=30s;
    server backend-2:3000 max_fails=3 fail_timeout=30s;
    server backend-3:3000 max_fails=3 fail_timeout=30s;  # New
}
```

Reload:
```bash
docker-compose -f docker-compose.production.yml up -d backend-3
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
```

---

## Database Configuration

### PostgreSQL Production Settings

The production `docker-compose.production.yml` includes optimized PostgreSQL settings:

```yaml
command:
  - "postgres"
  - "-c max_connections=200"           # Support 200 concurrent connections
  - "-c shared_buffers=512MB"          # Memory for caching
  - "-c effective_cache_size=2GB"      # OS cache size
  - "-c maintenance_work_mem=128MB"    # Memory for maintenance ops
  - "-c checkpoint_completion_target=0.9"
  - "-c wal_buffers=16MB"
  - "-c work_mem=2621kB"               # Memory per query operation
  - "-c max_worker_processes=4"
  - "-c max_parallel_workers=4"
  - "-c log_min_duration_statement=1000" # Log queries > 1s
```

### Database Connection Pooling

**Prisma Connection Pool:**

```typescript
// backend/src/config/database.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=50&pool_timeout=30',
    },
  },
});
```

**PgBouncer (Optional - for very high traffic):**

```bash
# Install PgBouncer
docker run -d --name pgbouncer \
  -e POSTGRESQL_HOST=postgres \
  -e POSTGRESQL_PORT=5432 \
  -e POSTGRESQL_USERNAME=neurmatic \
  -e POSTGRESQL_PASSWORD=<password> \
  -e POSTGRESQL_DATABASE=neurmatic_production \
  -e PGBOUNCER_POOL_MODE=transaction \
  -e PGBOUNCER_MAX_CLIENT_CONN=1000 \
  -e PGBOUNCER_DEFAULT_POOL_SIZE=50 \
  --network neurmatic-network \
  bitnami/pgbouncer:latest
```

### Database Replication (High Availability)

**Setup Hot Standby Replica:**

```yaml
# docker-compose.production.yml
  postgres-replica:
    image: postgres:15-alpine
    container_name: neurmatic-postgres-replica
    environment:
      POSTGRES_USER: replicator
      POSTGRES_PASSWORD: ${REPLICATOR_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data
    command: |
      postgres
      -c wal_level=replica
      -c hot_standby=on
      -c max_wal_senders=10
      -c max_replication_slots=10
      -c hot_standby_feedback=on
```

**Configure Primary for Replication:**

```sql
-- On primary database
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD '<password>';
```

```bash
# pg_hba.conf
host    replication     replicator      172.21.0.0/16        md5
```

**Read Replica Routing:**

```typescript
// Use replica for read-only queries
const prismaReplica = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_REPLICA_URL,
    },
  },
});

// Read from replica
const articles = await prismaReplica.article.findMany();

// Write to primary
const newArticle = await prisma.article.create({ data: {...} });
```

---

## Redis Configuration

### Redis Master-Slave with Sentinel

**Production Redis Setup:**

```yaml
# docker-compose.production.yml
  redis-master:
    image: redis:7-alpine
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
      --appendonly yes

  redis-slave:
    image: redis:7-alpine
    command: >
      redis-server
      --slaveof redis-master 6379
      --requirepass ${REDIS_PASSWORD}
      --masterauth ${REDIS_PASSWORD}

  redis-sentinel:
    image: redis:7-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - ./infrastructure/redis/sentinel.conf:/etc/redis/sentinel.conf
```

**Sentinel Configuration (`infrastructure/redis/sentinel.conf`):**

```conf
port 26379
sentinel monitor mymaster redis-master 6379 2
sentinel auth-pass mymaster <redis-password>
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 10000
```

### Redis Persistence

**RDB + AOF (Best for Production):**

```bash
# RDB: Snapshots at intervals
save 900 1        # Save if at least 1 key changed in 900s
save 300 10       # Save if at least 10 keys changed in 300s
save 60 10000     # Save if at least 10000 keys changed in 60s

# AOF: Append-only file (more durable)
appendonly yes
appendfsync everysec  # Sync to disk every second
```

### Redis Monitoring

```bash
# Check Redis info
docker exec neurmatic-redis-production redis-cli -a <password> INFO

# Monitor commands
docker exec neurmatic-redis-production redis-cli -a <password> MONITOR

# Check memory usage
docker exec neurmatic-redis-production redis-cli -a <password> INFO memory

# Check connected clients
docker exec neurmatic-redis-production redis-cli -a <password> CLIENT LIST
```

---

## Backup Strategy

### Automated Database Backups

**Backup Schedule:**
- **Frequency:** Daily at 2:00 AM UTC
- **Retention:** 30 days local, 90 days in S3
- **Format:** Compressed SQL dumps (.sql.gz)
- **Storage:** Local + AWS S3 (with lifecycle policy)

**Backup Script:** `/opt/neurmatic/infrastructure/scripts/backup.sh`

**Cron Job:**

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/neurmatic/infrastructure/scripts/backup.sh >> /var/log/neurmatic_backup.log 2>&1
```

**Manual Backup:**

```bash
cd /opt/neurmatic
export PGPASSWORD=<database-password>
./infrastructure/scripts/backup.sh
```

**Verify Backups:**

```bash
# List local backups
ls -lh /opt/neurmatic/backups/

# List S3 backups
aws s3 ls s3://neurmatic-backups/database/

# Test restore (on staging!)
./infrastructure/scripts/restore.sh /opt/neurmatic/backups/neurmatic_20250106_020000.sql.gz
```

### Backup Testing

**Monthly restore test (required!):**

```bash
# Restore to test database
export DB_NAME=neurmatic_test_restore
./infrastructure/scripts/restore.sh <latest-backup>

# Verify data integrity
psql -h localhost -U neurmatic -d neurmatic_test_restore -c "\dt"
psql -h localhost -U neurmatic -d neurmatic_test_restore -c "SELECT COUNT(*) FROM users;"

# Clean up
psql -h localhost -U neurmatic -d postgres -c "DROP DATABASE neurmatic_test_restore;"
```

### S3 Lifecycle Policy

```json
{
  "Rules": [
    {
      "Id": "MoveToGlacierAfter90Days",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

---

## Disaster Recovery

### Disaster Recovery Plan (DRP)

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 24 hours (daily backups)

### Disaster Scenarios

#### 1. Database Failure

**Symptoms:**
- Backend cannot connect to database
- Database container crashed
- Data corruption

**Recovery Steps:**

```bash
# 1. Stop all services
docker-compose -f docker-compose.production.yml down

# 2. Check database logs
docker logs neurmatic-postgres-production

# 3. Attempt restart
docker-compose -f docker-compose.production.yml up -d postgres

# 4. If restart fails, restore from backup
./infrastructure/scripts/restore.sh s3://neurmatic-backups/database/<latest-backup>

# 5. Restart all services
docker-compose -f docker-compose.production.yml up -d

# 6. Verify health
./infrastructure/scripts/health-check.sh
```

#### 2. Backend API Failure

**Symptoms:**
- API returning 5xx errors
- High memory usage
- Application crashes

**Recovery Steps:**

```bash
# 1. Check backend logs
docker logs neurmatic-backend-1-production
docker logs neurmatic-backend-2-production

# 2. Restart backends
docker-compose -f docker-compose.production.yml restart backend-1 backend-2

# 3. If issue persists, rollback to previous version
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d backend-1 backend-2

# 4. Check health
curl https://api.neurmatic.com/api/v1/health
```

#### 3. Complete Server Failure

**Symptoms:**
- Server unreachable
- Hardware failure
- Network outage

**Recovery Steps:**

```bash
# 1. Provision new server
# - Use same OS (Ubuntu 22.04)
# - Configure SSH access
# - Install Docker, Docker Compose

# 2. Clone repository
git clone https://github.com/AlexBaum-ai/NEURM.git /opt/neurmatic
cd /opt/neurmatic

# 3. Restore environment variables
# - Copy .env.production from secrets manager
# - Update HOST if server IP changed

# 4. Restore database
docker-compose -f docker-compose.production.yml up -d postgres
./infrastructure/scripts/restore.sh s3://neurmatic-backups/database/<latest-backup>

# 5. Deploy application
docker-compose -f docker-compose.production.yml up -d

# 6. Update DNS
# - Point neurmatic.com to new server IP
# - Wait for DNS propagation (up to 48 hours)

# 7. Obtain SSL certificates
sudo certbot certonly --standalone -d neurmatic.com -d www.neurmatic.com -d api.neurmatic.com

# 8. Verify all services
./infrastructure/scripts/health-check.sh --verbose
```

#### 4. Data Loss / Corruption

**Symptoms:**
- Missing or corrupted data
- Unexpected deletions

**Recovery Steps:**

```bash
# 1. Identify scope of data loss
# - Check recent database changes
# - Review application logs

# 2. Stop writes to database
docker-compose -f docker-compose.production.yml down backend-1 backend-2

# 3. Identify last known good backup
aws s3 ls s3://neurmatic-backups/database/ | tail -n 20

# 4. Restore to separate database
export DB_NAME=neurmatic_recovery
./infrastructure/scripts/restore.sh s3://neurmatic-backups/database/<backup-before-corruption>

# 5. Export missing/corrupted data
pg_dump -h localhost -U neurmatic -d neurmatic_recovery -t <affected-table> > recovery_data.sql

# 6. Import to production (carefully!)
psql -h localhost -U neurmatic -d neurmatic_production < recovery_data.sql

# 7. Verify data integrity
# - Run data validation queries
# - Check application functionality

# 8. Resume normal operations
docker-compose -f docker-compose.production.yml up -d
```

### Disaster Recovery Testing

**Quarterly DR Drill:**

```bash
# 1. Schedule maintenance window
# 2. Simulate server failure
# 3. Execute recovery procedures
# 4. Measure RTO/RPO
# 5. Document issues and improvements
```

**DR Checklist:**

- [ ] All backups accessible and valid
- [ ] Recovery procedures documented and tested
- [ ] Team trained on recovery procedures
- [ ] Contact list updated (on-call engineers)
- [ ] DNS TTL reduced during deployment (for faster failover)
- [ ] Alternative server provisioned or ready to provision
- [ ] Secrets stored in secure location (not just on server)

---

## Scaling Strategy

### Horizontal Scaling (Application Layer)

**Current:** 2 backend instances
**Target:** Auto-scale 2-8 instances based on load

**Add Backend Instances:**

```bash
# docker-compose.production.yml
services:
  backend-3:
    # ... same config as backend-1
  backend-4:
    # ... same config as backend-1
```

**Update Nginx Upstream:**

```nginx
upstream backend_api {
    least_conn;
    server backend-1:3000;
    server backend-2:3000;
    server backend-3:3000;
    server backend-4:3000;
}
```

**Stateless Design:**
- ✅ **Sessions:** Stored in Redis (shared across backends)
- ✅ **File Uploads:** Direct to S3 (not local filesystem)
- ✅ **Background Jobs:** Queue in Redis (processed by any backend)

### Vertical Scaling (Database Layer)

**Current:** 4 CPU, 16GB RAM
**Target:** 8 CPU, 32GB RAM for high load

**Upgrade Database Resources:**

```yaml
# docker-compose.production.yml
  postgres:
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: 32G
```

**Adjust PostgreSQL Settings:**

```yaml
command:
  - "-c max_connections=400"        # Increased from 200
  - "-c shared_buffers=8GB"         # Increased from 512MB
  - "-c effective_cache_size=24GB"  # Increased from 2GB
  - "-c work_mem=16MB"              # Increased from 2621kB
```

### Auto-Scaling (Kubernetes - Future)

**Deploy to Kubernetes:**

```yaml
# kubernetes/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neurmatic-backend
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: backend
        image: ghcr.io/alexbaum-ai/neurm-backend:latest
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 2Gi
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: neurmatic-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: neurmatic-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Load Testing

**Test scaling before production:**

```bash
# Install k6
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz
sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin/

# Run load test
k6 run backend/tests/load/k6-load-test.js

# Targets:
# - 1000 concurrent users
# - <200ms p95 response time
# - <1% error rate
```

---

## Monitoring & Alerting

See [MONITORING_AND_ERROR_HANDLING.md](../backend/MONITORING_AND_ERROR_HANDLING.md) for comprehensive monitoring setup.

**Key Monitoring Endpoints:**

- **Health Check:** `GET /api/v1/health`
- **Metrics:** `GET /api/v1/metrics` (admin only)
- **Bull Board:** `GET /admin/queues` (job queue dashboard)

**Alerting Thresholds:**

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | > 5% | > 10% |
| Response Time (p95) | > 500ms | > 1000ms |
| CPU Usage | > 80% | > 90% |
| Memory Usage | > 85% | > 95% |
| Disk Usage | > 85% | > 95% |
| Database Connections | > 180 | > 195 |
| Redis Memory | > 1.8GB | > 1.95GB |

---

## Security Hardening

See [SECURITY.md](../backend/SECURITY.md) for comprehensive security measures.

**Production Security Checklist:**

- [x] Firewall configured (UFW)
- [x] Fail2ban enabled (SSH protection)
- [x] SSL/TLS certificates (Let's Encrypt)
- [x] Strong passwords (64+ characters)
- [x] Environment variables secured
- [x] Database access restricted (localhost only)
- [x] Redis password protected
- [x] Rate limiting enabled
- [x] CORS configured
- [x] Security headers set (Helmet)
- [x] Input validation (Zod)
- [x] SQL injection prevention (Prisma)
- [x] XSS prevention (sanitization)
- [x] CSRF protection (tokens)
- [x] Docker non-root user
- [x] Regular security updates

---

## Deployment Procedures

### Manual Deployment

```bash
# 1. SSH to production server
ssh root@vps-1a707765.vps.ovh.net

# 2. Navigate to project directory
cd /opt/neurmatic

# 3. Pull latest changes
git fetch origin
git checkout <version-tag>  # e.g., v1.0.0

# 4. Build and pull Docker images
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml pull

# 5. Create backup
./infrastructure/scripts/backup.sh

# 6. Deploy
docker-compose -f docker-compose.production.yml up -d

# 7. Run migrations
docker-compose -f docker-compose.production.yml exec backend-1 npx prisma migrate deploy

# 8. Health check
./infrastructure/scripts/health-check.sh

# 9. Monitor logs
docker-compose -f docker-compose.production.yml logs -f --tail=100
```

### Automated Deployment (GitHub Actions)

**Trigger:** Push tag or manual workflow dispatch

```bash
# Create and push tag
git tag v1.0.0
git push origin v1.0.0

# Or manual dispatch from GitHub Actions UI
```

**Workflow:** `.github/workflows/deploy-production.yml`

---

## Rollback Procedures

### Quick Rollback

```bash
# 1. SSH to production
ssh root@vps-1a707765.vps.ovh.net
cd /opt/neurmatic

# 2. Check current version
git describe --tags

# 3. List recent tags
git tag -l | tail -n 10

# 4. Rollback to previous version
git checkout <previous-version-tag>

# 5. Rebuild and redeploy
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# 6. Verify
./infrastructure/scripts/health-check.sh
```

### Database Rollback (Last Resort)

```bash
# WARNING: Only if migration caused data loss
# Better: Deploy hotfix with reverse migration

# 1. Stop backends
docker-compose -f docker-compose.production.yml down backend-1 backend-2

# 2. Restore database
./infrastructure/scripts/restore.sh <backup-before-deployment>

# 3. Rollback application
git checkout <previous-version>
docker-compose -f docker-compose.production.yml up -d

# 4. Verify
./infrastructure/scripts/health-check.sh
```

---

## Troubleshooting

### Common Issues

**1. High CPU Usage**

```bash
# Check Docker stats
docker stats

# Check processes
docker-compose -f docker-compose.production.yml exec backend-1 top

# Check slow queries
docker-compose -f docker-compose.production.yml logs postgres | grep "duration"
```

**2. Memory Leaks**

```bash
# Monitor memory over time
docker stats --no-stream

# Check heap size
docker-compose -f docker-compose.production.yml exec backend-1 node --expose-gc -e "global.gc(); console.log(process.memoryUsage())"

# Restart if necessary
docker-compose -f docker-compose.production.yml restart backend-1
```

**3. Database Connection Pool Exhausted**

```bash
# Check active connections
docker-compose -f docker-compose.production.yml exec postgres psql -U neurmatic -d neurmatic_production -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
docker-compose -f docker-compose.production.yml exec postgres psql -U neurmatic -d neurmatic_production -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < NOW() - INTERVAL '10 minutes';"
```

**4. Redis Out of Memory**

```bash
# Check memory usage
docker-compose -f docker-compose.production.yml exec redis redis-cli -a <password> INFO memory

# Flush cache (if safe)
docker-compose -f docker-compose.production.yml exec redis redis-cli -a <password> FLUSHDB

# Restart Redis
docker-compose -f docker-compose.production.yml restart redis
```

**5. SSL Certificate Expiry**

```bash
# Check expiry date
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Reload nginx
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
```

---

## Support & Escalation

**On-Call Rotation:**
- Primary: Senior Backend Engineer
- Secondary: DevOps Engineer
- Escalation: CTO

**Contact:** See internal wiki for current on-call schedule

**Incident Response:**
1. Assess severity (P0-P4)
2. Execute runbook
3. Notify stakeholders
4. Document incident
5. Post-mortem review

---

**Last Updated:** 2025-01-06
**Version:** 1.0
**Maintained by:** DevOps Team
