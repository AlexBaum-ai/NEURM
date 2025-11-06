/**
 * Dashboard Validation Schemas
 *
 * Zod schemas for validating dashboard requests
 */

import { z } from 'zod';

export const widgetTypeSchema = z.enum([
  'top_stories_today',
  'trending_discussions',
  'job_matches',
  'your_stats',
  'following_activity',
  'trending_tags',
]);

export const widgetConfigSchema = z.object({
  id: widgetTypeSchema,
  enabled: z.boolean(),
  order: z.number().int().min(0),
});

export const getDashboardQuerySchema = z.object({
  widgets: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val.split(',').map((w) => w.trim());
    })
    .pipe(z.array(widgetTypeSchema).optional()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(50).optional()),
});

export const updateDashboardConfigSchema = z.object({
  widgets: z.array(widgetConfigSchema).min(1).max(10),
});

export type GetDashboardQuery = z.infer<typeof getDashboardQuerySchema>;
export type UpdateDashboardConfigInput = z.infer<typeof updateDashboardConfigSchema>;
