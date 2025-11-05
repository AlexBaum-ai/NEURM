import {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as Sentry from '@sentry/node';
import env from '@/config/env';
import logger from '@/utils/logger';
import { InternalServerError } from '@/utils/errors';

/**
 * StorageService
 * Handles file uploads to AWS S3 or CloudFlare R2
 */
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private cdnUrl?: string;

  constructor() {
    // Initialize S3 client (works with both AWS S3 and CloudFlare R2)
    this.s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    this.bucket = env.AWS_S3_BUCKET || 'neurmatic-media';

    // Optional CDN URL for faster delivery
    // For CloudFlare R2, this would be: https://pub-xxxxx.r2.dev
    // For AWS S3 with CloudFront, this would be the CloudFront domain
    this.cdnUrl = process.env.CDN_URL;
  }

  /**
   * Upload a file to S3/R2
   * @param buffer File buffer
   * @param key S3 object key (path)
   * @param contentType MIME type
   * @param metadata Optional metadata
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      logger.info(`Uploading file to S3: ${key}`);

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000', // 1 year cache
          Metadata: metadata,
        },
      });

      await upload.done();

      const fileUrl = this.getPublicUrl(key);

      logger.info(`File uploaded successfully: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'StorageService', method: 'uploadFile' },
        extra: { key, contentType },
      });
      logger.error(`Failed to upload file to S3: ${key}`, error);
      throw new InternalServerError('Failed to upload file');
    }
  }

  /**
   * Delete a file from S3/R2
   * @param key S3 object key (path)
   */
  async deleteFile(key: string): Promise<void> {
    try {
      logger.info(`Deleting file from S3: ${key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      logger.info(`File deleted successfully: ${key}`);
    } catch (error) {
      // Log error but don't throw - old files might not exist
      Sentry.captureException(error, {
        tags: { service: 'StorageService', method: 'deleteFile' },
        extra: { key },
      });
      logger.warn(`Failed to delete file from S3: ${key}`, error);
    }
  }

  /**
   * Delete multiple files from S3/R2
   * @param keys Array of S3 object keys
   */
  async deleteFiles(keys: string[]): Promise<void> {
    try {
      logger.info(`Deleting ${keys.length} files from S3`);

      const deletePromises = keys.map((key) => this.deleteFile(key));
      await Promise.allSettled(deletePromises);

      logger.info(`Batch delete completed for ${keys.length} files`);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'StorageService', method: 'deleteFiles' },
        extra: { keys },
      });
      logger.error('Failed to delete files from S3', error);
    }
  }

  /**
   * Check if a file exists in S3/R2
   * @param key S3 object key
   * @returns true if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get public URL for a file
   * @param key S3 object key
   * @returns Public URL (CDN if configured, otherwise S3)
   */
  getPublicUrl(key: string): string {
    if (this.cdnUrl) {
      // Use CDN URL if configured
      return `${this.cdnUrl}/${key}`;
    }

    // Default to S3 public URL
    return `https://${this.bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Extract S3 key from URL
   * @param url Full URL
   * @returns S3 key or null if not a valid S3 URL
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      // Handle CDN URLs
      if (this.cdnUrl && url.startsWith(this.cdnUrl)) {
        return url.replace(`${this.cdnUrl}/`, '');
      }

      // Handle S3 URLs
      const s3Pattern = new RegExp(
        `https://${this.bucket}\\.s3\\.${env.AWS_REGION}\\.amazonaws\\.com/(.+)`
      );
      const match = url.match(s3Pattern);

      return match ? match[1] : null;
    } catch (error) {
      logger.warn(`Failed to extract S3 key from URL: ${url}`, error);
      return null;
    }
  }
}

export default StorageService;
