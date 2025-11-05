import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

/**
 * Validation schemas for ATS endpoints
 */

// Get company applications with filters
export const getCompanyApplicationsSchema = z.object({
  query: z.object({
    jobId: z.string().uuid().optional(),
    status: z.nativeEnum(ApplicationStatus).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    minMatchScore: z
      .string()
      .transform((val) => parseFloat(val))
      .pipe(z.number().min(0).max(100))
      .optional(),
    maxMatchScore: z
      .string()
      .transform((val) => parseFloat(val))
      .pipe(z.number().min(0).max(100))
      .optional(),
    minRating: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(5))
      .optional(),
    maxRating: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(5))
      .optional(),
    sortBy: z
      .enum(['date_applied', 'match_score', 'rating'])
      .optional()
      .default('date_applied'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().positive())
      .optional()
      .default('1'),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().positive().max(100))
      .optional()
      .default('20'),
  }),
});

// Get application detail
export const getApplicationDetailSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Invalid application ID',
    }),
  }),
});

// Update application status
export const updateApplicationStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Invalid application ID',
    }),
  }),
  body: z.object({
    status: z.nativeEnum(ApplicationStatus, {
      errorMap: () => ({
        message:
          'Invalid status. Must be one of: submitted, viewed, screening, interview, offer, rejected, withdrawn',
      }),
    }),
    notes: z.string().max(2000).optional(),
  }),
});

// Add note to application
export const addNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Invalid application ID',
    }),
  }),
  body: z.object({
    note: z
      .string()
      .min(1, 'Note cannot be empty')
      .max(5000, 'Note is too long (max 5000 characters)'),
    isInternal: z.boolean().optional().default(true),
  }),
});

// Rate application
export const rateApplicationSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Invalid application ID',
    }),
  }),
  body: z.object({
    rating: z
      .number()
      .int('Rating must be a whole number')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5'),
  }),
});

// Share application
export const shareApplicationSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Invalid application ID',
    }),
  }),
  body: z.object({
    sharedWith: z.string().uuid({
      message: 'Invalid user ID',
    }),
    message: z.string().max(500).optional(),
  }),
});

// Get application activity
export const getApplicationActivitySchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Invalid application ID',
    }),
  }),
});

// Bulk update status
export const bulkUpdateStatusSchema = z.object({
  body: z.object({
    applicationIds: z
      .array(z.string().uuid())
      .min(1, 'At least one application ID is required')
      .max(100, 'Cannot update more than 100 applications at once'),
    status: z.nativeEnum(ApplicationStatus, {
      errorMap: () => ({
        message:
          'Invalid status. Must be one of: submitted, viewed, screening, interview, offer, rejected, withdrawn',
      }),
    }),
  }),
});

// Bulk archive
export const bulkArchiveSchema = z.object({
  body: z.object({
    applicationIds: z
      .array(z.string().uuid())
      .min(1, 'At least one application ID is required')
      .max(100, 'Cannot archive more than 100 applications at once'),
  }),
});
