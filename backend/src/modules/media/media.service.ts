import { PrismaClient, MediaFile, MediaType } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import { MediaRepository, CreateMediaFileData, UpdateMediaFileData, MediaListFilters } from './media.repository';
import { StorageService } from './storage.service';
import { ImageProcessor } from './imageProcessor';

export class MediaService {
  private mediaRepository: MediaRepository;
  private storageService: StorageService;

  constructor(prisma: PrismaClient) {
    this.mediaRepository = new MediaRepository(prisma);
    this.storageService = new StorageService();
  }

  /**
   * Determine media type from MIME type
   */
  private getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('msword') ||
      mimeType.includes('spreadsheet')
    ) {
      return 'document';
    }
    return 'other';
  }

  /**
   * Upload media file
   */
  async uploadMediaFile(
    file: Express.Multer.File,
    uploadedById: string,
    options?: {
      folderId?: string;
      altText?: string;
      caption?: string;
      tags?: string[];
    }
  ): Promise<MediaFile> {
    try {
      const fileType = this.getMediaType(file.mimetype);

      // For images, validate and process
      if (fileType === 'image') {
        await ImageProcessor.validateImage(file.path, file.size);
      }

      // Generate unique filename and storage path
      const uniqueFilename = this.storageService.generateUniqueFilename(file.originalname);
      const storagePath = this.storageService.getStoragePath(fileType, uniqueFilename);

      // Upload main file
      const uploadResult = await this.storageService.uploadFile(file.path, storagePath, file.mimetype);

      // Get image metadata if it's an image
      let metadata = {};
      let width: number | undefined;
      let height: number | undefined;

      if (fileType === 'image') {
        const imageMetadata = await ImageProcessor.getMetadata(file.path);
        width = imageMetadata.width;
        height = imageMetadata.height;
        metadata = { format: imageMetadata.format };
      }

      // Create media file record
      const mediaFileData: CreateMediaFileData = {
        filename: uniqueFilename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileType,
        url: uploadResult.url,
        cdnUrl: uploadResult.cdnUrl,
        storageProvider: uploadResult.storageProvider,
        storageKey: uploadResult.storageKey,
        uploadedById,
        width,
        height,
        metadata,
        ...options,
      };

      const mediaFile = await this.mediaRepository.createMediaFile(mediaFileData);

      // Generate thumbnails for images
      if (fileType === 'image') {
        await this.generateThumbnails(mediaFile.id, file.path, uniqueFilename);
      }

      // Clean up temp file
      await fs.unlink(file.path).catch(() => {});

      logger.info('Media file uploaded successfully', {
        mediaId: mediaFile.id,
        filename: uniqueFilename,
        fileType,
      });

      return mediaFile;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to upload media file', { error, filename: file.originalname });
      // Clean up temp file on error
      await fs.unlink(file.path).catch(() => {});
      throw error;
    }
  }

  /**
   * Generate thumbnails for image
   */
  private async generateThumbnails(mediaId: string, imagePath: string, baseFilename: string): Promise<void> {
    try {
      const tempThumbnailDir = path.join(process.cwd(), 'uploads', 'temp-thumbnails');
      await fs.mkdir(tempThumbnailDir, { recursive: true });

      const thumbnails = await ImageProcessor.generateThumbnails(imagePath, tempThumbnailDir, baseFilename);

      // Upload each thumbnail and create database records
      for (const thumbnail of thumbnails) {
        const storagePath = this.storageService.getThumbnailPath('image', baseFilename, thumbnail.size);
        const uploadResult = await this.storageService.uploadFile(thumbnail.path, storagePath, 'image/jpeg');

        await this.mediaRepository.createThumbnail({
          mediaId,
          size: thumbnail.size,
          width: thumbnail.width,
          height: thumbnail.height,
          url: uploadResult.url,
          cdnUrl: uploadResult.cdnUrl,
          storageKey: uploadResult.storageKey,
          fileSize: thumbnail.fileSize,
        });

        // Clean up temp thumbnail
        await fs.unlink(thumbnail.path).catch(() => {});
      }

      logger.info('Thumbnails generated successfully', { mediaId, count: thumbnails.length });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to generate thumbnails', { error, mediaId });
      // Don't throw - thumbnails are optional
    }
  }

  /**
   * Get media file by ID
   */
  async getMediaFileById(id: string): Promise<MediaFile | null> {
    try {
      return await this.mediaRepository.getMediaFileById(id);
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get media file by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get media files list
   */
  async getMediaFilesList(filters: MediaListFilters): Promise<{ files: MediaFile[]; total: number; pages: number }> {
    try {
      const { files, total } = await this.mediaRepository.getMediaFilesList(filters);
      const pages = Math.ceil(total / filters.limit);

      return { files, total, pages };
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get media files list', { error, filters });
      throw error;
    }
  }

  /**
   * Update media file
   */
  async updateMediaFile(id: string, data: UpdateMediaFileData): Promise<MediaFile> {
    try {
      const updated = await this.mediaRepository.updateMediaFile(id, data);
      logger.info('Media file updated', { id, data });
      return updated;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to update media file', { error, id, data });
      throw error;
    }
  }

  /**
   * Delete media file
   */
  async deleteMediaFile(id: string): Promise<void> {
    try {
      const mediaFile = await this.mediaRepository.getMediaFileById(id);
      if (!mediaFile) {
        throw new Error('Media file not found');
      }

      // Delete from storage
      await this.storageService.deleteFile(mediaFile.storageKey, mediaFile.storageProvider);

      // Delete thumbnails from storage
      if (mediaFile.thumbnails && mediaFile.thumbnails.length > 0) {
        for (const thumbnail of mediaFile.thumbnails) {
          await this.storageService
            .deleteFile(thumbnail.storageKey, mediaFile.storageProvider)
            .catch(() => {});
        }
      }

      // Delete from database
      await this.mediaRepository.deleteMediaFile(id);

      logger.info('Media file deleted', { id });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to delete media file', { error, id });
      throw error;
    }
  }

  /**
   * Bulk delete media files
   */
  async bulkDeleteMediaFiles(ids: string[]): Promise<number> {
    try {
      let deletedCount = 0;

      // Delete each file individually to ensure proper cleanup
      for (const id of ids) {
        try {
          await this.deleteMediaFile(id);
          deletedCount++;
        } catch (error) {
          logger.error('Failed to delete media file in bulk operation', { error, id });
          Sentry.captureException(error);
        }
      }

      logger.info('Bulk delete completed', { requestedCount: ids.length, deletedCount });
      return deletedCount;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to bulk delete media files', { error, ids });
      throw error;
    }
  }

  /**
   * Bulk move media files
   */
  async bulkMoveMediaFiles(ids: string[], targetFolderId: string | null): Promise<number> {
    try {
      const count = await this.mediaRepository.bulkMoveMediaFiles(ids, targetFolderId);
      logger.info('Bulk move completed', { count, targetFolderId });
      return count;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to bulk move media files', { error, ids, targetFolderId });
      throw error;
    }
  }

  /**
   * Track media usage
   */
  async trackMediaUsage(data: {
    mediaId: string;
    entityType: string;
    entityId: string;
    fieldName?: string;
    usageContext?: string;
  }) {
    try {
      return await this.mediaRepository.trackMediaUsage(data);
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to track media usage', { error, data });
      throw error;
    }
  }

  /**
   * Get media usage
   */
  async getMediaUsage(mediaId: string) {
    try {
      return await this.mediaRepository.getMediaUsage(mediaId);
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get media usage', { error, mediaId });
      throw error;
    }
  }
}
