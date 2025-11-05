import * as Sentry from '@sentry/node';
import StorageService from './storage.service';
import ImageService from './image.service';
import UserRepository from '@/modules/users/users.repository';
import { generateFileName } from '@/config/upload';
import logger from '@/utils/logger';

/**
 * UploadService
 * Handles file uploads with image processing and storage
 */
export class UploadService {
  private storageService: StorageService;
  private imageService: ImageService;
  private userRepository: UserRepository;

  constructor(
    storageService?: StorageService,
    imageService?: ImageService,
    userRepository?: UserRepository
  ) {
    this.storageService = storageService || new StorageService();
    this.imageService = imageService || new ImageService();
    this.userRepository = userRepository || new UserRepository();
  }

  /**
   * Upload avatar image
   * Generates multiple sizes and uploads to S3/R2
   * Deletes old avatar images
   */
  async uploadAvatar(userId: string, buffer: Buffer): Promise<{
    avatarUrl: string;
    sizes: {
      thumbnail: string;
      small: string;
      medium: string;
      large: string;
    };
  }> {
    try {
      logger.info(`Uploading avatar for user ${userId}`);

      // Validate image
      const metadata = await this.imageService.validateImage(buffer);
      logger.info(`Avatar metadata: ${metadata.width}x${metadata.height}, ${metadata.format}`);

      // Get existing profile to delete old images
      const user = await this.userRepository.findById(userId);
      const oldAvatarUrl = user?.profile?.avatarUrl;

      // Generate multiple sizes
      const sizes = await this.imageService.generateAvatarSizes(buffer);

      // Upload all sizes to S3
      const uploadPromises = [
        {
          key: 'thumbnail',
          fileName: generateFileName(userId, 'avatar', 'thumbnail'),
          buffer: sizes.thumbnail,
        },
        {
          key: 'small',
          fileName: generateFileName(userId, 'avatar', 'small'),
          buffer: sizes.small,
        },
        {
          key: 'medium',
          fileName: generateFileName(userId, 'avatar', 'medium'),
          buffer: sizes.medium,
        },
        {
          key: 'large',
          fileName: generateFileName(userId, 'avatar', 'large'),
          buffer: sizes.large,
        },
      ];

      const uploadResults = await Promise.all(
        uploadPromises.map(({ fileName, buffer }) =>
          this.storageService.uploadFile(buffer, fileName, 'image/webp', {
            userId,
            type: 'avatar',
            uploadedAt: new Date().toISOString(),
          })
        )
      );

      const urls = {
        thumbnail: uploadResults[0],
        small: uploadResults[1],
        medium: uploadResults[2],
        large: uploadResults[3],
      };

      // Primary avatar URL is the large size
      const avatarUrl = urls.large;

      // Update user profile with new avatar URL
      await this.userRepository.updateProfile(userId, { avatarUrl });

      // Delete old avatar images (async, don't wait)
      if (oldAvatarUrl) {
        this.deleteOldImages(oldAvatarUrl, 'avatar').catch((error) => {
          logger.warn(`Failed to delete old avatar images for user ${userId}`, error);
        });
      }

      logger.info(`Avatar uploaded successfully for user ${userId}`);

      return {
        avatarUrl,
        sizes: urls,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UploadService', method: 'uploadAvatar' },
        extra: { userId },
      });
      logger.error(`Failed to upload avatar for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Upload cover image
   * Generates multiple sizes and uploads to S3/R2
   * Deletes old cover images
   */
  async uploadCover(userId: string, buffer: Buffer): Promise<{
    coverImageUrl: string;
    sizes: {
      small: string;
      medium: string;
      large: string;
    };
  }> {
    try {
      logger.info(`Uploading cover image for user ${userId}`);

      // Validate image
      const metadata = await this.imageService.validateImage(buffer);
      logger.info(`Cover metadata: ${metadata.width}x${metadata.height}, ${metadata.format}`);

      // Get existing profile to delete old images
      const user = await this.userRepository.findById(userId);
      const oldCoverUrl = user?.profile?.coverImageUrl;

      // Generate multiple sizes
      const sizes = await this.imageService.generateCoverSizes(buffer);

      // Upload all sizes to S3
      const uploadPromises = [
        {
          key: 'small',
          fileName: generateFileName(userId, 'cover', 'small'),
          buffer: sizes.small,
        },
        {
          key: 'medium',
          fileName: generateFileName(userId, 'cover', 'medium'),
          buffer: sizes.medium,
        },
        {
          key: 'large',
          fileName: generateFileName(userId, 'cover', 'large'),
          buffer: sizes.large,
        },
      ];

      const uploadResults = await Promise.all(
        uploadPromises.map(({ fileName, buffer }) =>
          this.storageService.uploadFile(buffer, fileName, 'image/webp', {
            userId,
            type: 'cover',
            uploadedAt: new Date().toISOString(),
          })
        )
      );

      const urls = {
        small: uploadResults[0],
        medium: uploadResults[1],
        large: uploadResults[2],
      };

      // Primary cover URL is the large size
      const coverImageUrl = urls.large;

      // Update user profile with new cover URL
      await this.userRepository.updateProfile(userId, { coverImageUrl });

      // Delete old cover images (async, don't wait)
      if (oldCoverUrl) {
        this.deleteOldImages(oldCoverUrl, 'cover').catch((error) => {
          logger.warn(`Failed to delete old cover images for user ${userId}`, error);
        });
      }

      logger.info(`Cover image uploaded successfully for user ${userId}`);

      return {
        coverImageUrl,
        sizes: urls,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'UploadService', method: 'uploadCover' },
        extra: { userId },
      });
      logger.error(`Failed to upload cover for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Delete old images from S3
   * Attempts to delete all sizes based on the primary URL
   */
  private async deleteOldImages(url: string, type: 'avatar' | 'cover'): Promise<void> {
    try {
      // Extract base key from URL
      const key = this.storageService.extractKeyFromUrl(url);
      if (!key) {
        logger.warn(`Could not extract S3 key from URL: ${url}`);
        return;
      }

      // Generate keys for all sizes
      const keysToDelete: string[] = [];

      if (type === 'avatar') {
        // Try to delete all avatar sizes
        ['thumbnail', 'small', 'medium', 'large'].forEach((size) => {
          const sizeKey = key.replace(/\/(avatar\/)/, `/$1${size}-`);
          keysToDelete.push(sizeKey);
        });
      } else if (type === 'cover') {
        // Try to delete all cover sizes
        ['small', 'medium', 'large'].forEach((size) => {
          const sizeKey = key.replace(/\/(cover\/)/, `/$1${size}-`);
          keysToDelete.push(sizeKey);
        });
      }

      // Also delete the primary image
      keysToDelete.push(key);

      await this.storageService.deleteFiles(keysToDelete);
    } catch (error) {
      logger.warn(`Failed to delete old images for URL: ${url}`, error);
      // Don't throw - this is a cleanup operation
    }
  }

  /**
   * Validate upload rate limit
   * Check if user has exceeded upload limit (5 uploads per hour)
   */
  async validateUploadRateLimit(userId: string): Promise<void> {
    // This will be implemented with Redis in the middleware
    // For now, just a placeholder
    logger.info(`Validating upload rate limit for user ${userId}`);
  }
}

export default UploadService;
