/**
 * Admin Dashboard Validation Schemas
 *
 * Zod schemas for validating admin dashboard requests
 */

import { z } from 'zod';

// Date range query schema
export const dateRangeQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).optional(),
});

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;

// Export format schema
export const exportFormatSchema = z.object({
  format: z.enum(['csv', 'pdf']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ExportFormatInput = z.infer<typeof exportFormatSchema>;

// Dashboard query schema
export const dashboardQuerySchema = z.object({
  refresh: z.enum(['true', 'false']).optional(), // Force refresh cache
  includeCharts: z.enum(['true', 'false']).optional(), // Include growth charts
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

// Metrics date range schema (for getting historical metrics)
export const metricsDateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  granularity: z.enum(['day', 'week', 'month']).optional().default('day'),
});

export type MetricsDateRange = z.infer<typeof metricsDateRangeSchema>;
