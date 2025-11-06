# Monitoring & Error Handling - Quick Start Guide

## Overview

This guide provides a quick start for using the comprehensive monitoring and error handling system implemented in SPRINT-14-008.

---

## 🚀 Quick Start

### 1. Health Check

Check system health:
```bash
curl http://localhost:3000/health
```

### 2. View Metrics (Admin)

Get system metrics:
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:3000/metrics
```

### 3. Monitor Queues (Admin)

Open Bull Board dashboard in browser:
```
http://localhost:3000/admin/queues
```
(Requires admin authentication)

---

## 📊 Available Endpoints

### Public Endpoints

| Endpoint | Purpose | Response Code |
|----------|---------|---------------|
| `GET /health` | Comprehensive health check | 200 (healthy/degraded), 503 (unhealthy) |
| `GET /health/live` | Liveness probe (Kubernetes) | 200 (alive) |
| `GET /health/ready` | Readiness probe (Kubernetes) | 200 (ready), 503 (not ready) |

### Admin Endpoints

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `GET /metrics` | System metrics | Admin |
| `GET /monitoring/status` | Detailed system status | Admin |
| `GET /admin/queues` | Bull Board dashboard | Admin |

---

## 🔍 Monitoring Features

### Health Checks

Monitors:
- ✅ Database connectivity (PostgreSQL)
- ✅ Redis connectivity
- ✅ Queue status (waiting, active, failed jobs)
- ✅ Memory usage

### Performance Monitoring

Tracks:
- ⏱️ API response times (per endpoint)
- 📊 Request success/failure rates
- 🐌 Slow API responses (>200ms warning, >1000ms error)
- 📈 Endpoint-level metrics (avg, min, max)

### Database Monitoring

Monitors:
- 🗄️ Query execution times
- 🐢 Slow queries (>100ms warning, >1000ms error)
- 📉 Query performance metrics
- 🔥 Very slow queries auto-reported to Sentry

### Error Tracking (Sentry)

Captures:
- ❌ All errors with context
- 🏷️ Tagged by service/module
- 📍 Stack traces and breadcrumbs
- 📊 Performance traces

---

## 📝 Logging

### Log Files (Production)

| File | Content | Retention |
|------|---------|-----------|
| `logs/error-YYYY-MM-DD.log` | Errors only | 30 days |
| `logs/combined-YYYY-MM-DD.log` | All logs | 14 days |
| `logs/performance-YYYY-MM-DD.log` | Performance logs | 7 days |
| `logs/exceptions.log` | Uncaught exceptions | Manual cleanup |
| `logs/rejections.log` | Unhandled rejections | Manual cleanup |

### Log Levels

- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages (default)
- `debug` - Debug messages

Set via `LOG_LEVEL` environment variable.

---

## 🚨 Alerting

### Alert Types

- **Critical** - Immediate attention required (database down, high memory)
- **Warning** - Should be investigated (slow responses, high error rate)
- **Info** - Informational only

### Default Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Avg API Response Time | 200ms | - |
| Slow Response Rate | 10% | - |
| Error Rate | 5% | 20% |
| Avg Query Time | 100ms | - |
| Slow Query Rate | 10% | - |
| Memory Usage | 90% | 95% |
| Queue Waiting Jobs | 500 | - |
| Queue Failed Jobs | 100 | - |

### Customize Thresholds

```typescript
import { setAlertThresholds } from '@/services/alerting.service';

setAlertThresholds({
  avgResponseTime: 300,
  errorRate: 10,
  memoryUsagePercent: 85
});
```

---

## 🔧 Configuration

### Environment Variables

```env
# Sentry
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Logging
LOG_LEVEL=info
NODE_ENV=production

# Performance Thresholds
SLOW_QUERY_THRESHOLD=100
VERY_SLOW_QUERY_THRESHOLD=1000
SLOW_RESPONSE_THRESHOLD=200
VERY_SLOW_RESPONSE_THRESHOLD=1000

# Worker Concurrency
WORKER_CONCURRENCY=5
```

---

## 📈 Usage Examples

### Check Health in Code

```typescript
import { performHealthCheck } from '@/services/monitoring.service';

const health = await performHealthCheck();
if (health.status === 'unhealthy') {
  console.error('System is unhealthy!');
}
```

### Log Performance

```typescript
import { logPerformance } from '@/utils/logger';

const startTime = Date.now();
await expensiveOperation();
logPerformance('expensive-operation', Date.now() - startTime);
```

### Get Metrics

```typescript
import { getRequestMetrics } from '@/middleware/performance-monitoring.middleware';
import { getQueryMetrics } from '@/middleware/prisma-logging.middleware';

const apiMetrics = getRequestMetrics();
const dbMetrics = getQueryMetrics();
```

### Check Alerts

```typescript
import { getActiveAlerts } from '@/services/alerting.service';

const alerts = getActiveAlerts();
console.log(`Active alerts: ${alerts.length}`);
```

---

## 🛠️ Troubleshooting

### High Error Rate

1. Check metrics: `GET /metrics`
2. Review error logs: `logs/error-*.log`
3. Check Sentry dashboard
4. Identify error patterns
5. Fix and monitor

### Slow API Responses

1. Check slowest endpoints: `getRequestMetrics()`
2. Review slow queries: `getQueryMetrics()`
3. Check database indexes
4. Optimize code
5. Monitor improvement

### Memory Issues

1. Check health: `GET /health`
2. Review memory trends
3. Check for memory leaks
4. Consider scaling
5. Restart if critical

---

## ✅ Verification

Run the verification script:

```bash
cd backend
./scripts/verify-monitoring.sh
```

Expected output:
```
✓ Monitoring service
✓ Alerting service
✓ Database logging middleware
✓ Performance monitoring middleware
✓ Sentry integration (158 files)
✓ All dependencies installed

All monitoring components verified successfully!
```

---

## 📚 Further Reading

- [Complete Documentation](./MONITORING_AND_ERROR_HANDLING.md)
- [Sentry Docs](https://docs.sentry.io/platforms/node/)
- [Winston Docs](https://github.com/winstonjs/winston)
- [Bull Board Docs](https://github.com/felixmosh/bull-board)

---

## 🎯 Key Features Summary

✅ **Health Checks** - Comprehensive system health monitoring
✅ **Performance Tracking** - API and database performance metrics
✅ **Error Tracking** - Sentry integration across 158 files
✅ **Logging** - Structured logging with rotation
✅ **Alerting** - Automated alerts for critical issues
✅ **Queue Monitoring** - Bull Board dashboard
✅ **Graceful Degradation** - System continues on non-critical failures

---

**Task:** SPRINT-14-008
**Status:** ✅ Completed
**Date:** 2025-11-06
