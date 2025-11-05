import { z } from 'zod';

/**
 * Report validation schemas
 *
 * Validators for content reporting functionality:
 * - Create report
 * - List reports (moderation queue)
 * - Resolve report
 */

// Report reasons enum
export const reportReasons = [
  'spam',
  'harassment',
  'off_topic',
  'misinformation',
  'copyright',
] as const;

// Report status enum
export const reportStatuses = [
  'pending',
  'reviewing',
  'resolved_violation',
  'resolved_no_action',
  'dismissed',
] as const;

// Reportable entity types
export const reportableTypes = ['Topic', 'Reply'] as const;

/**
 * Create report schema
 * POST /api/forum/reports
 */
export const createReportSchema = z.object({
  reportableType: z.enum(reportableTypes, {
    errorMap: () => ({ message: 'Invalid reportable type. Must be Topic or Reply' }),
  }),
  reportableId: z.string().uuid('Invalid reportable ID'),
  reason: z.enum(reportReasons, {
    errorMap: () => ({
      message: 'Invalid report reason. Must be: spam, harassment, off_topic, misinformation, or copyright',
    }),
  }),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * List reports query schema
 * GET /api/forum/reports
 */
export const listReportsQuerySchema = z.object({
  status: z.enum(reportStatuses).optional(),
  reason: z.enum(reportReasons).optional(),
  reportableType: z.enum(reportableTypes).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'status', 'reason']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

/**
 * Resolve report schema
 * PUT /api/forum/reports/:id/resolve
 */
export const resolveReportSchema = z.object({
  status: z.enum(['resolved_violation', 'resolved_no_action', 'dismissed'], {
    errorMap: () => ({
      message: 'Invalid resolution status. Must be: resolved_violation, resolved_no_action, or dismissed',
    }),
  }),
  resolutionNote: z
    .string()
    .min(5, 'Resolution note must be at least 5 characters')
    .max(500, 'Resolution note must be less than 500 characters')
    .optional(),
});

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;

/**
 * Report ID param schema
 */
export const reportIdParamSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
});

export type ReportIdParam = z.infer<typeof reportIdParamSchema>;
