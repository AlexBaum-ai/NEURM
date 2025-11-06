# Infrastructure Documentation

This directory contains all infrastructure configurations, scripts, and documentation for deploying and managing Neurmatic in production.

## Directory Structure

```
infrastructure/
├── README.md                          # This file
├── PRODUCTION_INFRASTRUCTURE.md       # Complete production infrastructure guide
├── ENVIRONMENT_MANAGEMENT.md          # Environment variables and secrets management
├── RUNBOOK.md                         # Operational procedures and incident response
├── nginx/                             # Nginx reverse proxy configurations
│   ├── staging.conf                   # Staging environment Nginx config
│   └── production.conf                # Production environment Nginx config
├── scripts/                           # Operational scripts
│   ├── backup.sh                      # Database backup script (daily)
│   ├── restore.sh                     # Database restore script
│   ├── health-check.sh                # Health check script
│   └── (future scripts)
└── terraform/                         # Infrastructure as Code (future)
    └── (terraform configs)
```

## Quick Start

### For Operators

**Daily Operations:**
```bash
# Morning health check
./scripts/health-check.sh --verbose

# Check backups
ls -lth /opt/neurmatic/backups/ | head -5
```

**Deployment:**
```bash
# See RUNBOOK.md for complete procedure
cd /opt/neurmatic
./infrastructure/scripts/backup.sh  # Pre-deployment backup
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

**Incident Response:**
```bash
# See RUNBOOK.md for detailed procedures
./scripts/health-check.sh
docker-compose -f docker-compose.production.yml logs --tail=100
```

### For Developers

**Local Development:**
```bash
# Start local environment
docker-compose up -d

# Check health
curl http://localhost:3000/api/v1/health
```

**Deploy to Staging:**
```bash
# Automatic via GitHub Actions on push to develop branch
git push origin develop
```

**Deploy to Production:**
```bash
# Tag release
git tag v1.0.0
git push origin v1.0.0

# Or manual dispatch from GitHub Actions
```

## Documentation

### 1. Production Infrastructure ([PRODUCTION_INFRASTRUCTURE.md](./PRODUCTION_INFRASTRUCTURE.md))

Complete production infrastructure guide covering:
- **Architecture Overview** - System design and components
- **Server Configuration** - Initial server setup
- **Environment Setup** - Environment variables and configuration
- **SSL/TLS Configuration** - Let's Encrypt certificates
- **Load Balancing** - Nginx load balancer configuration
- **Database Configuration** - PostgreSQL optimization and replication
- **Redis Configuration** - Cache and queue setup with Sentinel
- **Backup Strategy** - Automated backups and retention
- **Disaster Recovery** - Recovery procedures for different scenarios
- **Scaling Strategy** - Horizontal and vertical scaling
- **Monitoring & Alerting** - Health checks and thresholds
- **Security Hardening** - Production security checklist
- **Deployment Procedures** - Step-by-step deployment guide
- **Rollback Procedures** - Emergency rollback steps
- **Troubleshooting** - Common issues and solutions

### 2. Environment Management ([ENVIRONMENT_MANAGEMENT.md](./ENVIRONMENT_MANAGEMENT.md))

Environment variables and secrets management:
- **Environment Overview** - Dev, staging, production
- **Secret Generation** - How to generate strong secrets
- **Storage Options** - Where to store secrets (GitHub, AWS, Vault)
- **GitHub Secrets** - CI/CD secret configuration
- **Local Development** - Local environment setup
- **Staging Environment** - Staging configuration
- **Production Environment** - Production secrets management
- **Secret Rotation** - How and when to rotate secrets
- **Security Best Practices** - Secrets security guidelines

### 3. Operational Runbook ([RUNBOOK.md](./RUNBOOK.md))

Day-to-day operational procedures:
- **Daily Operations** - Morning health checks, monitoring
- **Deployment** - Manual and automated deployment procedures
- **Incident Response** - P0/P1 incident procedures
- **Maintenance Tasks** - Weekly, monthly, quarterly tasks
- **Emergency Procedures** - Emergency response for critical issues

## Key Files

### Docker Compose Files

- **`docker-compose.yml`** - Development environment (root directory)
- **`docker-compose.staging.yml`** - Staging environment (root directory)
- **`docker-compose.production.yml`** - Production environment (root directory)

### Nginx Configuration

- **`nginx/staging.conf`** - Staging Nginx with SSL, load balancing, rate limiting
- **`nginx/production.conf`** - Production Nginx with enhanced security, caching, multiple backends

### Scripts

- **`scripts/backup.sh`** - Creates compressed PostgreSQL backups, uploads to S3, manages retention
- **`scripts/restore.sh`** - Restores database from local or S3 backup with safety checks
- **`scripts/health-check.sh`** - Checks health of all services (API, DB, Redis, disk, memory)

## CI/CD Pipelines

### GitHub Actions Workflows

Located in `.github/workflows/`:

- **`ci.yml`** - Continuous Integration (tests, lint, build)
- **`deploy-staging.yml`** - Deploy to staging on push to `develop`
- **`deploy-production.yml`** - Deploy to production on release tag

### Required GitHub Secrets

See [ENVIRONMENT_MANAGEMENT.md](./ENVIRONMENT_MANAGEMENT.md#github-secrets) for complete list of required secrets.

**Critical Secrets:**
- `PRODUCTION_HOST` - Production server hostname
- `PRODUCTION_SSH_KEY` - SSH private key for deployment
- `POSTGRES_PASSWORD` - Database password
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - JWT signing keys
- `SENTRY_DSN` - Error tracking
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - S3 access

## Production Environment

### Server Specifications

- **Host:** vps-1a707765.vps.ovh.net
- **OS:** Ubuntu 22.04 LTS
- **CPU:** 4+ cores (8 recommended)
- **RAM:** 16GB minimum (32GB recommended)
- **Storage:** 200GB+ SSD
- **Network:** 1Gbps

### Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| Nginx | `neurmatic-nginx-production` | 443, 80 | Reverse proxy, load balancer, SSL termination |
| Backend 1 | `neurmatic-backend-1-production` | 3000 | Node.js API instance 1 |
| Backend 2 | `neurmatic-backend-2-production` | 3000 | Node.js API instance 2 |
| Frontend | `neurmatic-frontend-production` | 80 | React app served by Nginx |
| PostgreSQL | `neurmatic-postgres-production` | 5432 | Primary database |
| Redis | `neurmatic-redis-production` | 6379 | Cache, sessions, job queue |

### Domains

- **Production:** https://neurmatic.com (frontend), https://api.neurmatic.com (API)
- **Staging:** https://staging.neurmatic.com (frontend), https://api.staging.neurmatic.com (API)

### Monitoring

- **Sentry:** Error tracking and performance monitoring
- **Health Checks:** Automated via `/api/v1/health` endpoint
- **Bull Board:** Job queue monitoring at `/admin/queues`
- **Logs:** Docker logs, Nginx access/error logs, Winston application logs

## Security

### Security Measures

- [x] **Firewall:** UFW configured (SSH, HTTP, HTTPS only)
- [x] **Fail2ban:** SSH brute-force protection
- [x] **SSL/TLS:** Let's Encrypt certificates, TLS 1.2+
- [x] **HSTS:** HTTP Strict Transport Security enabled
- [x] **Security Headers:** X-Frame-Options, CSP, X-Content-Type-Options
- [x] **Rate Limiting:** API rate limiting via Nginx
- [x] **CORS:** Restricted to frontend domain
- [x] **Strong Passwords:** 64+ character secrets
- [x] **Non-root Docker:** Containers run as non-root user
- [x] **Database Access:** Restricted to localhost
- [x] **Redis Auth:** Password protected
- [x] **Input Validation:** Zod schemas
- [x] **SQL Injection:** Prevented via Prisma ORM
- [x] **XSS Prevention:** Content sanitization
- [x] **CSRF Protection:** Token-based

### Security Audits

- **Automated:** npm audit (weekly)
- **Manual:** Penetration testing (quarterly)
- **Dependencies:** Dependabot alerts enabled

## Backup & Disaster Recovery

### Backup Strategy

- **Frequency:** Daily at 2:00 AM UTC (automated via cron)
- **Retention:** 30 days local, 90 days in S3
- **Format:** Compressed SQL dumps (.sql.gz)
- **Storage:** Local + AWS S3 with lifecycle policy
- **Verification:** Monthly restore tests required

### Disaster Recovery

- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 24 hours
- **Procedures:** See [PRODUCTION_INFRASTRUCTURE.md](./PRODUCTION_INFRASTRUCTURE.md#disaster-recovery)

### Backup Locations

- **Local:** `/opt/neurmatic/backups/`
- **S3:** `s3://neurmatic-backups/database/`

## Scaling

### Current Capacity

- **Concurrent Users:** 1000+
- **API Response Time:** <200ms (p95)
- **Database Connections:** 200 max
- **Backend Instances:** 2

### Scaling Options

**Horizontal Scaling (Application):**
- Add more backend instances (currently 2, can scale to 8+)
- Load balanced by Nginx (least connections)

**Vertical Scaling (Database):**
- Increase CPU/RAM for database container
- Optimize PostgreSQL configuration

**Future: Kubernetes Auto-Scaling**
- HorizontalPodAutoscaler based on CPU/memory
- Scale 2-10 backend instances automatically

## Monitoring & Alerting

### Key Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| API Response Time (p95) | <200ms | >500ms |
| Error Rate | <1% | >5% |
| CPU Usage | <80% | >90% |
| Memory Usage | <85% | >95% |
| Disk Usage | <80% | >90% |

### Monitoring Tools

- **Sentry:** Error tracking, performance monitoring
- **Custom Metrics:** `/api/v1/metrics` endpoint (admin-only)
- **Health Checks:** `/api/v1/health` endpoint
- **Logs:** Winston (application), Nginx (access), Docker (container)

## Support

### On-Call Rotation

- **Primary:** Senior Backend Engineer
- **Secondary:** DevOps Engineer
- **Escalation:** CTO

### Communication Channels

- **Slack #incidents:** Critical incidents (P0/P1)
- **Slack #deployments:** Deployment notifications
- **Slack #ops:** Daily operations, health checks

### Escalation Path

1. **P0 (Critical):** Site down, data loss - Immediate response
2. **P1 (High):** Degraded performance, partial outage - 30 min response
3. **P2 (Medium):** Non-critical bugs - 4 hour response
4. **P3 (Low):** Minor issues, feature requests - Next business day

## Resources

### Documentation

- [Main README](../README.md)
- [Backend README](../backend/README.md)
- [Frontend README](../frontend/README.md)
- [Project Documentation](../projectdoc/README.md)
- [API Endpoints](../projectdoc/03-API_ENDPOINTS.md)
- [Database Schema](../projectdoc/02-DATABASE_SCHEMA.md)

### External Links

- [Production Site](https://neurmatic.com)
- [Staging Site](https://staging.neurmatic.com)
- [Sentry Dashboard](https://sentry.io/organizations/neurmatic/)
- [GitHub Repository](https://github.com/AlexBaum-ai/NEURM)

### Training Materials

- **New Team Member Onboarding:** [RUNBOOK.md](./RUNBOOK.md)
- **Deployment Training:** [PRODUCTION_INFRASTRUCTURE.md](./PRODUCTION_INFRASTRUCTURE.md#deployment-procedures)
- **Incident Response Training:** [RUNBOOK.md](./RUNBOOK.md#incident-response)

## Changelog

### v1.0.0 - 2025-01-06

- ✅ Initial production infrastructure setup
- ✅ Docker Compose configurations for staging and production
- ✅ Nginx configurations with SSL, load balancing, rate limiting
- ✅ Automated backup and restore scripts
- ✅ Health check script
- ✅ Comprehensive documentation
- ✅ CI/CD pipelines (GitHub Actions)
- ✅ Disaster recovery procedures
- ✅ Environment management guide
- ✅ Operational runbook

---

**Last Updated:** 2025-01-06
**Version:** 1.0
**Maintained by:** DevOps Team

For questions or issues, contact the DevOps team via Slack #ops channel.
