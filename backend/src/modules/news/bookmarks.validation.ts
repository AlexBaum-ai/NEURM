import { z } from 'zod';

/**
 * Bookmarks Validation Schemas
 * Following Zod best practices for type-safe validation
 */

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Create bookmark request body
 * POST /api/v1/news/articles/:slug/bookmark
 */
export const createBookmarkSchema = z.object({
  collectionId: z.string().uuid().optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

/**
 * Update bookmark request body
 * PATCH /api/v1/users/me/bookmarks/:id
 */
export const updateBookmarkSchema = z.object({
  collectionId: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable(),
});

/**
 * Create bookmark collection request body
 * POST /api/v1/users/me/bookmark-collections
 */
export const createBookmarkCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});

/**
 * Update bookmark collection request body
 * PATCH /api/v1/users/me/bookmark-collections/:id
 */
export const updateBookmarkCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable(),
});

/**
 * List bookmarks query parameters
 * GET /api/v1/users/me/bookmarks
 */
export const listBookmarksQuerySchema = z.object({
  collectionId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200).optional(),
});

/**
 * Article slug parameter
 * Used in bookmark creation/deletion endpoints
 */
export const articleSlugParamSchema = z.object({
  slug: z.string().min(1, 'Article slug is required'),
});

/**
 * Bookmark ID parameter
 * Used in bookmark update/delete endpoints
 */
export const bookmarkIdParamSchema = z.object({
  id: z.string().uuid('Invalid bookmark ID'),
});

/**
 * Collection ID parameter
 * Used in collection update/delete endpoints
 */
export const collectionIdParamSchema = z.object({
  id: z.string().uuid('Invalid collection ID'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
export type CreateBookmarkCollectionInput = z.infer<typeof createBookmarkCollectionSchema>;
export type UpdateBookmarkCollectionInput = z.infer<typeof updateBookmarkCollectionSchema>;
export type ListBookmarksQuery = z.infer<typeof listBookmarksQuerySchema>;
export type ArticleSlugParam = z.infer<typeof articleSlugParamSchema>;
export type BookmarkIdParam = z.infer<typeof bookmarkIdParamSchema>;
export type CollectionIdParam = z.infer<typeof collectionIdParamSchema>;
