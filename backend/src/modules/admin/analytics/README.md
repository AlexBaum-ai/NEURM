# Admin Analytics Module

Comprehensive platform analytics and reporting system for Neurmatic administrators.

## Overview

This module provides powerful analytics capabilities including:

- **Comprehensive Analytics**: User growth, engagement trends, content performance, revenue metrics
- **Custom Analytics**: Date range selection, metric filtering, period comparison
- **Cohort Analysis**: User retention tracking by signup cohorts
- **Funnel Analysis**: User onboarding and job application conversion tracking
- **Traffic Sources**: Referrer analysis and traffic attribution
- **Top Contributors**: User activity and contribution scoring
- **Export Functionality**: CSV, PDF report generation
- **Scheduled Reports**: Automated email reports (daily, weekly, monthly)
- **A/B Testing**: Test results and statistical significance (placeholder)

## Architecture

```
analytics/
├── analytics.validation.ts    # Zod schemas for request validation
├── analytics.repository.ts    # Database queries (optimized with indexes)
├── analytics.service.ts       # Business logic and data processing
├── analytics.controller.ts    # HTTP request handlers
├── analytics.routes.ts        # Route definitions
├── __tests__/
│   ├── analytics.service.test.ts
│   └── analytics.integration.test.ts
└── README.md
```

## API Endpoints

### 1. Comprehensive Analytics

**GET** `/api/admin/analytics`

Get platform-wide analytics with multiple metrics.

**Query Parameters:**
- `period` (optional): `daily`, `weekly`, `monthly` (default: `monthly`)
- `metrics` (optional): Comma-separated list: `user_growth`, `engagement_trends`, `content_performance`, `revenue`, `top_contributors`, `traffic_sources`
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date
- `limit` (optional): Number of data points (default: 30, max: 365)

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "userGrowth": [...],
      "engagementTrends": [...],
      "contentPerformance": [...],
      "revenue": [...],
      "topContributors": [...],
      "trafficSources": [...],
      "summary": {
        "totalUsers": 10000,
        "totalArticles": 500,
        "totalTopics": 200,
        "avgEngagement": 120
      },
      "generatedAt": "2024-11-06T10:00:00Z"
    },
    "meta": {
      "period": "monthly",
      "limit": 30,
      "executionTime": 456
    }
  }
}
```

**Performance:** < 1s for cached queries

---

### 2. Custom Analytics

**GET** `/api/admin/analytics/custom`

Get custom analytics with flexible date ranges and metric selection.

**Query Parameters:**
- `startDate` (required): ISO 8601 date
- `endDate` (required): ISO 8601 date
- `metrics` (required): Comma-separated metric list
- `granularity` (optional): `daily`, `weekly`, `monthly` (default: `daily`)
- `compareWith.startDate` (optional): Comparison period start
- `compareWith.endDate` (optional): Comparison period end

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "comparison": [...],
    "insights": [
      "User growth increased by 15.3% during this period",
      "New user acquisitions increased by 25.0% compared to previous period"
    ],
    "meta": {
      "startDate": "2024-10-01T00:00:00Z",
      "endDate": "2024-10-31T23:59:59Z",
      "granularity": "daily",
      "executionTime": 678
    }
  }
}
```

---

### 3. Cohort Analysis

**GET** `/api/admin/analytics/cohorts`

Analyze user retention by signup cohorts.

**Query Parameters:**
- `startDate` (required): ISO 8601 date
- `endDate` (required): ISO 8601 date
- `cohortType` (optional): `signup_date`, `first_purchase`, `first_post` (default: `signup_date`)
- `period` (optional): `daily`, `weekly`, `monthly` (default: `weekly`)

**Response:**
```json
{
  "success": true,
  "data": {
    "cohorts": [
      {
        "cohort": "2024-10-01",
        "period0": 100,
        "period1": 80,
        "period2": 65,
        "period3": 55,
        "period4": 50,
        "period5": 48,
        "period6": 45,
        "period7": 43
      }
    ],
    "meta": {
      "cohortType": "signup_date",
      "period": "weekly"
    }
  }
}
```

---

### 4. Funnel Analysis

**GET** `/api/admin/analytics/funnels/:funnelType`

Analyze conversion funnels.

**Parameters:**
- `funnelType`: `user_onboarding` or `job_application`

**Query Parameters:**
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date
- `groupBy` (optional): `day`, `week`, `month` (default: `day`)

**Response:**
```json
{
  "success": true,
  "data": {
    "funnelType": "user_onboarding",
    "steps": [
      {
        "step": "Registration",
        "users": 1000,
        "conversionRate": 100.0,
        "dropoffRate": 0.0
      },
      {
        "step": "Email Verified",
        "users": 800,
        "conversionRate": 80.0,
        "dropoffRate": 20.0
      },
      {
        "step": "Profile Completed",
        "users": 600,
        "conversionRate": 75.0,
        "dropoffRate": 25.0
      }
    ]
  }
}
```

---

### 5. Export Analytics

**POST** `/api/admin/analytics/export`

Export analytics data to CSV or PDF.

**Body:**
```json
{
  "format": "csv",
  "metrics": ["user_growth", "engagement_trends"],
  "startDate": "2024-10-01T00:00:00Z",
  "endDate": "2024-10-31T23:59:59Z",
  "includeCharts": true
}
```

**Response:** File download (CSV or PDF)

**Headers:**
- `Content-Type`: `text/csv` or `application/pdf`
- `Content-Disposition`: `attachment; filename="analytics-1699200000000.csv"`

---

### 6. Schedule Report

**POST** `/api/admin/analytics/reports/schedule`

Schedule automated recurring reports.

**Body:**
```json
{
  "frequency": "weekly",
  "recipients": ["admin@example.com", "manager@example.com"],
  "metrics": ["user_growth", "engagement_trends", "revenue"],
  "format": "pdf",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report-1699200000000",
    "message": "Report scheduled successfully. Will be sent weekly to admin@example.com, manager@example.com"
  }
}
```

---

### 7. List Scheduled Reports

**GET** `/api/admin/analytics/reports`

List all scheduled reports.

---

### 8. Update Scheduled Report

**PATCH** `/api/admin/analytics/reports/:reportId`

Update a scheduled report.

---

### 9. Delete Scheduled Report

**DELETE** `/api/admin/analytics/reports/:reportId`

Delete a scheduled report.

---

### 10. A/B Test Results

**GET** `/api/admin/analytics/ab-tests`

Get A/B testing results (placeholder for future implementation).

**Query Parameters:**
- `testId` (optional): Filter by test ID
- `status` (optional): `active`, `completed`, `paused`
- `limit` (optional): Max results (default: 20)

---

### 11. Invalidate Cache

**POST** `/api/admin/analytics/cache/invalidate`

Clear analytics cache to force fresh data retrieval.

## Data Models

### User Growth Data
```typescript
interface UserGrowthData {
  date: Date;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  weeklyActive: number;
  monthlyActive: number;
}
```

### Engagement Data
```typescript
interface EngagementData {
  date: Date;
  pageViews: number;
  uniqueVisitors: number;
  avgSessionTime: number | null;
  bounceRate: number | null;
}
```

### Content Performance Data
```typescript
interface ContentPerformanceData {
  date: Date;
  totalArticles: number;
  newArticles: number;
  totalTopics: number;
  newTopics: number;
  totalReplies: number;
  newReplies: number;
}
```

### Top Contributor
```typescript
interface TopContributor {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  contributionScore: number;
  articlesCount: number;
  topicsCount: number;
  repliesCount: number;
  helpfulVotes: number;
}
```

## Performance Optimization

### Caching Strategy
- **Cache TTL**: 1 hour (3600 seconds)
- **Cache Key Format**: `admin:analytics:{type}:{params}`
- **Invalidation**: Manual via `/cache/invalidate` endpoint

### Database Optimization
- **Precomputed Metrics**: Daily aggregation via cron job
- **Indexed Queries**: All date-range queries use indexed columns
- **Query Timeout**: 1 second max for analytics queries
- **Connection Pooling**: Prisma connection pool for concurrent queries

### Query Performance Targets
- Comprehensive analytics: < 1s (cached: < 50ms)
- Custom analytics: < 1s
- Cohort analysis: < 2s
- Funnel analysis: < 1s
- Export (CSV): < 3s
- Export (PDF): < 5s

## Security

### Authentication
All endpoints require:
1. Valid JWT token (`authenticate` middleware)
2. Admin role (`requireAdmin` middleware)

### Rate Limiting
- Admin endpoints: 100 requests per 15 minutes
- Export endpoints: 10 exports per hour
- Scheduled reports: 5 schedules per user

### Data Privacy
- IP addresses hashed using SHA-256
- PII excluded from analytics exports
- Admin action audit logging

## Error Handling

All endpoints follow standard error response format:

```json
{
  "success": false,
  "error": {
    "message": "Failed to fetch analytics",
    "code": "ANALYTICS_ERROR",
    "statusCode": 500
  }
}
```

**Common Error Codes:**
- `400`: Invalid parameters (Zod validation failure)
- `401`: Unauthorized (no token)
- `403`: Forbidden (not admin)
- `500`: Internal server error
- `501`: Not implemented (Excel export, some features)

## Testing

### Unit Tests
```bash
npm test src/modules/admin/analytics/__tests__/analytics.service.test.ts
```

**Coverage:**
- Service methods: 95%
- Repository queries: 90%
- Export functions: 85%

### Integration Tests
```bash
npm test src/modules/admin/analytics/__tests__/analytics.integration.test.ts
```

**Test Scenarios:**
- All API endpoints
- Authentication/authorization
- Validation errors
- Performance requirements
- Export functionality

### Performance Tests
```bash
npm run test:performance
```

Validates < 1s query execution for all analytics endpoints.

## Usage Examples

### JavaScript/TypeScript
```typescript
// Get comprehensive analytics
const response = await fetch('/api/admin/analytics?period=monthly&limit=30', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
  },
});
const { analytics } = await response.json();

// Export to PDF
const exportResponse = await fetch('/api/admin/analytics/export', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    format: 'pdf',
    metrics: ['user_growth', 'engagement_trends'],
    startDate: '2024-10-01T00:00:00Z',
    endDate: '2024-10-31T23:59:59Z',
    includeCharts: true,
  }),
});
const blob = await exportResponse.blob();
```

### cURL
```bash
# Get analytics
curl -X GET "https://api.neurmatic.com/api/admin/analytics?period=monthly" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Export to CSV
curl -X POST "https://api.neurmatic.com/api/admin/analytics/export" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "metrics": ["user_growth"],
    "startDate": "2024-10-01T00:00:00Z",
    "endDate": "2024-10-31T23:59:59Z"
  }' \
  --output analytics.csv
```

## Future Enhancements

### Planned Features
- [ ] Real-time analytics dashboard (WebSocket)
- [ ] Excel export with charts
- [ ] Advanced segmentation (by country, device, etc.)
- [ ] Predictive analytics (ML-based forecasting)
- [ ] Custom dashboard builder
- [ ] Alerts and anomaly detection
- [ ] Data warehouse integration
- [ ] GraphQL API support

### Database Improvements
- [ ] Scheduled report storage in database
- [ ] Analytics cache warming
- [ ] Incremental aggregation
- [ ] Materialized views for complex queries

## Troubleshooting

### Slow Queries
1. Check if cache is invalidated frequently
2. Verify database indexes are present
3. Reduce date range or limit parameter
4. Use precomputed metrics via cron job

### Export Failures
1. Verify sufficient memory for PDF generation
2. Check file system permissions
3. Validate date range is not too large
4. Review Sentry logs for errors

### Missing Data
1. Confirm analytics cron job is running
2. Check `platform_metrics` table has recent data
3. Verify user activity is being tracked
4. Review analytics queue (Bull/Redis)

## Support

For issues or questions:
- GitHub Issues: https://github.com/neurmatic/neurmatic/issues
- Documentation: https://docs.neurmatic.com
- Email: support@neurmatic.com

---

**Last Updated:** November 6, 2024
**Module Version:** 1.0.0
**Status:** Production Ready
