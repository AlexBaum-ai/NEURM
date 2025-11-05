import { z } from 'zod';

// Upload validation
export const uploadMediaSchema = z.object({
  body: z.object({
    folderId: z.string().uuid().optional(),
    altText: z.string().max(255).optional(),
    caption: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// Update media validation
export const updateMediaSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    folderId: z.string().uuid().nullable().optional(),
    altText: z.string().max(255).optional(),
    caption: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// Get media list validation
export const getMediaListSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    folderId: z.string().uuid().optional(),
    search: z.string().optional(),
    fileType: z.enum(['image', 'video', 'document', 'audio', 'other']).optional(),
    sortBy: z.enum(['createdAt', 'filename', 'fileSize', 'fileType']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

// Bulk delete validation
export const bulkDeleteMediaSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1).max(100),
  }),
});

// Bulk move validation
export const bulkMoveMediaSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1).max(100),
    targetFolderId: z.string().uuid().nullable(),
  }),
});

// Get media by ID validation
export const getMediaByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Track usage validation
export const trackMediaUsageSchema = z.object({
  body: z.object({
    mediaId: z.string().uuid(),
    entityType: z.string().max(50),
    entityId: z.string().uuid(),
    fieldName: z.string().max(100).optional(),
    usageContext: z.string().optional(),
  }),
});

// Get usage validation
export const getMediaUsageSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
export type GetMediaListInput = z.infer<typeof getMediaListSchema>;
export type BulkDeleteMediaInput = z.infer<typeof bulkDeleteMediaSchema>;
export type BulkMoveMediaInput = z.infer<typeof bulkMoveMediaSchema>;
export type GetMediaByIdInput = z.infer<typeof getMediaByIdSchema>;
export type TrackMediaUsageInput = z.infer<typeof trackMediaUsageSchema>;
export type GetMediaUsageInput = z.infer<typeof getMediaUsageSchema>;
