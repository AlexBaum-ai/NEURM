import { z } from 'zod';

/**
 * Validation schemas for job alerts operations
 */

// Alert criteria schema
export const alertCriteriaSchema = z.object({
  keywords: z.array(z.string()).default([]),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  jobTypes: z.array(z.enum(['full_time', 'part_time', 'contract', 'freelance'])).optional(),
  experienceLevels: z.array(z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'principal'])).optional(),
  models: z.array(z.string()).optional(),
  salaryMin: z.number().nonnegative().optional(),
  salaryCurrency: z.string().max(10).optional(),
});

// Create job alert schema
export const createJobAlertSchema = z.object({
  name: z.string().min(1).max(100),
  criteria: alertCriteriaSchema,
});

// Update job alert schema
export const updateJobAlertSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  criteria: alertCriteriaSchema.optional(),
  active: z.boolean().optional(),
});

// List job alerts query schema
export const listJobAlertsQuerySchema = z.object({
  active: z.coerce.boolean().optional(),
});

// Alert ID param schema
export const alertIdParamSchema = z.object({
  id: z.string().uuid(),
});

// Track alert click schema
export const trackAlertClickSchema = z.object({
  alertId: z.string().uuid(),
  jobId: z.string().uuid(),
});

// Types
export type AlertCriteria = z.infer<typeof alertCriteriaSchema>;
export type CreateJobAlertInput = z.infer<typeof createJobAlertSchema>;
export type UpdateJobAlertInput = z.infer<typeof updateJobAlertSchema>;
export type ListJobAlertsQuery = z.infer<typeof listJobAlertsQuerySchema>;
export type AlertIdParam = z.infer<typeof alertIdParamSchema>;
export type TrackAlertClickInput = z.infer<typeof trackAlertClickSchema>;
