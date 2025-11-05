import { PrismaClient, MediaFolder } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import { FolderRepository, CreateFolderData, UpdateFolderData } from './folder.repository';

export class FolderService {
  private folderRepository: FolderRepository;

  constructor(prisma: PrismaClient) {
    this.folderRepository = new FolderRepository(prisma);
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Create folder
   */
  async createFolder(data: { name: string; description?: string; parentId?: string }): Promise<MediaFolder> {
    try {
      let level = 1;
      let parent: MediaFolder | null = null;

      // If parent exists, get parent and calculate level
      if (data.parentId) {
        parent = await this.folderRepository.getFolderById(data.parentId);
        if (!parent) {
          throw new Error('Parent folder not found');
        }
        level = parent.level + 1;

        // Limit folder depth to 5 levels
        if (level > 5) {
          throw new Error('Maximum folder depth (5 levels) exceeded');
        }
      }

      const slug = this.generateSlug(data.name);

      // Check if slug already exists
      const existingFolder = await this.folderRepository.getFolderBySlug(slug);
      if (existingFolder) {
        throw new Error('A folder with this name already exists');
      }

      const folderData: CreateFolderData = {
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId,
        level,
      };

      const folder = await this.folderRepository.createFolder(folderData);

      logger.info('Folder created', { id: folder.id, name: folder.name, level });

      return folder;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to create folder', { error, data });
      throw error;
    }
  }

  /**
   * Get folder by ID
   */
  async getFolderById(id: string): Promise<MediaFolder | null> {
    try {
      return await this.folderRepository.getFolderById(id, true);
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get folder by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get folders list
   */
  async getFoldersList(parentId?: string): Promise<MediaFolder[]> {
    try {
      const folders = await this.folderRepository.getFoldersList(
        parentId === 'null' ? null : parentId
      );
      return folders;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get folders list', { error, parentId });
      throw error;
    }
  }

  /**
   * Get folder tree
   */
  async getFolderTree(): Promise<MediaFolder[]> {
    try {
      return await this.folderRepository.getFolderTree();
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
      const folder = await this.folderRepository.getFolderById(id);
      if (!folder) {
        throw new Error('Folder not found');
      }

      // If name is being changed, generate new slug
      if (data.name && data.name !== folder.name) {
        data.slug = this.generateSlug(data.name);

        // Check if new slug already exists
        const existingFolder = await this.folderRepository.getFolderBySlug(data.slug);
        if (existingFolder && existingFolder.id !== id) {
          throw new Error('A folder with this name already exists');
        }
      }

      const updated = await this.folderRepository.updateFolder(id, data);

      logger.info('Folder updated', { id, data });

      return updated;
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
      const folder = await this.folderRepository.getFolderById(id);
      if (!folder) {
        throw new Error('Folder not found');
      }

      // Check if folder has children
      const hasChildren = await this.folderRepository.hasChildren(id);
      if (hasChildren) {
        throw new Error('Cannot delete folder with subfolders. Delete or move subfolders first.');
      }

      // Check if folder has files
      const hasFiles = await this.folderRepository.hasFiles(id);
      if (hasFiles) {
        throw new Error('Cannot delete folder with files. Delete or move files first.');
      }

      await this.folderRepository.deleteFolder(id);

      logger.info('Folder deleted', { id });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to delete folder', { error, id });
      throw error;
    }
  }

  /**
   * Get folder path (breadcrumb)
   */
  async getFolderPath(id: string): Promise<MediaFolder[]> {
    try {
      return await this.folderRepository.getFolderPath(id);
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get folder path', { error, id });
      throw error;
    }
  }

  /**
   * Update file count for folder
   */
  async updateFileCount(id: string): Promise<void> {
    try {
      await this.folderRepository.updateFileCount(id);
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to update file count', { error, id });
      throw error;
    }
  }
}
