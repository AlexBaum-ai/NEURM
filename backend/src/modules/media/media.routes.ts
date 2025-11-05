import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { MediaController } from './media.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/asyncHandler.middleware';

const router = Router();
const prisma = new PrismaClient();
const mediaController = new MediaController(prisma);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  // Allow documents
  const allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  // Allow videos
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes, ...allowedVideoTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not supported: ${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * Protected routes (require authentication)
 */

// POST /api/v1/media/upload - Upload media file
router.post('/upload', authenticate, upload.single('file'), asyncHandler(mediaController.uploadMedia));

// GET /api/v1/media - Get media files list
router.get('/', authenticate, asyncHandler(mediaController.getMediaList));

// GET /api/v1/media/:id - Get media file by ID
router.get('/:id', authenticate, asyncHandler(mediaController.getMediaById));

// PUT /api/v1/media/:id - Update media file
router.put('/:id', authenticate, asyncHandler(mediaController.updateMedia));

// DELETE /api/v1/media/:id - Delete media file
router.delete('/:id', authenticate, asyncHandler(mediaController.deleteMedia));

// POST /api/v1/media/bulk-delete - Bulk delete media files
router.post('/bulk-delete', authenticate, asyncHandler(mediaController.bulkDeleteMedia));

// POST /api/v1/media/bulk-move - Bulk move media files
router.post('/bulk-move', authenticate, asyncHandler(mediaController.bulkMoveMedia));

// POST /api/v1/media/track-usage - Track media usage
router.post('/track-usage', authenticate, asyncHandler(mediaController.trackUsage));

// GET /api/v1/media/:id/usage - Get media usage
router.get('/:id/usage', authenticate, asyncHandler(mediaController.getUsage));

export default router;
