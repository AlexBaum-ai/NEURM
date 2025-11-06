# Error Handling and Monitoring Documentation

## Overview

This document describes the comprehensive error handling, monitoring, and alerting system implemented for the Neurmatic platform.

## Architecture

### Components

1. **Sentry Error Tracking** - Production error monitoring and performance tracking
2. **Winston Logging** - Structured logging with multiple transports
3. **Prisma Middleware** - Database query performance monitoring
4. **Performance Middleware** - API response time tracking
5. **Health Check System** - System health monitoring
6. **Alerting Service** - Automated alerts for critical issues
7. **Bull Board Dashboard** - Queue monitoring interface

---

## 1. Sentry Error Tracking

### Configuration

Located in: `/backend/src/instrument.ts`

**Features:**
- Error capture with context
- Performance monitoring with traces
- CPU profiling
- Filtering of 4xx errors (except 401, 403)

**Environment Variables:**
```env
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=development|production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

**Usage:**
```typescript
import * as Sentry from '@sentry/node';

// Capture exception
Sentry.captureException(error, {
  tags: { service: 'api', endpoint: '/users' },
  extra: { userId: 123 }
});

// Capture message
Sentry.captureMessage('Payment failed', {
  level: 'warning',
  tags: { service: 'payment' }
});

// Add breadcrumb
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info'
});
```

---

## 2. Winston Logging

### Configuration

Located in: `/backend/src/utils/logger.ts`

**Log Levels:**
- `error` (0) - Error messages
- `warn` (1) - Warning messages
- `info` (2) - Informational messages
- `debug` (3) - Debug messages

**Transports:**

**Development:**
- Console (colored output)
- File: `logs/error.log` (errors only)
- File: `logs/combined.log` (all logs)

**Production:**
- Console (JSON format)
- Daily Rotate: `logs/error-%DATE%.log` (30 days retention)
- Daily Rotate: `logs/combined-%DATE%.log` (14 days retention)
- Daily Rotate: `logs/performance-%DATE%.log` (7 days retention)

**Special Handlers:**
- Exception Handler: `logs/exceptions.log`
- Rejection Handler: `logs/rejections.log`

**Usage:**
```typescript
import logger, { logPerformance, logSecurity, logAudit } from '@/utils/logger';

// Basic logging
logger.info('User registered', { userId: 123 });
logger.warn('Cache miss', { key: 'user:123' });
logger.error('Database error', error);

// Performance logging
logPerformance('database-query', 150, { query: 'SELECT * FROM users' });

// Security logging
logSecurity('failed-login-attempt', userId, { ip: '127.0.0.1' });

// Audit logging
logAudit('user-deleted', adminId, 'user:123', { reason: 'spam' });
```

---

## 3. Database Query Monitoring

### Configuration

Located in: `/backend/src/middleware/prisma-logging.middleware.ts`

**Features:**
- Slow query detection and logging
- Query performance metrics
- Automatic Sentry reporting for very slow queries

**Thresholds:**
- Slow query: `SLOW_QUERY_THRESHOLD` (default: 100ms)
- Very slow query: `VERY_SLOW_QUERY_THRESHOLD` (default: 1000ms)

**Environment Variables:**
```env
SLOW_QUERY_THRESHOLD=100
VERY_SLOW_QUERY_THRESHOLD=1000
```

**Metrics:**
```typescript
import { getQueryMetrics, logQueryMetricsSummary } from '@/middleware/prisma-logging.middleware';

const metrics = getQueryMetrics();
// {
//   totalQueries: 1500,
//   slowQueries: 45,
//   verySlowQueries: 3,
//   totalDuration: 67500,
//   averageDuration: 45
// }

// Log summary
logQueryMetricsSummary();
```

---

## 4. API Performance Monitoring

### Configuration

Located in: `/backend/src/middleware/performance-monitoring.middleware.ts`

**Features:**
- Request/response time tracking
- Endpoint-level metrics
- Slow response detection
- Status code tracking
- Error rate monitoring

**Thresholds:**
- Slow response: `SLOW_RESPONSE_THRESHOLD` (default: 200ms)
- Very slow response: `VERY_SLOW_RESPONSE_THRESHOLD` (default: 1000ms)

**Environment Variables:**
```env
SLOW_RESPONSE_THRESHOLD=200
VERY_SLOW_RESPONSE_THRESHOLD=1000
```

**Metrics:**
```typescript
import {
  getRequestMetrics,
  getSlowestEndpoints,
  getEndpointsWithMostErrors
} from '@/middleware/performance-monitoring.middleware';

const metrics = getRequestMetrics();
// {
//   totalRequests: 10000,
//   successfulRequests: 9750,
//   failedRequests: 250,
//   averageResponseTime: 185,
//   slowResponses: 450,
//   statusCodes: { 200: 9750, 400: 150, 500: 100 },
//   endpoints: { ... }
// }

// Get slowest endpoints
const slowest = getSlowestEndpoints(5);

// Get endpoints with most errors
const errorEndpoints = getEndpointsWithMostErrors(5);
```

---

## 5. Health Check System

### Endpoints

#### GET /health
**Public endpoint** - Comprehensive health check

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-06T12:00:00.000Z",
    "uptime": 3600,
    "services": {
      "database": {
        "status": "up",
        "responseTime": 15,
        "message": "Database connection established"
      },
      "redis": {
        "status": "up",
        "responseTime": 5,
        "message": "Redis connection established"
      },
      "queues": {
        "status": "up",
        "queues": {
          "analytics": { "waiting": 5, "active": 2, "completed": 1000, "failed": 3 },
          "articleScheduler": { "waiting": 1, "active": 0, "completed": 500, "failed": 0 }
        }
      },
      "memory": {
        "status": "up",
        "usage": {
          "heapUsedMB": "125.50 MB",
          "heapTotalMB": "200.00 MB",
          "rssMB": "250.00 MB"
        },
        "percentage": 62
      }
    },
    "version": "1.0.0",
    "environment": "production"
  }
}
```

**Status Codes:**
- `200` - Healthy or degraded (still operational)
- `503` - Unhealthy (service unavailable)

#### GET /health/live
**Liveness probe** - For Kubernetes liveness checks

Response:
```json
{
  "success": true,
  "data": {
    "status": "alive",
    "timestamp": "2025-11-06T12:00:00.000Z"
  }
}
```

#### GET /health/ready
**Readiness probe** - For Kubernetes readiness checks

Response:
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "timestamp": "2025-11-06T12:00:00.000Z",
    "health": "healthy"
  }
}
```

**Status Codes:**
- `200` - Ready to accept traffic
- `503` - Not ready (still starting up or degraded)

#### GET /metrics (Admin Only)
System metrics endpoint

Response:
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-11-06T12:00:00.000Z",
    "uptime": 3600,
    "memory": { ... },
    "cpu": { "usage": 45.5 },
    "requests": { ... }
  }
}
```

#### GET /monitoring/status (Admin Only)
Detailed system status

Response:
```json
{
  "success": true,
  "data": {
    "health": { ... },
    "metrics": { ... }
  }
}
```

---

## 6. Alerting System

### Configuration

Located in: `/backend/src/services/alerting.service.ts`

**Alert Types:**
- `critical` - Immediate attention required
- `warning` - Should be investigated
- `info` - Informational only

**Alert Categories:**
- `performance` - API/DB performance issues
- `error` - High error rates
- `resource` - Memory/CPU issues
- `queue` - Job queue problems
- `database` - Database connectivity issues

**Default Thresholds:**
```typescript
{
  avgResponseTime: 200,        // 200ms average
  slowResponseRate: 10,        // 10% slow responses
  errorRate: 5,                // 5% error rate
  avgQueryTime: 100,           // 100ms average query time
  slowQueryRate: 10,           // 10% slow queries
  memoryUsagePercent: 90,      // 90% memory usage
  queueWaitingJobs: 500,       // 500 waiting jobs
  queueFailedJobs: 100         // 100 failed jobs
}
```

**Usage:**
```typescript
import {
  setAlertThresholds,
  getActiveAlerts,
  resolveAlert,
  checkAllSystems
} from '@/services/alerting.service';

// Set custom thresholds
setAlertThresholds({
  avgResponseTime: 300,
  errorRate: 10
});

// Get active alerts
const alerts = getActiveAlerts();

// Resolve an alert
resolveAlert('alert-id-123');

// Manual check
const healthCheck = await performHealthCheck();
const newAlerts = checkAllSystems(healthCheck);
```

**Scheduled Checks:**
- Runs every 5 minutes automatically
- Sends critical alerts to Sentry
- Logs all alerts to Winston

---

## 7. Bull Board Dashboard

### Configuration

Located in: `/backend/src/config/bull-board.config.ts`

**Access:**
- URL: `https://your-domain.com/admin/queues`
- Authentication: Admin users only
- Features:
  - View all queues
  - Monitor job status (waiting, active, completed, failed)
  - Retry failed jobs
  - View job details and logs
  - Pause/resume queues

**Queues Monitored:**
- Analytics Queue
- Article Scheduler Queue
- Email Queue
- Notification Queue

---

## 8. Graceful Degradation

The system is designed to continue operating even when non-critical services fail:

### Redis Failure
- **Impact**: Caching unavailable, sessions may fail
- **Degradation**: API continues without cache, slightly slower
- **Health Status**: `degraded`

### Queue Failure
- **Impact**: Background jobs won't process
- **Degradation**: API continues, jobs queued for later
- **Health Status**: `degraded`

### Database Failure
- **Impact**: No data access
- **Degradation**: System becomes unavailable
- **Health Status**: `unhealthy`

---

## 9. Environment Variables

Complete list of monitoring-related environment variables:

```env
# Sentry
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=development|production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Logging
NODE_ENV=development|production
LOG_LEVEL=error|warn|info|debug

# Performance Thresholds
SLOW_QUERY_THRESHOLD=100
VERY_SLOW_QUERY_THRESHOLD=1000
SLOW_RESPONSE_THRESHOLD=200
VERY_SLOW_RESPONSE_THRESHOLD=1000

# Worker Concurrency
WORKER_CONCURRENCY=5
```

---

## 10. Best Practices

### Error Handling

```typescript
// Always use try-catch with proper logging
try {
  const result = await someOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { operation: 'someOperation', error });
  Sentry.captureException(error, {
    tags: { service: 'api' }
  });
  throw error; // Re-throw if needed
}
```

### Performance Monitoring

```typescript
// Log slow operations
const startTime = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - startTime;

if (duration > 1000) {
  logger.warn('Slow operation detected', { operation: 'expensiveOperation', duration });
}

logPerformance('expensiveOperation', duration);
```

### Health Checks

```typescript
// Check health before critical operations
const health = await performHealthCheck();
if (health.status === 'unhealthy') {
  throw new Error('System unhealthy, cannot proceed');
}
```

---

## 11. Monitoring Dashboard

### Metrics Available

1. **API Performance**
   - Total requests
   - Success rate
   - Average response time
   - Slow response rate
   - Status code distribution
   - Slowest endpoints
   - Endpoints with most errors

2. **Database Performance**
   - Total queries
   - Average query time
   - Slow query rate
   - Very slow queries

3. **System Resources**
   - Memory usage
   - CPU usage
   - Uptime

4. **Queue Status**
   - Jobs by status (waiting, active, completed, failed)
   - Queue health
   - Processing rates

---

## 12. Alerting Workflow

1. **Alert Generated**
   - Threshold exceeded
   - System check detects issue
   - Alert created with context

2. **Alert Logged**
   - Winston logs alert
   - Sentry receives critical/warning alerts
   - Alert stored in memory

3. **Alert Resolution**
   - Manual resolution via API
   - Automatic resolution when threshold normalized
   - Alert moved to history

---

## 13. Production Checklist

Before deploying to production:

- [ ] Sentry DSN configured
- [ ] Log rotation enabled
- [ ] Thresholds tuned for your traffic
- [ ] Alert notifications configured
- [ ] Health check endpoints tested
- [ ] Bull Board accessible to admins
- [ ] Logs directory has write permissions
- [ ] Monitoring dashboard reviewed
- [ ] Alert workflow tested
- [ ] Graceful shutdown tested

---

## 14. Troubleshooting

### High Error Rate
1. Check `/metrics` endpoint for error patterns
2. Review `logs/error.log` for details
3. Check Sentry dashboard for grouped errors
4. Identify and fix root cause
5. Monitor error rate decrease

### Slow API Responses
1. Check slowest endpoints via `/metrics`
2. Review database slow queries
3. Check Redis connectivity
4. Optimize slow endpoints/queries
5. Monitor performance improvement

### Database Issues
1. Check `/health` endpoint for database status
2. Review `logs/error.log` for database errors
3. Check database slow query logs
4. Review Prisma query performance
5. Add indexes or optimize queries

### Memory Issues
1. Check `/health` endpoint for memory status
2. Review memory usage trends
3. Check for memory leaks
4. Restart service if critical
5. Investigate and fix memory leak

---

## 15. Further Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Bull Board Documentation](https://github.com/felixmosh/bull-board)
- [Prisma Middleware](https://www.prisma.io/docs/concepts/components/prisma-client/middleware)

---

**Last Updated:** 2025-11-06
**Task:** SPRINT-14-008
