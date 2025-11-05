import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import { unifiedConfig } from '@/config/unifiedConfig';

export interface StorageConfig {
  provider: 'local' | 's3';
  local?: {
    uploadDir: string;
    baseUrl: string;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    cdnUrl?: string;
  };
}

export interface UploadResult {
  url: string;
  cdnUrl?: string;
  storageKey: string;
  storageProvider: string;
}

export class StorageService {
  private s3Client?: S3Client;
  private config: StorageConfig;

  constructor() {
    this.config = this.loadConfig();
    if (this.config.provider === 's3' && this.config.s3) {
      this.s3Client = new S3Client({
        region: this.config.s3.region,
        credentials: {
          accessKeyId: this.config.s3.accessKeyId,
          secretAccessKey: this.config.s3.secretAccessKey,
        },
      });
    }
  }

  private loadConfig(): StorageConfig {
    const provider = (unifiedConfig.storage?.provider || 'local') as 'local' | 's3';

    if (provider === 's3') {
      return {
        provider: 's3',
        s3: {
          bucket: unifiedConfig.storage?.s3?.bucket || '',
          region: unifiedConfig.storage?.s3?.region || 'us-east-1',
          accessKeyId: unifiedConfig.storage?.s3?.accessKeyId || '',
          secretAccessKey: unifiedConfig.storage?.s3?.secretAccessKey || '',
          cdnUrl: unifiedConfig.storage?.s3?.cdnUrl,
        },
      };
    }

    return {
      provider: 'local',
      local: {
        uploadDir: unifiedConfig.storage?.local?.uploadDir || './uploads',
        baseUrl: unifiedConfig.storage?.local?.baseUrl || 'http://vps-1a707765.vps.ovh.net/uploads',
      },
    };
  }

  /**
   * Upload file to storage
   */
  async uploadFile(
    filePath: string,
    destinationPath: string,
    mimeType: string,
    isPublic: boolean = true
  ): Promise<UploadResult> {
    try {
      if (this.config.provider === 's3') {
        return await this.uploadToS3(filePath, destinationPath, mimeType, isPublic);
      } else {
        return await this.uploadToLocal(filePath, destinationPath);
      }
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to upload file', { error, filePath, destinationPath });
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Upload to local storage
   */
  private async uploadToLocal(filePath: string, destinationPath: string): Promise<UploadResult> {
    if (!this.config.local) {
      throw new Error('Local storage configuration not found');
    }

    const fullDestPath = path.join(this.config.local.uploadDir, destinationPath);
    await fs.mkdir(path.dirname(fullDestPath), { recursive: true });
    await fs.copyFile(filePath, fullDestPath);

    const url = `${this.config.local.baseUrl}/${destinationPath.replace(/\\/g, '/')}`;

    logger.info('File uploaded to local storage', { filePath, destinationPath, url });

    return {
      url,
      storageKey: destinationPath,
      storageProvider: 'local',
    };
  }

  /**
   * Upload to S3
   */
  private async uploadToS3(
    filePath: string,
    destinationPath: string,
    mimeType: string,
    isPublic: boolean
  ): Promise<UploadResult> {
    if (!this.s3Client || !this.config.s3) {
      throw new Error('S3 storage configuration not found');
    }

    const fileContent = await fs.readFile(filePath);

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.config.s3.bucket,
        Key: destinationPath,
        Body: fileContent,
        ContentType: mimeType,
        ACL: isPublic ? 'public-read' : 'private',
      },
    });

    await upload.done();

    const url = `https://${this.config.s3.bucket}.s3.${this.config.s3.region}.amazonaws.com/${destinationPath}`;
    const cdnUrl = this.config.s3.cdnUrl ? `${this.config.s3.cdnUrl}/${destinationPath}` : undefined;

    logger.info('File uploaded to S3', { filePath, destinationPath, url, cdnUrl });

    return {
      url,
      cdnUrl,
      storageKey: destinationPath,
      storageProvider: 's3',
    };
  }

  /**
   * Delete file from storage
   */
  async deleteFile(storageKey: string, storageProvider: string): Promise<void> {
    try {
      if (storageProvider === 's3') {
        await this.deleteFromS3(storageKey);
      } else {
        await this.deleteFromLocal(storageKey);
      }
      logger.info('File deleted from storage', { storageKey, storageProvider });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to delete file', { error, storageKey, storageProvider });
      throw new Error('Failed to delete file from storage');
    }
  }

  /**
   * Delete from local storage
   */
  private async deleteFromLocal(storageKey: string): Promise<void> {
    if (!this.config.local) {
      throw new Error('Local storage configuration not found');
    }

    const fullPath = path.join(this.config.local.uploadDir, storageKey);
    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Delete from S3
   */
  private async deleteFromS3(storageKey: string): Promise<void> {
    if (!this.s3Client || !this.config.s3) {
      throw new Error('S3 storage configuration not found');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.config.s3.bucket,
      Key: storageKey,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generate unique filename
   */
  generateUniqueFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const nameWithoutExt = path.basename(originalFilename, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const uniqueId = uuidv4().split('-')[0];
    return `${sanitizedName}-${uniqueId}${ext}`;
  }

  /**
   * Get storage path for media type
   */
  getStoragePath(mediaType: string, filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `media/${mediaType}/${year}/${month}/${filename}`;
  }

  /**
   * Get thumbnail storage path
   */
  getThumbnailPath(mediaType: string, baseFilename: string, size: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `thumbnails/${mediaType}/${year}/${month}/${baseFilename}-${size}.jpg`;
  }
}
