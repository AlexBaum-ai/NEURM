import { z } from 'zod';
import { EmploymentType } from '@prisma/client';

/**
 * Work Experience Validation Schemas
 * Used for validating work experience API requests
 */

// Schema for creating work experience
export const createWorkExperienceSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be at most 200 characters'),
    company: z
      .string()
      .min(1, 'Company is required')
      .max(200, 'Company must be at most 200 characters'),
    location: z
      .string()
      .max(100, 'Location must be at most 100 characters')
      .optional()
      .nullable(),
    employmentType: z
      .nativeEnum(EmploymentType)
      .optional()
      .nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    description: z
      .string()
      .max(5000, 'Description must be at most 5000 characters')
      .optional()
      .nullable(),
    techStack: z
      .array(z.string())
      .max(50, 'Tech stack can contain at most 50 items')
      .optional()
      .nullable(),
    displayOrder: z
      .number()
      .int()
      .min(0, 'Display order must be 0 or greater')
      .default(0)
      .optional(),
  })
  .refine(
    (data) => {
      // If endDate is provided, it must be after startDate
      if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['endDate'],
    }
  );

// Schema for updating work experience (all fields optional)
export const updateWorkExperienceSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title must not be empty')
      .max(200, 'Title must be at most 200 characters')
      .optional(),
    company: z
      .string()
      .min(1, 'Company must not be empty')
      .max(200, 'Company must be at most 200 characters')
      .optional(),
    location: z
      .string()
      .max(100, 'Location must be at most 100 characters')
      .optional()
      .nullable(),
    employmentType: z
      .nativeEnum(EmploymentType)
      .optional()
      .nullable(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional().nullable(),
    description: z
      .string()
      .max(5000, 'Description must be at most 5000 characters')
      .optional()
      .nullable(),
    techStack: z
      .array(z.string())
      .max(50, 'Tech stack can contain at most 50 items')
      .optional()
      .nullable(),
    displayOrder: z
      .number()
      .int()
      .min(0, 'Display order must be 0 or greater')
      .optional(),
  })
  .refine(
    (data) => {
      // Ensure at least one field is provided
      return Object.keys(data).length > 0;
    },
    {
      message: 'At least one field must be provided for update',
    }
  )
  .refine(
    (data) => {
      // If both dates are provided, endDate must be after startDate
      if (data.endDate !== undefined && data.startDate) {
        if (data.endDate === null) return true; // Current role
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['endDate'],
    }
  );

// ID parameter validation
export const workExperienceIdParamSchema = z.object({
  id: z.string().uuid('Invalid work experience ID format'),
});

// Type exports for TypeScript
export type CreateWorkExperienceInput = z.infer<typeof createWorkExperienceSchema>;
export type UpdateWorkExperienceInput = z.infer<typeof updateWorkExperienceSchema>;
export type WorkExperienceIdParam = z.infer<typeof workExperienceIdParamSchema>;
