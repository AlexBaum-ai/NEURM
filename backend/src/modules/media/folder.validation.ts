import { z } from 'zod';

// Create folder validation
export const createFolderSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    parentId: z.string().uuid().optional(),
  }),
});

// Update folder validation
export const updateFolderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    displayOrder: z.number().int().min(0).optional(),
  }),
});

// Delete folder validation
export const deleteFolderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Get folder by ID validation
export const getFolderByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Get folders list validation
export const getFoldersListSchema = z.object({
  query: z.object({
    parentId: z.string().uuid().optional(),
    includeFileCount: z.enum(['true', 'false']).optional().default('true'),
  }),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type DeleteFolderInput = z.infer<typeof deleteFolderSchema>;
export type GetFolderByIdInput = z.infer<typeof getFolderByIdSchema>;
export type GetFoldersListInput = z.infer<typeof getFoldersListSchema>;
