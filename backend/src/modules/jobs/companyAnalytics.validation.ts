import { z } from 'zod';

/**
 * Validation schemas for company analytics endpoints
 */

export const getAnalyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const exportAnalyticsQuerySchema = z.object({
  type: z.enum(['company', 'job']).default('company'),
  jobId: z.string().uuid().optional(),
});

export const companyIdParamSchema = z.object({
  companyId: z.string().uuid(),
});

export const jobAnalyticsParamSchema = z.object({
  companyId: z.string().uuid(),
  jobId: z.string().uuid(),
});
