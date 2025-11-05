import { z } from 'zod';

/**
 * Validation schemas for portfolio project endpoints
 */

/**
 * Create Portfolio Project Input Schema
 */
export const createPortfolioProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must not exceed 2000 characters')
    .trim()
    .optional()
    .nullable(),
  techStack: z
    .array(z.string().trim().min(1, 'Tech stack item cannot be empty'))
    .max(20, 'Maximum 20 technologies allowed')
    .optional()
    .nullable(),
  projectUrl: z
    .string()
    .url('Project URL must be a valid URL')
    .max(500, 'Project URL must not exceed 500 characters')
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),
  githubUrl: z
    .string()
    .url('GitHub URL must be a valid URL')
    .regex(/github\.com/, 'GitHub URL must be from github.com')
    .max(500, 'GitHub URL must not exceed 500 characters')
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),
  demoUrl: z
    .string()
    .url('Demo URL must be a valid URL')
    .max(500, 'Demo URL must not exceed 500 characters')
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),
  thumbnailUrl: z
    .string()
    .url('Thumbnail URL must be a valid URL')
    .max(500, 'Thumbnail URL must not exceed 500 characters')
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),
  screenshots: z
    .array(
      z
        .string()
        .url('Screenshot URL must be a valid URL')
        .max(500, 'Screenshot URL must not exceed 500 characters')
    )
    .max(10, 'Maximum 10 screenshots allowed')
    .optional()
    .nullable(),
  isFeatured: z.boolean().optional().default(false),
  displayOrder: z
    .number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be non-negative')
    .optional()
    .default(0),
});

/**
 * Update Portfolio Project Input Schema
 * All fields are optional for partial updates
 */
export const updatePortfolioProjectSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must not exceed 200 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(2000, 'Description must not exceed 2000 characters')
      .trim()
      .optional()
      .nullable(),
    techStack: z
      .array(z.string().trim().min(1, 'Tech stack item cannot be empty'))
      .max(20, 'Maximum 20 technologies allowed')
      .optional()
      .nullable(),
    projectUrl: z
      .string()
      .url('Project URL must be a valid URL')
      .max(500, 'Project URL must not exceed 500 characters')
      .trim()
      .optional()
      .nullable()
      .or(z.literal('')),
    githubUrl: z
      .string()
      .url('GitHub URL must be a valid URL')
      .regex(/github\.com/, 'GitHub URL must be from github.com')
      .max(500, 'GitHub URL must not exceed 500 characters')
      .trim()
      .optional()
      .nullable()
      .or(z.literal('')),
    demoUrl: z
      .string()
      .url('Demo URL must be a valid URL')
      .max(500, 'Demo URL must not exceed 500 characters')
      .trim()
      .optional()
      .nullable()
      .or(z.literal('')),
    thumbnailUrl: z
      .string()
      .url('Thumbnail URL must be a valid URL')
      .max(500, 'Thumbnail URL must not exceed 500 characters')
      .trim()
      .optional()
      .nullable()
      .or(z.literal('')),
    screenshots: z
      .array(
        z
          .string()
          .url('Screenshot URL must be a valid URL')
          .max(500, 'Screenshot URL must not exceed 500 characters')
      )
      .max(10, 'Maximum 10 screenshots allowed')
      .optional()
      .nullable(),
    isFeatured: z.boolean().optional(),
    displayOrder: z
      .number()
      .int('Display order must be an integer')
      .min(0, 'Display order must be non-negative')
      .optional(),
  })
  .strict();

/**
 * Portfolio Project ID Param Schema
 */
export const portfolioProjectIdParamSchema = z.object({
  id: z.string().uuid('Invalid portfolio project ID format'),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreatePortfolioProjectInput = z.infer<
  typeof createPortfolioProjectSchema
>;
export type UpdatePortfolioProjectInput = z.infer<
  typeof updatePortfolioProjectSchema
>;
export type PortfolioProjectIdParam = z.infer<
  typeof portfolioProjectIdParamSchema
>;
