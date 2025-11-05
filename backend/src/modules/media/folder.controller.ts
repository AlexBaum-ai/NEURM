import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import { FolderService } from './folder.service';
import {
  createFolderSchema,
  updateFolderSchema,
  deleteFolderSchema,
  getFolderByIdSchema,
  getFoldersListSchema,
} from './folder.validation';
import { BadRequestError, NotFoundError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';
import { PrismaClient } from '@prisma/client';

/**
 * FolderController
 * Handles HTTP requests for media folder endpoints
 */
export class FolderController {
  private folderService: FolderService;

  constructor(prisma: PrismaClient) {
    this.folderService = new FolderService(prisma);
  }

  /**
   * POST /api/media/folders
   * Create a new folder
   */
  createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = createFolderSchema.safeParse({ body: req.body });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Validation failed');
      }

      const folder = await this.folderService.createFolder(validationResult.data.body);

      res.status(201).json({
        success: true,
        data: folder,
        message: 'Folder created successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'FolderController', method: 'createFolder' },
        extra: { body: req.body },
      });
      throw error;
    }
  };

  /**
   * GET /api/media/folders
   * Get folders list
   */
  getFoldersList = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = getFoldersListSchema.safeParse({ query: req.query });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Validation failed');
      }

      const { parentId } = validationResult.data.query;
      const folders = await this.folderService.getFoldersList(parentId);

      res.status(200).json({
        success: true,
        data: folders,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'FolderController', method: 'getFoldersList' },
        extra: { query: req.query },
      });
      throw error;
    }
  };

  /**
   * GET /api/media/folders/tree
   * Get folder tree (hierarchical structure)
   */
  getFolderTree = async (req: Request, res: Response): Promise<void> => {
    try {
      const tree = await this.folderService.getFolderTree();

      res.status(200).json({
        success: true,
        data: tree,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'FolderController', method: 'getFolderTree' },
      });
      throw error;
    }
  };

  /**
   * GET /api/media/folders/:id
   * Get folder by ID
   */
  getFolderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = getFolderByIdSchema.safeParse({ params: req.params });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Invalid ID');
      }

      const { id } = validationResult.data.params;
      const folder = await this.folderService.getFolderById(id);

      if (!folder) {
        throw new NotFoundError('Folder not found');
      }

      res.status(200).json({
        success: true,
        data: folder,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'FolderController', method: 'getFolderById' },
        extra: { params: req.params },
      });
      throw error;
    }
  };

  /**
   * GET /api/media/folders/:id/path
   * Get folder path (breadcrumb)
   */
  getFolderPath = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = getFolderByIdSchema.safeParse({ params: req.params });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Invalid ID');
      }

      const { id } = validationResult.data.params;
      const path = await this.folderService.getFolderPath(id);

      res.status(200).json({
        success: true,
        data: path,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'FolderController', method: 'getFolderPath' },
        extra: { params: req.params },
      });
      throw error;
    }
  };

  /**
   * PUT /api/media/folders/:id
   * Update folder
   */
  updateFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = updateFolderSchema.safeParse({
        params: req.params,
        body: req.body,
      });

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Validation failed');
      }

      const { id } = validationResult.data.params;
      const updateData = validationResult.data.body;

      const updated = await this.folderService.updateFolder(id, updateData);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Folder updated successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'FolderController', method: 'updateFolder' },
        extra: { params: req.params, body: req.body },
      });
      throw error;
    }
  };

  /**
   * DELETE /api/media/folders/:id
   * Delete folder
   */
  deleteFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = deleteFolderSchema.safeParse({ params: req.params });
      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Invalid ID');
      }

      const { id } = validationResult.data.params;
      await this.folderService.deleteFolder(id);

      res.status(200).json({
        success: true,
        message: 'Folder deleted successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'FolderController', method: 'deleteFolder' },
        extra: { params: req.params },
      });
      throw error;
    }
  };
}
