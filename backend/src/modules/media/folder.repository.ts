import { PrismaClient, MediaFolder, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';

export interface CreateFolderData {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  level: number;
  displayOrder?: number;
}

export interface UpdateFolderData {
  name?: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
}

export class FolderRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create folder
   */
  async createFolder(data: CreateFolderData): Promise<MediaFolder> {
    try {
      return await this.prisma.mediaFolder.create({
        data,
        include: {
          parent: true,
          children: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to create folder', { error, data });
      throw error;
    }
  }

  /**
   * Get folder by ID
   */
  async getFolderById(id: string, includeChildren: boolean = false): Promise<MediaFolder | null> {
    try {
      return await this.prisma.mediaFolder.findUnique({
        where: { id },
        include: {
          parent: true,
          children: includeChildren,
          files: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get folder by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get folder by slug
   */
  async getFolderBySlug(slug: string): Promise<MediaFolder | null> {
    try {
      return await this.prisma.mediaFolder.findUnique({
        where: { slug },
        include: {
          parent: true,
          children: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get folder by slug', { error, slug });
      throw error;
    }
  }

  /**
   * Get folders list
   */
  async getFoldersList(parentId?: string | null): Promise<MediaFolder[]> {
    try {
      const where: Prisma.MediaFolderWhereInput = {};

      if (parentId !== undefined) {
        where.parentId = parentId;
      }

      return await this.prisma.mediaFolder.findMany({
        where,
        include: {
          parent: true,
          children: true,
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get folders list', { error, parentId });
      throw error;
    }
  }

  /**
   * Get folder tree (hierarchical structure)
   */
  async getFolderTree(): Promise<MediaFolder[]> {
    try {
      const folders = await this.prisma.mediaFolder.findMany({
        include: {
          parent: true,
          children: {
            include: {
              children: true,
            },
          },
        },
        orderBy: [{ level: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
      });

      // Return only root folders (level 1)
      return folders.filter((f) => f.level === 1);
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get folder tree', { error });
      throw error;
    }
  }

  /**
   * Update folder
   */
  async updateFolder(id: string, data: UpdateFolderData): Promise<MediaFolder> {
    try {
      return await this.prisma.mediaFolder.update({
        where: { id },
        data,
        include: {
          parent: true,
          children: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to update folder', { error, id, data });
      throw error;
    }
  }

  /**
   * Delete folder
   */
  async deleteFolder(id: string): Promise<void> {
    try {
      await this.prisma.mediaFolder.delete({
        where: { id },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to delete folder', { error, id });
      throw error;
    }
  }

  /**
   * Check if folder has children
   */
  async hasChildren(id: string): Promise<boolean> {
    try {
      const count = await this.prisma.mediaFolder.count({
        where: { parentId: id },
      });
      return count > 0;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to check if folder has children', { error, id });
      throw error;
    }
  }

  /**
   * Check if folder has files
   */
  async hasFiles(id: string): Promise<boolean> {
    try {
      const count = await this.prisma.mediaFile.count({
        where: { folderId: id },
      });
      return count > 0;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to check if folder has files', { error, id });
      throw error;
    }
  }

  /**
   * Update file count for folder
   */
  async updateFileCount(id: string): Promise<void> {
    try {
      const count = await this.prisma.mediaFile.count({
        where: { folderId: id },
      });

      await this.prisma.mediaFolder.update({
        where: { id },
        data: { fileCount: count },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to update file count', { error, id });
      throw error;
    }
  }

  /**
   * Get folder path (breadcrumb)
   */
  async getFolderPath(id: string): Promise<MediaFolder[]> {
    try {
      const path: MediaFolder[] = [];
      let currentFolder = await this.getFolderById(id);

      while (currentFolder) {
        path.unshift(currentFolder);
        if (currentFolder.parentId) {
          currentFolder = await this.getFolderById(currentFolder.parentId);
        } else {
          currentFolder = null;
        }
      }

      return path;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get folder path', { error, id });
      throw error;
    }
  }
}
