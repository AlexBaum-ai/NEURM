import { PrismaClient, MediaFile, MediaThumbnail, MediaUsage, MediaType, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';

export interface CreateMediaFileData {
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  fileType: MediaType;
  folderId?: string;
  url: string;
  cdnUrl?: string;
  storageProvider: string;
  storageKey: string;
  altText?: string;
  caption?: string;
  width?: number;
  height?: number;
  duration?: number;
  tags?: string[];
  metadata?: any;
  uploadedById: string;
}

export interface CreateThumbnailData {
  mediaId: string;
  size: string;
  width: number;
  height: number;
  url: string;
  cdnUrl?: string;
  storageKey: string;
  fileSize: number;
}

export interface UpdateMediaFileData {
  folderId?: string | null;
  altText?: string;
  caption?: string;
  tags?: string[];
}

export interface MediaListFilters {
  page: number;
  limit: number;
  folderId?: string;
  search?: string;
  fileType?: MediaType;
  sortBy: 'createdAt' | 'filename' | 'fileSize' | 'fileType';
  sortOrder: 'asc' | 'desc';
  uploadedById?: string;
}

export class MediaRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create media file
   */
  async createMediaFile(data: CreateMediaFileData): Promise<MediaFile> {
    try {
      return await this.prisma.mediaFile.create({
        data,
        include: {
          folder: true,
          uploader: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to create media file', { error, data });
      throw error;
    }
  }

  /**
   * Create thumbnail
   */
  async createThumbnail(data: CreateThumbnailData): Promise<MediaThumbnail> {
    try {
      return await this.prisma.mediaThumbnail.create({
        data,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to create thumbnail', { error, data });
      throw error;
    }
  }

  /**
   * Get media file by ID
   */
  async getMediaFileById(id: string): Promise<MediaFile | null> {
    try {
      return await this.prisma.mediaFile.findUnique({
        where: { id },
        include: {
          folder: true,
          uploader: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          thumbnails: true,
          usage: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get media file by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get media files list with pagination and filters
   */
  async getMediaFilesList(filters: MediaListFilters): Promise<{ files: MediaFile[]; total: number }> {
    try {
      const { page, limit, folderId, search, fileType, sortBy, sortOrder, uploadedById } = filters;
      const skip = (page - 1) * limit;

      const where: Prisma.MediaFileWhereInput = {};

      if (folderId !== undefined) {
        where.folderId = folderId === 'null' ? null : folderId;
      }

      if (search) {
        where.OR = [
          { filename: { contains: search, mode: 'insensitive' } },
          { originalFilename: { contains: search, mode: 'insensitive' } },
          { altText: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }

      if (fileType) {
        where.fileType = fileType;
      }

      if (uploadedById) {
        where.uploadedById = uploadedById;
      }

      const [files, total] = await Promise.all([
        this.prisma.mediaFile.findMany({
          where,
          include: {
            folder: true,
            uploader: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            thumbnails: true,
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.mediaFile.count({ where }),
      ]);

      return { files, total };
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
      return await this.prisma.mediaFile.update({
        where: { id },
        data,
        include: {
          folder: true,
          uploader: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          thumbnails: true,
        },
      });
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
      await this.prisma.mediaFile.delete({
        where: { id },
      });
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
      const result = await this.prisma.mediaFile.deleteMany({
        where: {
          id: { in: ids },
        },
      });
      return result.count;
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
      const result = await this.prisma.mediaFile.updateMany({
        where: {
          id: { in: ids },
        },
        data: {
          folderId: targetFolderId,
        },
      });
      return result.count;
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
  }): Promise<MediaUsage> {
    try {
      return await this.prisma.mediaUsage.upsert({
        where: {
          mediaId_entityType_entityId_fieldName: {
            mediaId: data.mediaId,
            entityType: data.entityType,
            entityId: data.entityId,
            fieldName: data.fieldName || '',
          },
        },
        create: data,
        update: {
          usageContext: data.usageContext,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to track media usage', { error, data });
      throw error;
    }
  }

  /**
   * Get media usage
   */
  async getMediaUsage(mediaId: string): Promise<MediaUsage[]> {
    try {
      return await this.prisma.mediaUsage.findMany({
        where: { mediaId },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get media usage', { error, mediaId });
      throw error;
    }
  }

  /**
   * Remove media usage
   */
  async removeMediaUsage(mediaId: string, entityType: string, entityId: string, fieldName?: string): Promise<void> {
    try {
      await this.prisma.mediaUsage.delete({
        where: {
          mediaId_entityType_entityId_fieldName: {
            mediaId,
            entityType,
            entityId,
            fieldName: fieldName || '',
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to remove media usage', { error, mediaId, entityType, entityId });
      throw error;
    }
  }
}
