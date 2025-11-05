import { z } from 'zod';

// Category visibility enum
export const CategoryVisibilitySchema = z.enum(['public', 'private', 'moderator_only']);

// Create category schema
export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must not exceed 100 characters')
    .trim(),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must not exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional()
    .nullable(),
  icon: z
    .string()
    .max(50, 'Icon identifier must not exceed 50 characters')
    .optional()
    .nullable(),
  parentId: z.string().uuid('Invalid parent category ID').optional().nullable(),
  displayOrder: z.number().int().min(0).default(0).optional(),
  guidelines: z
    .string()
    .max(5000, 'Guidelines must not exceed 5000 characters')
    .trim()
    .optional()
    .nullable(),
  visibility: CategoryVisibilitySchema.default('public').optional(),
  isActive: z.boolean().default(true).optional(),
});

// Update category schema (all fields optional)
export const UpdateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must not exceed 100 characters')
    .trim()
    .optional(),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must not exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional()
    .nullable(),
  icon: z
    .string()
    .max(50, 'Icon identifier must not exceed 50 characters')
    .optional()
    .nullable(),
  parentId: z.string().uuid('Invalid parent category ID').optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  guidelines: z
    .string()
    .max(5000, 'Guidelines must not exceed 5000 characters')
    .trim()
    .optional()
    .nullable(),
  visibility: CategoryVisibilitySchema.optional(),
  isActive: z.boolean().optional(),
});

// Reorder categories schema
export const ReorderCategoriesSchema = z.object({
  categories: z
    .array(
      z.object({
        id: z.string().uuid('Invalid category ID'),
        displayOrder: z.number().int().min(0),
      })
    )
    .min(1, 'At least one category must be provided')
    .max(100, 'Cannot reorder more than 100 categories at once'),
});

// Assign moderator schema
export const AssignModeratorSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Remove moderator schema
export const RemoveModeratorSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Query params for listing categories
export const ListCategoriesQuerySchema = z.object({
  includeInactive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

// UUID param schema
export const UuidParamSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
});

// Slug param schema
export const SlugParamSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

// Type exports
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof ReorderCategoriesSchema>;
export type AssignModeratorInput = z.infer<typeof AssignModeratorSchema>;
export type RemoveModeratorInput = z.infer<typeof RemoveModeratorSchema>;
export type ListCategoriesQuery = z.infer<typeof ListCategoriesQuerySchema>;
