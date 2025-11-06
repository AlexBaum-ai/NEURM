import { z } from 'zod';

/**
 * Content Moderation Validators
 *
 * Validation schemas for unified content moderation across all content types:
 * - Articles, Topics, Replies, Jobs
 */

// Content types that can be moderated
export const contentTypes = ['article', 'topic', 'reply', 'job'] as const;
export type ContentType = (typeof contentTypes)[number];

// Content status enum
export const contentStatuses = [
  'pending',
  'approved',
  'rejected',
  'hidden',
  'deleted',
] as const;
export type ContentStatus = (typeof contentStatuses)[number];

// Report reasons
export const reportReasons = [
  'spam',
  'harassment',
  'off_topic',
  'misinformation',
  'copyright',
  'inappropriate',
  'scam',
  'other',
] as const;

/**
 * List content query schema
 * GET /api/admin/content
 */
export const listContentQuerySchema = z.object({
  type: z.enum(contentTypes).optional(),
  status: z.enum(contentStatuses).optional(),
  reported: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  flaggedBySystem: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  minSpamScore: z.coerce.number().min(0).max(100).optional(),
  authorId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'spamScore', 'reportCount'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListContentQuery = z.infer<typeof listContentQuerySchema>;

/**
 * List reported content query schema
 * GET /api/admin/content/reported
 */
export const listReportedContentQuerySchema = z.object({
  type: z.enum(contentTypes).optional(),
  reason: z.enum(reportReasons).optional(),
  minReportCount: z.coerce.number().int().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['reportCount', 'createdAt', 'spamScore']).default('reportCount'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListReportedContentQuery = z.infer<typeof listReportedContentQuerySchema>;

/**
 * Content params schema
 */
export const contentParamsSchema = z.object({
  type: z.enum(contentTypes, {
    errorMap: () => ({ message: 'Invalid content type. Must be: article, topic, reply, or job' }),
  }),
  id: z.string().uuid('Invalid content ID'),
});

export type ContentParams = z.infer<typeof contentParamsSchema>;

/**
 * Approve content schema
 * PUT /api/admin/content/:type/:id/approve
 */
export const approveContentSchema = z.object({
  note: z
    .string()
    .min(5, 'Note must be at least 5 characters')
    .max(500, 'Note must be less than 500 characters')
    .optional(),
});

export type ApproveContentInput = z.infer<typeof approveContentSchema>;

/**
 * Reject content schema
 * PUT /api/admin/content/:type/:id/reject
 */
export const rejectContentSchema = z.object({
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(1000, 'Rejection reason must be less than 1000 characters'),
  notifyAuthor: z.boolean().default(true),
});

export type RejectContentInput = z.infer<typeof rejectContentSchema>;

/**
 * Hide content schema
 * PUT /api/admin/content/:type/:id/hide
 */
export const hideContentSchema = z.object({
  reason: z
    .string()
    .min(10, 'Hide reason must be at least 10 characters')
    .max(1000, 'Hide reason must be less than 1000 characters'),
  notifyAuthor: z.boolean().default(true),
});

export type HideContentInput = z.infer<typeof hideContentSchema>;

/**
 * Delete content schema
 * DELETE /api/admin/content/:type/:id
 */
export const deleteContentSchema = z.object({
  reason: z
    .string()
    .min(10, 'Deletion reason must be at least 10 characters')
    .max(1000, 'Deletion reason must be less than 1000 characters'),
  hardDelete: z.boolean().default(false),
});

export type DeleteContentInput = z.infer<typeof deleteContentSchema>;

/**
 * Bulk action schema
 * POST /api/admin/content/bulk
 */
export const bulkActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'hide', 'delete'], {
    errorMap: () => ({ message: 'Invalid action. Must be: approve, reject, hide, or delete' }),
  }),
  items: z
    .array(
      z.object({
        type: z.enum(contentTypes),
        id: z.string().uuid(),
      })
    )
    .min(1, 'At least one item must be provided')
    .max(100, 'Cannot process more than 100 items at once'),
  reason: z.string().min(10).max(1000).optional(),
  notifyAuthors: z.boolean().default(true),
});

export type BulkActionInput = z.infer<typeof bulkActionSchema>;

/**
 * Spam detection schema
 */
export const spamDetectionConfigSchema = z.object({
  threshold: z.number().min(0).max(100).default(75),
  autoFlag: z.boolean().default(true),
  autoHide: z.boolean().default(false),
});

export type SpamDetectionConfig = z.infer<typeof spamDetectionConfigSchema>;
