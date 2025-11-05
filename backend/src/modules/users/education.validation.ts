import { z } from 'zod';

/**
 * Education Validation Schemas
 * Used for validating education API requests
 */

// Create education schema (POST /api/v1/users/me/education)
export const createEducationSchema = z.object({
  institution: z
    .string()
    .min(1, 'Institution name is required')
    .max(200, 'Institution name must be at most 200 characters'),
  degree: z
    .string()
    .max(200, 'Degree must be at most 200 characters')
    .optional()
    .nullable(),
  fieldOfStudy: z
    .string()
    .max(200, 'Field of study must be at most 200 characters')
    .optional()
    .nullable(),
  startDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'))
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  endDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'))
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  description: z
    .string()
    .max(5000, 'Description must be at most 5000 characters')
    .optional()
    .nullable(),
  displayOrder: z
    .number()
    .int()
    .min(0, 'Display order must be 0 or greater')
    .default(0)
    .optional(),
}).refine(
  (data) => {
    // Validate that end date is after start date if both are provided
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

// Update education schema (PUT /api/v1/users/me/education/:id)
export const updateEducationSchema = z.object({
  institution: z
    .string()
    .min(1, 'Institution name must not be empty')
    .max(200, 'Institution name must be at most 200 characters')
    .optional(),
  degree: z
    .string()
    .max(200, 'Degree must be at most 200 characters')
    .optional()
    .nullable(),
  fieldOfStudy: z
    .string()
    .max(200, 'Field of study must be at most 200 characters')
    .optional()
    .nullable(),
  startDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'))
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  endDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'))
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  description: z
    .string()
    .max(5000, 'Description must be at most 5000 characters')
    .optional()
    .nullable(),
  displayOrder: z
    .number()
    .int()
    .min(0, 'Display order must be 0 or greater')
    .optional(),
}).refine(
  (data) => {
    // At least one field must be provided
    return Object.keys(data).length > 0;
  },
  {
    message: 'At least one field must be provided for update',
  }
).refine(
  (data) => {
    // Validate date relationship if both are provided
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

// Education ID parameter validation
export const educationIdParamSchema = z.object({
  id: z
    .string()
    .uuid('Education ID must be a valid UUID'),
});

// Type exports for TypeScript
export type CreateEducationInput = z.infer<typeof createEducationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
export type EducationIdParam = z.infer<typeof educationIdParamSchema>;
