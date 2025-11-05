import { z } from 'zod';

/**
 * Validation schemas for article revision endpoints
 */

// Query parameters for listing revisions
export const listRevisionsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 50, {
      message: 'Limit must be between 1 and 50',
    }),
  offset: z
    .string()
    .optional()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 0, {
      message: 'Offset must be non-negative',
    }),
});

export type ListRevisionsQuery = z.infer<typeof listRevisionsQuerySchema>;

// Path parameter for article ID
export const articleIdParamSchema = z.object({
  id: z.string().uuid({
    message: 'Article ID must be a valid UUID',
  }),
});

export type ArticleIdParam = z.infer<typeof articleIdParamSchema>;

// Path parameter for revision ID
export const revisionIdParamSchema = z.object({
  revisionId: z.string().uuid({
    message: 'Revision ID must be a valid UUID',
  }),
});

export type RevisionIdParam = z.infer<typeof revisionIdParamSchema>;

// Path parameters for comparison endpoint
export const compareRevisionsParamsSchema = z.object({
  id: z.string().uuid({
    message: 'Article ID must be a valid UUID',
  }),
  fromRevision: z
    .string()
    .regex(/^\d+$/, { message: 'From revision must be a number' })
    .transform((val) => parseInt(val, 10)),
  toRevision: z
    .string()
    .regex(/^\d+$/, { message: 'To revision must be a number' })
    .transform((val) => parseInt(val, 10)),
});

export type CompareRevisionsParams = z.infer<typeof compareRevisionsParamsSchema>;

// Body for restore revision endpoint
export const restoreRevisionBodySchema = z.object({
  changeSummary: z
    .string()
    .max(500, 'Change summary must not exceed 500 characters')
    .optional(),
});

export type RestoreRevisionBody = z.infer<typeof restoreRevisionBodySchema>;
