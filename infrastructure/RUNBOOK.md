# Production Runbook

This runbook provides step-by-step procedures for common operational tasks.

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Deployment](#deployment)
3. [Incident Response](#incident-response)
4. [Maintenance Tasks](#maintenance-tasks)
5. [Emergency Procedures](#emergency-procedures)

---

## Daily Operations

### Morning Health Check

**Time:** 9:00 AM daily
**Duration:** 5 minutes

```bash
# 1. SSH to production server
ssh root@vps-1a707765.vps.ovh.net

# 2. Navigate to project directory
cd /opt/neurmatic

# 3. Run health check
./infrastructure/scripts/health-check.sh --verbose

# 4. Check Docker containers
docker-compose -f docker-compose.production.yml ps

# 5. Review last night's backup
ls -lth /opt/neurmatic/backups/ | head -n 5

# 6. Check error rates in Sentry
# Navigate to: https://sentry.io/organizations/neurmatic/issues/

# 7. Review Nginx access logs for anomalies
docker-compose -f docker-compose.production.yml logs nginx --tail=100 | grep -E "50[0-9]|40[0-9]"

# 8. Check disk space
df -h /

# 9. Check memory usage
free -h

# 10. Document any issues in Slack #ops channel
```

**Expected Results:**
- All services: ✓ HEALTHY
- Backup exists with today's date
- Error rate: < 1%
- Disk usage: < 80%
- Memory available: > 20%

---

## Deployment

### Production Deployment (Manual)

**Trigger:** Release tagged in GitHub
**Duration:** 15-20 minutes
**Downtime:** None (rolling deployment)

**Prerequisites:**
- [ ] Code reviewed and approved
- [ ] All tests passing in CI
- [ ] Staging deployment successful
- [ ] Database migrations tested in staging
- [ ] Backup completed (automatic daily or manual)
- [ ] Team notified in #deployments channel

**Procedure:**

```bash
# 1. SSH to production server
ssh root@vps-1a707765.vps.ovh.net

# 2. Navigate to project
cd /opt/neurmatic

# 3. Create pre-deployment backup
echo "Creating pre-deployment backup..."
./infrastructure/scripts/backup.sh
BACKUP_FILE=$(ls -t /opt/neurmatic/backups/*.sql.gz | head -n1)
echo "Backup created: $BACKUP_FILE"

# 4. Pull latest code
git fetch origin
git checkout <version-tag>  # e.g., v1.2.0

# 5. Pull Docker images from registry
docker-compose -f docker-compose.production.yml pull

# 6. Run database migrations (if any)
docker-compose -f docker-compose.production.yml exec backend-1 npx prisma migrate deploy

# 7. Rolling deployment - backend instances
echo "Deploying backend-1..."
docker-compose -f docker-compose.production.yml up -d --no-deps backend-1
sleep 30  # Wait for backend-1 to be healthy
docker-compose -f docker-compose.production.yml exec backend-1 wget -q --spider http://localhost:3000/api/v1/health || echo "Backend-1 unhealthy!"

echo "Deploying backend-2..."
docker-compose -f docker-compose.production.yml up -d --no-deps backend-2
sleep 30  # Wait for backend-2 to be healthy
docker-compose -f docker-compose.production.yml exec backend-2 wget -q --spider http://localhost:3000/api/v1/health || echo "Backend-2 unhealthy!"

# 8. Deploy frontend
echo "Deploying frontend..."
docker-compose -f docker-compose.production.yml up -d --no-deps frontend

# 9. Reload Nginx (no downtime)
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload

# 10. Clean up old Docker images
docker image prune -af

# 11. Verify deployment
echo "Running post-deployment health check..."
./infrastructure/scripts/health-check.sh --verbose

# 12. Smoke tests
echo "Running smoke tests..."
curl -f https://neurmatic.com/ || echo "Frontend FAILED"
curl -f https://api.neurmatic.com/api/v1/health || echo "API health check FAILED"
curl -f -H "Authorization: Bearer <test-token>" https://api.neurmatic.com/api/v1/users/me || echo "API auth FAILED"

# 13. Monitor logs for 5 minutes
echo "Monitoring logs for errors..."
docker-compose -f docker-compose.production.yml logs -f --tail=100 backend-1 backend-2 | grep -i error &
LOG_PID=$!
sleep 300  # Monitor for 5 minutes
kill $LOG_PID

# 14. Check Sentry for new errors
echo "Check Sentry: https://sentry.io/organizations/neurmatic/issues/"

# 15. Notify team
echo "Deployment complete! Version: <version-tag>"
# Post to Slack #deployments channel
```

**Success Criteria:**
- All health checks passing
- No 5xx errors in logs
- API response time < 200ms
- No new critical errors in Sentry
- Smoke tests passing

**Rollback Criteria (if any fail):**
- Health checks failing after 5 minutes
- > 5% error rate
- Critical errors in Sentry
- User reports of issues

**Rollback Procedure:**

```bash
# 1. Notify team
echo "ROLLBACK INITIATED"

# 2. Revert to previous version
git checkout <previous-version-tag>
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d backend-1 backend-2 frontend

# 3. Restore database if needed
# ./infrastructure/scripts/restore.sh $BACKUP_FILE

# 4. Verify
./infrastructure/scripts/health-check.sh

# 5. Document in Slack
echo "Rollback complete. Investigating issue."
```

---

## Incident Response

### P0 Incident: Production Down

**Definition:** Site unreachable, critical functionality broken
**Response Time:** Immediate
**Max Duration:** 15 minutes to restore service

**Procedure:**

```bash
# 1. Acknowledge incident
echo "P0 INCIDENT: Production down"
# Post to Slack #incidents channel

# 2. Check if server is reachable
ping vps-1a707765.vps.ovh.net
ssh root@vps-1a707765.vps.ovh.net

# 3. If SSH fails: Contact hosting provider (OVH)
# OVH Support: https://www.ovh.com/manager/

# 4. If SSH works: Check Docker services
cd /opt/neurmatic
docker-compose -f docker-compose.production.yml ps

# 5. Restart all services
docker-compose -f docker-compose.production.yml restart

# 6. Check health
./infrastructure/scripts/health-check.sh

# 7. If still down: Check individual services
docker-compose -f docker-compose.production.yml logs --tail=100 postgres
docker-compose -f docker-compose.production.yml logs --tail=100 redis
docker-compose -f docker-compose.production.yml logs --tail=100 backend-1

# 8. Identify root cause and fix
# Common causes:
# - Database crashed: docker-compose up -d postgres
# - Redis OOM: docker-compose restart redis
# - Backend crash: Check logs, restart backends
# - Disk full: Clean up old backups, logs
# - SSL certificate expired: Renew with certbot

# 9. Document incident in postmortem
# Template: /infrastructure/templates/postmortem.md

# 10. Update status page
# If you have a status page, update it
```

### P1 Incident: Degraded Performance

**Definition:** Site slow, intermittent errors, non-critical functionality broken
**Response Time:** 30 minutes
**Max Duration:** 2 hours to restore full performance

**Procedure:**

```bash
# 1. Identify symptoms
# - Slow response times
# - High error rate
# - Timeouts

# 2. Check resource usage
ssh root@vps-1a707765.vps.ovh.net
cd /opt/neurmatic
docker stats --no-stream

# 3. Check database performance
docker-compose -f docker-compose.production.yml logs postgres | grep "duration" | tail -50

# 4. Check backend logs
docker-compose -f docker-compose.production.yml logs backend-1 backend-2 | grep -i "error\|timeout\|slow"

# 5. Check Nginx logs
docker-compose -f docker-compose.production.yml logs nginx | tail -100

# 6. Check Sentry for spike in errors
# Navigate to Sentry dashboard

# 7. Mitigate based on cause:
# - High CPU: Scale up backend instances
# - High memory: Restart services, check for memory leaks
# - Slow queries: Add indexes, optimize queries
# - High traffic: Enable caching, scale horizontally
# - External API down: Implement fallback, increase timeouts

# 8. Apply mitigation
# Example: Add another backend instance
docker-compose -f docker-compose.production.yml up -d --scale backend=3

# 9. Monitor improvements
./infrastructure/scripts/health-check.sh --verbose
docker stats --no-stream

# 10. Document and follow up
```

---

## Maintenance Tasks

### Weekly: Review and Clean Up

**Time:** Saturday 10:00 AM
**Duration:** 30 minutes

```bash
# 1. SSH to server
ssh root@vps-1a707765.vps.ovh.net
cd /opt/neurmatic

# 2. Clean old Docker images
docker image prune -af

# 3. Clean old logs (> 30 days)
find /var/log/nginx -name "*.log" -mtime +30 -delete
find /opt/neurmatic/logs -name "*.log" -mtime +30 -delete

# 4. Clean old backups (> 30 days local, script handles S3)
find /opt/neurmatic/backups -name "*.sql.gz" -mtime +30 -delete

# 5. Review disk usage
df -h
du -sh /var/lib/docker
du -sh /opt/neurmatic

# 6. Update system packages (if no deployment planned)
apt update
apt list --upgradable
# If safe, upgrade:
# apt upgrade -y && reboot

# 7. Review Sentry issues
# Close resolved issues, prioritize new ones

# 8. Check SSL certificate expiry
certbot certificates

# 9. Review and archive old logs in S3
aws s3 sync /opt/neurmatic/logs/ s3://neurmatic-logs/$(date +%Y-%m-%d)/

# 10. Document any findings
```

### Monthly: Security Updates

**Time:** First Sunday of month, 6:00 AM
**Duration:** 1-2 hours
**Downtime:** Possible (5-10 minutes for server reboot)

```bash
# 1. Notify team 48 hours in advance
echo "Scheduled maintenance: First Sunday, 6:00-8:00 AM"

# 2. Create backup
./infrastructure/scripts/backup.sh

# 3. Update system packages
apt update
apt upgrade -y

# 4. Update Docker
apt install docker.io docker-compose

# 5. Rebuild Docker images with latest base images
cd /opt/neurmatic
docker-compose -f docker-compose.production.yml build --no-cache --pull

# 6. Deploy updated images
docker-compose -f docker-compose.production.yml up -d

# 7. Reboot server (if kernel updated)
reboot

# 8. Wait for services to start (2-3 minutes)
sleep 180

# 9. Verify health
./infrastructure/scripts/health-check.sh --verbose

# 10. Run full test suite against production
npm run test:e2e -- --baseUrl=https://neurmatic.com

# 11. Notify team: Maintenance complete
```

### Quarterly: Disaster Recovery Test

**Time:** Last Sunday of quarter, 8:00 AM
**Duration:** 4 hours
**Downtime:** None (test on staging)

```bash
# 1. Document current production state
# - Version deployed
# - Database size
# - Number of users, articles, etc.

# 2. Simulate server failure
# Stop production temporarily (with team approval)
docker-compose -f docker-compose.production.yml down

# 3. Execute disaster recovery procedures
# See [PRODUCTION_INFRASTRUCTURE.md](./PRODUCTION_INFRASTRUCTURE.md#disaster-recovery)

# 4. Measure RTO/RPO
# - Time to restore: Should be < 4 hours
# - Data loss: Should be < 24 hours

# 5. Document lessons learned
# - What went well
# - What needs improvement
# - Action items

# 6. Update runbook based on findings
```

---

## Emergency Procedures

### Emergency: Database Corruption

```bash
# 1. Stop all writes
docker-compose -f docker-compose.production.yml down backend-1 backend-2

# 2. Assess corruption
docker-compose -f docker-compose.production.yml exec postgres psql -U neurmatic -d neurmatic_production -c "SELECT * FROM users LIMIT 1;"

# 3. If recoverable: Run VACUUM FULL
docker-compose -f docker-compose.production.yml exec postgres psql -U neurmatic -d neurmatic_production -c "VACUUM FULL;"

# 4. If not recoverable: Restore from backup
./infrastructure/scripts/restore.sh s3://neurmatic-backups/database/<latest-backup>

# 5. Verify data integrity
# Run data validation queries

# 6. Restart services
docker-compose -f docker-compose.production.yml up -d

# 7. Monitor for issues
```

### Emergency: Server Disk Full

```bash
# 1. Check disk usage
df -h

# 2. Find large files
du -sh /var/lib/docker/* | sort -h | tail -20

# 3. Clean up immediately
# Delete old Docker images
docker image prune -af

# Delete old logs
find /var/log -name "*.log" -mtime +7 -delete

# Delete old backups (keep last 7 days)
find /opt/neurmatic/backups -name "*.sql.gz" -mtime +7 -delete

# 4. Restart services if needed
docker-compose -f docker-compose.production.yml restart

# 5. Long-term: Increase disk size or implement log rotation
```

### Emergency: DDoS Attack

```bash
# 1. Identify attack pattern
docker-compose -f docker-compose.production.yml logs nginx | tail -1000 | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# 2. Block offending IPs in Nginx
docker-compose -f docker-compose.production.yml exec nginx sh -c "echo 'deny <IP_ADDRESS>;' >> /etc/nginx/conf.d/blocked.conf"
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload

# 3. Enable Cloudflare DDoS protection
# - Enable "I'm Under Attack" mode
# - Enable rate limiting rules

# 4. Increase rate limits temporarily
# Edit infrastructure/nginx/production.conf
# Reload Nginx

# 5. Monitor and adjust
# Watch for legitimate users being blocked

# 6. Contact hosting provider if overwhelmed
```

---

## Contacts

**On-Call Rotation:**
- **Primary:** Senior Backend Engineer
- **Secondary:** DevOps Engineer
- **Escalation:** CTO

**External Contacts:**
- **Hosting (OVH):** https://www.ovh.com/manager/
- **DNS (Cloudflare):** https://dash.cloudflare.com/
- **Monitoring (Sentry):** https://sentry.io/

**Communication Channels:**
- **Slack #incidents:** Critical incidents
- **Slack #deployments:** Deployment notifications
- **Slack #ops:** Daily operations

---

**Last Updated:** 2025-01-06
**Version:** 1.0
**Maintained by:** DevOps Team
