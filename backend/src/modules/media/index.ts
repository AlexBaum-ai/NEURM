/**
 * Media Module
 * Handles media file uploads, management, and organization
 */

export { MediaController } from './media.controller';
export { FolderController } from './folder.controller';
export { MediaService } from './media.service';
export { FolderService } from './folder.service';
export { MediaRepository } from './media.repository';
export { FolderRepository } from './folder.repository';
export { StorageService } from './storage.service';
export { ImageProcessor } from './imageProcessor';

export { default as mediaRoutes } from './media.routes';
export { default as folderRoutes } from './folder.routes';

export * from './media.validation';
export * from './folder.validation';
