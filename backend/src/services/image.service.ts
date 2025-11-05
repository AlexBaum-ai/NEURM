import sharp from 'sharp';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import { InternalServerError } from '@/utils/errors';
import { IMAGE_SIZES } from '@/config/upload';

/**
 * ImageService
 * Handles image processing, optimization, and thumbnail generation
 */
export class ImageService {
  /**
   * Process and optimize an image
   * @param buffer Original image buffer
   * @param width Target width
   * @param height Target height
   * @param quality WebP quality (1-100)
   * @returns Optimized image buffer
   */
  async processImage(
    buffer: Buffer,
    width: number,
    height: number,
    quality: number = 85
  ): Promise<Buffer> {
    try {
      logger.info(`Processing image: ${width}x${height} at quality ${quality}`);

      const processedBuffer = await sharp(buffer)
        .resize(width, height, {
          fit: 'cover', // Cover entire area, crop if necessary
          position: 'center', // Center the crop
        })
        .webp({ quality }) // Convert to WebP format
        .toBuffer();

      logger.info(
        `Image processed successfully: ${buffer.length} bytes -> ${processedBuffer.length} bytes`
      );

      return processedBuffer;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ImageService', method: 'processImage' },
        extra: { width, height, quality },
      });
      logger.error('Failed to process image', error);
      throw new InternalServerError('Failed to process image');
    }
  }

  /**
   * Generate multiple avatar sizes
   * @param buffer Original image buffer
   * @returns Object containing buffers for all avatar sizes
   */
  async generateAvatarSizes(buffer: Buffer): Promise<{
    thumbnail: Buffer;
    small: Buffer;
    medium: Buffer;
    large: Buffer;
  }> {
    try {
      logger.info('Generating avatar sizes');

      const [thumbnail, small, medium, large] = await Promise.all([
        this.processImage(
          buffer,
          IMAGE_SIZES.AVATAR.THUMBNAIL.width,
          IMAGE_SIZES.AVATAR.THUMBNAIL.height,
          80
        ),
        this.processImage(
          buffer,
          IMAGE_SIZES.AVATAR.SMALL.width,
          IMAGE_SIZES.AVATAR.SMALL.height,
          80
        ),
        this.processImage(
          buffer,
          IMAGE_SIZES.AVATAR.MEDIUM.width,
          IMAGE_SIZES.AVATAR.MEDIUM.height,
          85
        ),
        this.processImage(
          buffer,
          IMAGE_SIZES.AVATAR.LARGE.width,
          IMAGE_SIZES.AVATAR.LARGE.height,
          90
        ),
      ]);

      return { thumbnail, small, medium, large };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ImageService', method: 'generateAvatarSizes' },
      });
      logger.error('Failed to generate avatar sizes', error);
      throw new InternalServerError('Failed to generate avatar sizes');
    }
  }

  /**
   * Generate multiple cover image sizes
   * @param buffer Original image buffer
   * @returns Object containing buffers for all cover sizes
   */
  async generateCoverSizes(buffer: Buffer): Promise<{
    small: Buffer;
    medium: Buffer;
    large: Buffer;
  }> {
    try {
      logger.info('Generating cover image sizes');

      const [small, medium, large] = await Promise.all([
        this.processImage(
          buffer,
          IMAGE_SIZES.COVER.SMALL.width,
          IMAGE_SIZES.COVER.SMALL.height,
          80
        ),
        this.processImage(
          buffer,
          IMAGE_SIZES.COVER.MEDIUM.width,
          IMAGE_SIZES.COVER.MEDIUM.height,
          85
        ),
        this.processImage(
          buffer,
          IMAGE_SIZES.COVER.LARGE.width,
          IMAGE_SIZES.COVER.LARGE.height,
          90
        ),
      ]);

      return { small, medium, large };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ImageService', method: 'generateCoverSizes' },
      });
      logger.error('Failed to generate cover image sizes', error);
      throw new InternalServerError('Failed to generate cover image sizes');
    }
  }

  /**
   * Validate image dimensions and format
   * @param buffer Image buffer
   * @returns Image metadata
   */
  async validateImage(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    try {
      const metadata = await sharp(buffer).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: buffer.length,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ImageService', method: 'validateImage' },
      });
      logger.error('Failed to validate image', error);
      throw new InternalServerError('Failed to validate image');
    }
  }

  /**
   * Extract dominant color from image
   * @param buffer Image buffer
   * @returns Hex color code
   */
  async extractDominantColor(buffer: Buffer): Promise<string> {
    try {
      const { dominant } = await sharp(buffer).stats();

      // Convert RGB to hex
      const r = Math.round(dominant.r).toString(16).padStart(2, '0');
      const g = Math.round(dominant.g).toString(16).padStart(2, '0');
      const b = Math.round(dominant.b).toString(16).padStart(2, '0');

      return `#${r}${g}${b}`;
    } catch (error) {
      logger.warn('Failed to extract dominant color, using default', error);
      return '#cccccc'; // Default gray
    }
  }
}

export default ImageService;
