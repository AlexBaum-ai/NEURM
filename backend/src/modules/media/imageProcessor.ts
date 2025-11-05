import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';

export interface ThumbnailSize {
  name: 'sm' | 'md' | 'lg';
  width: number;
  height: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ProcessedImage {
  path: string;
  metadata: ImageMetadata;
}

export interface ThumbnailResult {
  size: 'sm' | 'md' | 'lg';
  path: string;
  width: number;
  height: number;
  fileSize: number;
}

export class ImageProcessor {
  private static readonly THUMBNAIL_SIZES: ThumbnailSize[] = [
    { name: 'sm', width: 150, height: 150 },
    { name: 'md', width: 300, height: 300 },
    { name: 'lg', width: 600, height: 600 },
  ];

  private static readonly ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Validate image file
   */
  static async validateImage(filePath: string, fileSize: number): Promise<void> {
    if (fileSize > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    try {
      const metadata = await sharp(filePath).metadata();
      const format = metadata.format?.toLowerCase();

      if (!format || !this.ALLOWED_FORMATS.includes(format)) {
        throw new Error(`Unsupported image format: ${format}. Allowed formats: ${this.ALLOWED_FORMATS.join(', ')}`);
      }
    } catch (error) {
      Sentry.captureException(error);
      throw new Error('Invalid image file');
    }
  }

  /**
   * Get image metadata
   */
  static async getMetadata(filePath: string): Promise<ImageMetadata> {
    try {
      const metadata = await sharp(filePath).metadata();
      const stats = await fs.stat(filePath);

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: stats.size,
      };
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get image metadata', { error, filePath });
      throw new Error('Failed to read image metadata');
    }
  }

  /**
   * Optimize image (compress and convert if needed)
   */
  static async optimizeImage(inputPath: string, outputPath: string, quality: number = 85): Promise<ProcessedImage> {
    try {
      const metadata = await sharp(inputPath).metadata();
      const format = metadata.format?.toLowerCase();

      let pipeline = sharp(inputPath);

      // Convert to WebP for better compression, or keep original format
      if (format === 'jpeg' || format === 'jpg') {
        pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
      } else if (format === 'png') {
        pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      }

      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Save optimized image
      await pipeline.toFile(outputPath);

      // Get metadata of optimized image
      const optimizedMetadata = await this.getMetadata(outputPath);

      logger.info('Image optimized successfully', {
        inputPath,
        outputPath,
        originalSize: metadata.size,
        optimizedSize: optimizedMetadata.size,
      });

      return {
        path: outputPath,
        metadata: optimizedMetadata,
      };
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to optimize image', { error, inputPath, outputPath });
      throw new Error('Failed to optimize image');
    }
  }

  /**
   * Generate thumbnails for an image
   */
  static async generateThumbnails(
    inputPath: string,
    outputDir: string,
    baseFilename: string
  ): Promise<ThumbnailResult[]> {
    try {
      const results: ThumbnailResult[] = [];

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      for (const size of this.THUMBNAIL_SIZES) {
        const outputPath = path.join(outputDir, `${baseFilename}-${size.name}.jpg`);

        await sharp(inputPath)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 85, progressive: true })
          .toFile(outputPath);

        const stats = await fs.stat(outputPath);
        const metadata = await sharp(outputPath).metadata();

        results.push({
          size: size.name,
          path: outputPath,
          width: metadata.width || size.width,
          height: metadata.height || size.height,
          fileSize: stats.size,
        });

        logger.info('Thumbnail generated', {
          size: size.name,
          outputPath,
          fileSize: stats.size,
        });
      }

      return results;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to generate thumbnails', { error, inputPath, outputDir });
      throw new Error('Failed to generate thumbnails');
    }
  }

  /**
   * Resize image to specific dimensions
   */
  static async resizeImage(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number,
    fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' = 'cover'
  ): Promise<ProcessedImage> {
    try {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      await sharp(inputPath)
        .resize(width, height, { fit })
        .jpeg({ quality: 85, progressive: true })
        .toFile(outputPath);

      const metadata = await this.getMetadata(outputPath);

      return {
        path: outputPath,
        metadata,
      };
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to resize image', { error, inputPath, outputPath });
      throw new Error('Failed to resize image');
    }
  }

  /**
   * Convert image to WebP format
   */
  static async convertToWebP(inputPath: string, outputPath: string, quality: number = 85): Promise<ProcessedImage> {
    try {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      await sharp(inputPath).webp({ quality }).toFile(outputPath);

      const metadata = await this.getMetadata(outputPath);

      return {
        path: outputPath,
        metadata,
      };
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to convert image to WebP', { error, inputPath, outputPath });
      throw new Error('Failed to convert image to WebP');
    }
  }
}
