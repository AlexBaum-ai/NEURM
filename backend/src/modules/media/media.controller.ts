import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import { MediaService } from './media.service';
import {
  uploadMediaSchema,
  updateMediaSchema,
  getMediaListSchema,
  bulkDeleteMediaSchema,
  bulkMoveMediaSchema,
  getMediaByIdSchema,
  trackMediaUsageSchema,
  getMediaUsageSchema,
} from './media.validation';
import { BadRequestError, NotFoundError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';
import { PrismaClient, MediaType } from '@prisma/client';

/**
 * MediaController
 * Handles HTTP requests for media endpoints
 */
export class MediaController {
  private mediaService: MediaService;

  constructor(prisma: PrismaClient) {
    this.mediaService = new MediaService(prisma);
  }

  /**
   * POST /api/media/upload
   * Upload media file
   */
  uploadMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('No file provided');
      }

      // Validate body
      const validationResult = uploadMediaSchema.safeParse({ body: req.body });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Validation failed');
      }

      const { folderId, altText, caption, tags } = validationResult.data.body;
      const uploadedById = (req as any).user?.id;

      if (!uploadedById) {
        throw new BadRequestError('User not authenticated');
      }

      const mediaFile = await this.mediaService.uploadMediaFile(req.file, uploadedById, {
        folderId,
        altText,
        caption,
        tags,
      });

      res.status(201).json({
        success: true,
        data: mediaFile,
        message: 'Media file uploaded successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'MediaController', method: 'uploadMedia' },
        extra: { body: req.body, file: req.file?.originalname },
      });
      throw error;
    }
  };

  /**
   * GET /api/media
   * Get media files list with pagination and filters
   */
  getMediaList = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = getMediaListSchema.safeParse({ query: req.query });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Validation failed');
      }

      const { page, limit, folderId, search, fileType, sortBy, sortOrder } = validationResult.data.query;

      const result = await this.mediaService.getMediaFilesList({
        page: parseInt(page),
        limit: parseInt(limit),
        folderId,
        search,
        fileType: fileType as MediaType | undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.status(200).json({
        success: true,
        data: result.files,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: result.pages,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'MediaController', method: 'getMediaList' },
        extra: { query: req.query },
      });
      throw error;
    }
  };

  /**
   * GET /api/media/:id
   * Get media file by ID
   */
  getMediaById = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = getMediaByIdSchema.safeParse({ params: req.params });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Invalid ID');
      }

      const { id } = validationResult.data.params;
      const mediaFile = await this.mediaService.getMediaFileById(id);

      if (!mediaFile) {
        throw new NotFoundError('Media file not found');
      }

      res.status(200).json({
        success: true,
        data: mediaFile,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'MediaController', method: 'getMediaById' },
        extra: { params: req.params },
      });
      throw error;
    }
  };

  /**
   * PUT /api/media/:id
   * Update media file
   */
  updateMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = updateMediaSchema.safeParse({
        params: req.params,
        body: req.body,
      });

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Validation failed');
      }

      const { id } = validationResult.data.params;
      const updateData = validationResult.data.body;

      const updated = await this.mediaService.updateMediaFile(id, updateData);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Media file updated successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'MediaController', method: 'updateMedia' },
        extra: { params: req.params, body: req.body },
      });
      throw error;
    }
  };

  /**
   * DELETE /api/media/:id
   * Delete media file
   */
  deleteMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = getMediaByIdSchema.safeParse({ params: req.params });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Invalid ID');
      }

      const { id } = validationResult.data.params;
      await this.mediaService.deleteMediaFile(id);

      res.status(200).json({
        success: true,
        message: 'Media file deleted successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'MediaController', method: 'deleteMedia' },
        extra: { params: req.params },
      });
      throw error;
    }
  };

  /**
   * POST /api/media/bulk-delete
   * Bulk delete media files
   */
  bulkDeleteMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = bulkDeleteMediaSchema.safeParse({ body: req.body });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Validation failed');
      }

      const { ids } = validationResult.data.body;
      const deletedCount = await this.mediaService.bulkDeleteMediaFiles(ids);

      res.status(200).json({
        success: true,
        data: { deletedCount },
        message: `${deletedCount} media file(s) deleted successfully`,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'MediaController', method: 'bulkDeleteMedia' },
        extra: { body: req.body },
      });
      throw error;
    }
  };

  /**
   * POST /api/media/bulk-move
   * Bulk move media files to a folder
   */
  bulkMoveMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = bulkMoveMediaSchema.safeParse({ body: req.body });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Validation failed');
      }

      const { ids, targetFolderId } = validationResult.data.body;
      const movedCount = await this.mediaService.bulkMoveMediaFiles(ids, targetFolderId);

      res.status(200).json({
        success: true,
        data: { movedCount },
        message: `${movedCount} media file(s) moved successfully`,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'MediaController', method: 'bulkMoveMedia' },
        extra: { body: req.body },
      });
      throw error;
    }
  };

  /**
   * POST /api/media/track-usage
   * Track media usage
   */
  trackUsage = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = trackMediaUsageSchema.safeParse({ body: req.body });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Validation failed');
      }

      const usage = await this.mediaService.trackMediaUsage(validationResult.data.body);

      res.status(200).json({
        success: true,
        data: usage,
        message: 'Media usage tracked successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'MediaController', method: 'trackUsage' },
        extra: { body: req.body },
      });
      throw error;
    }
  };

  /**
   * GET /api/media/:id/usage
   * Get media usage information
   */
  getUsage = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = getMediaUsageSchema.safeParse({ params: req.params });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Invalid ID');
      }

      const { id } = validationResult.data.params;
      const usage = await this.mediaService.getMediaUsage(id);

      res.status(200).json({
        success: true,
        data: usage,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'MediaController', method: 'getUsage' },
        extra: { params: req.params },
      });
      throw error;
    }
  };
}
