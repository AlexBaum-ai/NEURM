import multer from 'multer';
import path from 'path';
import { BadRequestError } from '@/utils/errors';

/**
 * Upload configuration
 * Defines file size limits, allowed MIME types, and storage settings
 */

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  AVATAR: 5 * 1024 * 1024, // 5MB
  COVER: 10 * 1024 * 1024, // 10MB
};

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
};

// Image dimensions for resizing
export const IMAGE_SIZES = {
  AVATAR: {
    THUMBNAIL: { width: 32, height: 32 },
    SMALL: { width: 64, height: 64 },
    MEDIUM: { width: 128, height: 128 },
    LARGE: { width: 256, height: 256 },
  },
  COVER: {
    SMALL: { width: 640, height: 320 },
    MEDIUM: { width: 1280, height: 640 },
    LARGE: { width: 1920, height: 960 },
  },
};

// Upload rate limiting (per user)
export const UPLOAD_RATE_LIMIT = {
  MAX_UPLOADS: 5,
  WINDOW_HOURS: 1,
};

/**
 * File filter for multer
 * Validates file MIME type
 */
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check if file MIME type is allowed
  if (ALLOWED_MIME_TYPES.IMAGE.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type. Only ${ALLOWED_MIME_TYPES.IMAGE.join(', ')} are allowed.`
      )
    );
  }
};

/**
 * Multer configuration for avatar uploads
 */
export const avatarUpload = multer({
  storage: multer.memoryStorage(), // Store in memory for processing with Sharp
  limits: {
    fileSize: FILE_SIZE_LIMITS.AVATAR,
    files: 1,
  },
  fileFilter,
});

/**
 * Multer configuration for cover image uploads
 */
export const coverUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMITS.COVER,
    files: 1,
  },
  fileFilter,
});

/**
 * Generate unique filename
 */
export const generateFileName = (userId: string, type: 'avatar' | 'cover', size?: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sizePrefix = size ? `${size}-` : '';
  return `${type}/${userId}/${sizePrefix}${timestamp}-${randomString}.webp`;
};

/**
 * Extract file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase().slice(1);
};
