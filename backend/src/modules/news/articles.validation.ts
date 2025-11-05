import { z } from 'zod';
import { ArticleStatus, ContentFormat, DifficultyLevel } from '@prisma/client';

/**
 * Article Validation Schemas
 * Zod schemas for validating article API requests
 */

// Create article schema (admin only)
export const createArticleSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(255, 'Title must not exceed 255 characters'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(255, 'Slug must not exceed 255 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  summary: z
    .string()
    .min(50, 'Summary must be at least 50 characters')
    .max(500, 'Summary must not exceed 500 characters'),
  content: z
    .string()
    .min(100, 'Content must be at least 100 characters'),
  contentFormat: z.nativeEnum(ContentFormat).default(ContentFormat.markdown),
  featuredImageUrl: z
    .string()
    .url('Featured image must be a valid URL')
    .optional()
    .nullable(),
  authorId: z
    .string()
    .uuid('Author ID must be a valid UUID')
    .optional()
    .nullable(),
  authorName: z
    .string()
    .max(100, 'Author name must not exceed 100 characters')
    .optional()
    .nullable(),
  sourceUrl: z
    .string()
    .url('Source URL must be valid')
    .optional()
    .nullable(),
  categoryId: z
    .string()
    .uuid('Category ID must be a valid UUID'),
  status: z.nativeEnum(ArticleStatus).default(ArticleStatus.draft),
  scheduledAt: z
    .string()
    .datetime('Scheduled date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  publishedAt: z
    .string()
    .datetime('Published date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  difficultyLevel: z.nativeEnum(DifficultyLevel).optional().nullable(),
  readingTimeMinutes: z
    .number()
    .int('Reading time must be an integer')
    .min(1, 'Reading time must be at least 1 minute')
    .max(300, 'Reading time must not exceed 300 minutes')
    .optional()
    .nullable(),
  metaTitle: z
    .string()
    .max(255, 'Meta title must not exceed 255 characters')
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(500, 'Meta description must not exceed 500 characters')
    .optional()
    .nullable(),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  tagIds: z
    .array(z.string().uuid('Tag ID must be a valid UUID'))
    .optional()
    .default([]),
  modelIds: z
    .array(z.string().uuid('Model ID must be a valid UUID'))
    .optional()
    .default([]),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;

// Update article schema (admin only)
export const updateArticleSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(255, 'Title must not exceed 255 characters')
    .optional(),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(255, 'Slug must not exceed 255 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  summary: z
    .string()
    .min(50, 'Summary must be at least 50 characters')
    .max(500, 'Summary must not exceed 500 characters')
    .optional(),
  content: z
    .string()
    .min(100, 'Content must be at least 100 characters')
    .optional(),
  contentFormat: z.nativeEnum(ContentFormat).optional(),
  featuredImageUrl: z
    .string()
    .url('Featured image must be a valid URL')
    .optional()
    .nullable(),
  authorId: z
    .string()
    .uuid('Author ID must be a valid UUID')
    .optional()
    .nullable(),
  authorName: z
    .string()
    .max(100, 'Author name must not exceed 100 characters')
    .optional()
    .nullable(),
  sourceUrl: z
    .string()
    .url('Source URL must be valid')
    .optional()
    .nullable(),
  categoryId: z
    .string()
    .uuid('Category ID must be a valid UUID')
    .optional(),
  status: z.nativeEnum(ArticleStatus).optional(),
  scheduledAt: z
    .string()
    .datetime('Scheduled date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  publishedAt: z
    .string()
    .datetime('Published date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  difficultyLevel: z.nativeEnum(DifficultyLevel).optional().nullable(),
  readingTimeMinutes: z
    .number()
    .int('Reading time must be an integer')
    .min(1, 'Reading time must be at least 1 minute')
    .max(300, 'Reading time must not exceed 300 minutes')
    .optional()
    .nullable(),
  metaTitle: z
    .string()
    .max(255, 'Meta title must not exceed 255 characters')
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(500, 'Meta description must not exceed 500 characters')
    .optional()
    .nullable(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  tagIds: z
    .array(z.string().uuid('Tag ID must be a valid UUID'))
    .optional(),
  modelIds: z
    .array(z.string().uuid('Model ID must be a valid UUID'))
    .optional(),
});

export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

// List articles query schema (public)
export const listArticlesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must not exceed 100')),

  // Enhanced filters
  category: z
    .string()
    .optional(), // Support both slug and UUID
  categoryId: z
    .string()
    .uuid('Category ID must be a valid UUID')
    .optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => val ? val.split(',').filter(Boolean) : undefined), // Support comma-separated tags
  tagId: z
    .string()
    .uuid('Tag ID must be a valid UUID')
    .optional(),
  authorId: z
    .string()
    .uuid('Author ID must be a valid UUID')
    .optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(), // Shorthand
  difficultyLevel: z.nativeEnum(DifficultyLevel).optional(),
  model: z
    .string()
    .optional(), // Support model slug
  modelId: z
    .string()
    .uuid('Model ID must be a valid UUID')
    .optional(),
  isFeatured: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  isTrending: z
    .string()
    .transform((val) => val === 'true')
    .optional(),

  // Search
  search: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(200, 'Search query must not exceed 200 characters')
    .optional(),

  // Cursor-based pagination
  cursor: z
    .string()
    .uuid('Cursor must be a valid UUID')
    .optional(),

  // Sorting
  sortBy: z
    .enum(['publishedAt', 'viewCount', 'bookmarkCount', 'createdAt', 'relevance'])
    .default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;

// Article slug parameter schema
export const articleSlugParamSchema = z.object({
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
});

export type ArticleSlugParam = z.infer<typeof articleSlugParamSchema>;

// Article ID parameter schema (admin)
export const articleIdParamSchema = z.object({
  id: z.string().uuid('Article ID must be a valid UUID'),
});

export type ArticleIdParam = z.infer<typeof articleIdParamSchema>;
