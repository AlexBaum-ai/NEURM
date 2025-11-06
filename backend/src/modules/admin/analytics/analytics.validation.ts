/**
 * Analytics Validation Schemas
 *
 * Zod schemas for analytics endpoints
 */

import { z } from 'zod';

/**
 * Time period enum
 */
export const timePeriodEnum = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

/**
 * Metric type enum
 */
export const metricTypeEnum = z.enum([
  'user_growth',
  'engagement_trends',
  'content_performance',
  'revenue',
  'top_contributors',
  'traffic_sources',
  'retention',
  'funnel_conversion',
]);

/**
 * Export format enum
 */
export const exportFormatEnum = z.enum(['csv', 'excel', 'pdf']);

/**
 * Analytics query schema
 * GET /api/admin/analytics?period=monthly&metrics=user_growth,engagement_trends
 */
export const analyticsQuerySchema = z.object({
  period: timePeriodEnum.optional().default('monthly'),
  metrics: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : undefined))
    .pipe(z.array(metricTypeEnum).optional()),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

/**
 * Custom analytics schema
 * GET /api/admin/analytics/custom
 */
export const customAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metrics: z
    .string()
    .transform((val) => val.split(','))
    .pipe(z.array(metricTypeEnum)),
  granularity: timePeriodEnum.optional().default('daily'),
  compareWith: z
    .object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    })
    .optional(),
});

export type CustomAnalyticsQuery = z.infer<typeof customAnalyticsQuerySchema>;

/**
 * Cohort analysis schema
 * GET /api/admin/analytics/cohorts
 */
export const cohortAnalysisQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  cohortType: z.enum(['signup_date', 'first_purchase', 'first_post']).default('signup_date'),
  period: timePeriodEnum.default('weekly'),
});

export type CohortAnalysisQuery = z.infer<typeof cohortAnalysisQuerySchema>;

/**
 * Funnel analysis schema
 * GET /api/admin/analytics/funnels/:funnelType
 */
export const funnelAnalysisQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

export type FunnelAnalysisQuery = z.infer<typeof funnelAnalysisQuerySchema>;

/**
 * Export analytics schema
 * POST /api/admin/analytics/export
 */
export const exportAnalyticsSchema = z.object({
  format: exportFormatEnum,
  metrics: z.array(metricTypeEnum),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeCharts: z.boolean().optional().default(true),
});

export type ExportAnalyticsInput = z.infer<typeof exportAnalyticsSchema>;

/**
 * Scheduled report schema
 * POST /api/admin/analytics/reports/schedule
 */
export const scheduleReportSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  recipients: z.array(z.string().email()),
  metrics: z.array(metricTypeEnum),
  format: exportFormatEnum,
  enabled: z.boolean().optional().default(true),
});

export type ScheduleReportInput = z.infer<typeof scheduleReportSchema>;

/**
 * Update scheduled report schema
 * PATCH /api/admin/analytics/reports/:reportId
 */
export const updateScheduledReportSchema = scheduleReportSchema.partial();

export type UpdateScheduledReportInput = z.infer<typeof updateScheduledReportSchema>;

/**
 * A/B test results schema (placeholder)
 * GET /api/admin/analytics/ab-tests
 */
export const abTestQuerySchema = z.object({
  testId: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ABTestQuery = z.infer<typeof abTestQuerySchema>;
