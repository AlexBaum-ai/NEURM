import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { FolderController } from './folder.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/asyncHandler.middleware';

const router = Router();
const prisma = new PrismaClient();
const folderController = new FolderController(prisma);

/**
 * Protected routes (require authentication)
 */

// POST /api/v1/media/folders - Create folder
router.post('/', authenticate, asyncHandler(folderController.createFolder));

// GET /api/v1/media/folders - Get folders list
router.get('/', authenticate, asyncHandler(folderController.getFoldersList));

// GET /api/v1/media/folders/tree - Get folder tree
router.get('/tree', authenticate, asyncHandler(folderController.getFolderTree));

// GET /api/v1/media/folders/:id - Get folder by ID
router.get('/:id', authenticate, asyncHandler(folderController.getFolderById));

// GET /api/v1/media/folders/:id/path - Get folder path (breadcrumb)
router.get('/:id/path', authenticate, asyncHandler(folderController.getFolderPath));

// PUT /api/v1/media/folders/:id - Update folder
router.put('/:id', authenticate, asyncHandler(folderController.updateFolder));

// DELETE /api/v1/media/folders/:id - Delete folder
router.delete('/:id', authenticate, asyncHandler(folderController.deleteFolder));

export default router;
