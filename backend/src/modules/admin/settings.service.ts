/**
 * Settings Service
 *
 * Business logic for platform settings with caching and encryption
 */

import { PrismaClient, SettingCategory, SettingType } from '@prisma/client';
import { Redis } from 'ioredis';
import * as Sentry from '@sentry/node';
import { SettingsRepository } from './settings.repository';
import { encrypt, decrypt } from '@/utils/crypto';
import { DecryptedSetting, SettingsGroup, MaintenanceMode } from './settings.types';
import {
  UpdateSettingInput,
  BulkUpdateSettingsInput,
  MaintenanceModeInput,
} from './settings.validation';
import logger from '@/utils/logger';
import { NotFoundError, BadRequestError } from '@/utils/errors';

export class SettingsService {
  private settingsRepo: SettingsRepository;
  private readonly CACHE_KEY_PREFIX = 'platform_settings:';
  private readonly CACHE_KEY_ALL = 'platform_settings:all';
  private readonly CACHE_KEY_PUBLIC = 'platform_settings:public';
  private readonly CACHE_KEY_MAINTENANCE = 'platform_settings:maintenance';
  private readonly CACHE_TTL = 3600; // 1 hour (updated on change)

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    this.settingsRepo = new SettingsRepository(prisma);
  }

  /**
   * Get all settings (admin only)
   */
  async getAllSettings(includeEncrypted: boolean = false): Promise<DecryptedSetting[]> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'SettingsService.getAllSettings',
    });

    try {
      // Try cache first
      const cacheKey = `${this.CACHE_KEY_ALL}:${includeEncrypted}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        logger.debug('Settings served from cache');
        transaction.finish();
        return JSON.parse(cached);
      }

      // Fetch from database
      const settings = await this.settingsRepo.getAllSettings();

      // Decrypt encrypted settings if requested
      const decryptedSettings = settings.map((setting) => {
        const decrypted: DecryptedSetting = {
          ...setting,
          value: this.deserializeValue(setting.value, setting.type),
          decrypted: false,
        };

        if (setting.type === 'encrypted' && includeEncrypted) {
          try {
            decrypted.value = decrypt(setting.value);
            decrypted.decrypted = true;
          } catch (error) {
            logger.error('Failed to decrypt setting', { key: setting.key, error });
            decrypted.value = '***ENCRYPTED***';
          }
        } else if (setting.type === 'encrypted') {
          decrypted.value = '***ENCRYPTED***';
        }

        return decrypted;
      });

      // Cache the result
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(decryptedSettings));

      transaction.finish();
      return decryptedSettings;
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Failed to get all settings', { error });
      throw error;
    }
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(
    category: SettingCategory,
    includeEncrypted: boolean = false
  ): Promise<DecryptedSetting[]> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}category:${category}:${includeEncrypted}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const settings = await this.settingsRepo.getSettingsByCategory(category);

      const decryptedSettings = settings.map((setting) => {
        const decrypted: DecryptedSetting = {
          ...setting,
          value: this.deserializeValue(setting.value, setting.type),
          decrypted: false,
        };

        if (setting.type === 'encrypted' && includeEncrypted) {
          try {
            decrypted.value = decrypt(setting.value);
            decrypted.decrypted = true;
          } catch (error) {
            logger.error('Failed to decrypt setting', { key: setting.key, error });
            decrypted.value = '***ENCRYPTED***';
          }
        } else if (setting.type === 'encrypted') {
          decrypted.value = '***ENCRYPTED***';
        }

        return decrypted;
      });

      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(decryptedSettings));

      return decryptedSettings;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get settings by category', { error, category });
      throw error;
    }
  }

  /**
   * Get a single setting by key
   */
  async getSetting(key: string, includeEncrypted: boolean = false): Promise<DecryptedSetting | null> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${key}:${includeEncrypted}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const setting = await this.settingsRepo.getSettingByKey(key);

      if (!setting) {
        return null;
      }

      const decrypted: DecryptedSetting = {
        ...setting,
        value: this.deserializeValue(setting.value, setting.type),
        decrypted: false,
      };

      if (setting.type === 'encrypted' && includeEncrypted) {
        try {
          decrypted.value = decrypt(setting.value);
          decrypted.decrypted = true;
        } catch (error) {
          logger.error('Failed to decrypt setting', { key: setting.key, error });
          decrypted.value = '***ENCRYPTED***';
        }
      } else if (setting.type === 'encrypted') {
        decrypted.value = '***ENCRYPTED***';
      }

      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(decrypted));

      return decrypted;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get setting', { error, key });
      throw error;
    }
  }

  /**
   * Update or create a setting
   */
  async updateSetting(
    adminId: string,
    input: UpdateSettingInput,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<DecryptedSetting> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'SettingsService.updateSetting',
    });

    try {
      // Get existing setting
      const existing = await this.settingsRepo.getSettingByKey(input.key);

      // Serialize and possibly encrypt the value
      let serializedValue = this.serializeValue(input.value, input.type);

      if (input.type === 'encrypted') {
        serializedValue = encrypt(serializedValue);
      }

      // Upsert the setting
      const updated = await this.settingsRepo.upsertSetting({
        key: input.key,
        value: serializedValue,
        category: input.category,
        type: input.type,
        description: input.description,
        isPublic: input.isPublic ?? false,
      });

      // Create audit log
      await this.settingsRepo.createAuditLog({
        settingId: updated.id,
        adminId,
        action: existing ? 'updated' : 'created',
        oldValue: existing?.value,
        newValue: serializedValue,
        reason: input.reason,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });

      // Invalidate cache
      await this.invalidateCache();

      logger.info('Setting updated', {
        key: input.key,
        action: existing ? 'updated' : 'created',
        adminId,
      });

      transaction.finish();

      // Return decrypted version
      return {
        ...updated,
        value: input.value,
        decrypted: input.type === 'encrypted',
      };
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error, {
        extra: { adminId, input },
      });
      logger.error('Failed to update setting', { error, adminId, input });
      throw error;
    }
  }

  /**
   * Bulk update settings
   */
  async bulkUpdateSettings(
    adminId: string,
    input: BulkUpdateSettingsInput,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<DecryptedSetting[]> {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'SettingsService.bulkUpdateSettings',
    });

    try {
      const updated: DecryptedSetting[] = [];

      // Process each setting
      for (const setting of input.settings) {
        const result = await this.updateSetting(
          adminId,
          { ...setting, reason: input.reason || setting.reason },
          metadata
        );
        updated.push(result);
      }

      logger.info('Bulk settings update completed', {
        count: updated.length,
        adminId,
      });

      transaction.finish();
      return updated;
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error, {
        extra: { adminId, input },
      });
      logger.error('Failed to bulk update settings', { error, adminId });
      throw error;
    }
  }

  /**
   * Delete a setting
   */
  async deleteSetting(
    adminId: string,
    key: string,
    reason?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    try {
      const setting = await this.settingsRepo.getSettingByKey(key);

      if (!setting) {
        throw new NotFoundError(`Setting with key '${key}' not found`);
      }

      // Create audit log before deletion
      await this.settingsRepo.createAuditLog({
        settingId: setting.id,
        adminId,
        action: 'deleted',
        oldValue: setting.value,
        reason,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });

      // Delete the setting
      await this.settingsRepo.deleteSetting(key);

      // Invalidate cache
      await this.invalidateCache();

      logger.info('Setting deleted', { key, adminId });
    } catch (error) {
      Sentry.captureException(error, {
        extra: { adminId, key },
      });
      logger.error('Failed to delete setting', { error, adminId, key });
      throw error;
    }
  }

  /**
   * Get public settings (for non-admin users)
   */
  async getPublicSettings(): Promise<Record<string, any>> {
    try {
      const cached = await this.redis.get(this.CACHE_KEY_PUBLIC);

      if (cached) {
        return JSON.parse(cached);
      }

      const settings = await this.settingsRepo.getPublicSettings();

      // Convert to key-value object
      const publicSettings: Record<string, any> = {};
      settings.forEach((setting) => {
        publicSettings[setting.key] = this.deserializeValue(setting.value, setting.type);
      });

      await this.redis.setex(this.CACHE_KEY_PUBLIC, this.CACHE_TTL, JSON.stringify(publicSettings));

      return publicSettings;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get public settings', { error });
      throw error;
    }
  }

  /**
   * Get maintenance mode status
   */
  async getMaintenanceMode(): Promise<MaintenanceMode> {
    try {
      const cached = await this.redis.get(this.CACHE_KEY_MAINTENANCE);

      if (cached) {
        return JSON.parse(cached);
      }

      const [enabledSetting, messageSetting] = await this.settingsRepo.getSettingsByKeys([
        'maintenance_mode',
        'maintenance_message',
      ]);

      const maintenanceMode: MaintenanceMode = {
        enabled: enabledSetting ? this.deserializeValue(enabledSetting.value, enabledSetting.type) as boolean : false,
        message: messageSetting ? this.deserializeValue(messageSetting.value, messageSetting.type) as string : undefined,
      };

      await this.redis.setex(this.CACHE_KEY_MAINTENANCE, 300, JSON.stringify(maintenanceMode)); // 5 min cache

      return maintenanceMode;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get maintenance mode', { error });
      throw error;
    }
  }

  /**
   * Set maintenance mode
   */
  async setMaintenanceMode(
    adminId: string,
    input: MaintenanceModeInput,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<MaintenanceMode> {
    try {
      // Update maintenance_mode setting
      await this.updateSetting(
        adminId,
        {
          key: 'maintenance_mode',
          value: input.enabled,
          category: 'general',
          type: 'boolean',
          description: 'Platform maintenance mode',
          isPublic: true,
          reason: input.reason || `Maintenance mode ${input.enabled ? 'enabled' : 'disabled'}`,
        },
        metadata
      );

      // Update maintenance_message if provided
      if (input.message !== undefined) {
        await this.updateSetting(
          adminId,
          {
            key: 'maintenance_message',
            value: input.message,
            category: 'general',
            type: 'string',
            description: 'Maintenance mode message',
            isPublic: true,
            reason: input.reason,
          },
          metadata
        );
      }

      // Invalidate maintenance mode cache
      await this.redis.del(this.CACHE_KEY_MAINTENANCE);

      logger.info('Maintenance mode updated', {
        enabled: input.enabled,
        adminId,
      });

      return {
        enabled: input.enabled,
        message: input.message,
      };
    } catch (error) {
      Sentry.captureException(error, {
        extra: { adminId, input },
      });
      logger.error('Failed to set maintenance mode', { error, adminId });
      throw error;
    }
  }

  /**
   * Get audit logs for a setting
   */
  async getAuditLogs(settingKey: string, limit: number = 50) {
    try {
      const setting = await this.settingsRepo.getSettingByKey(settingKey);

      if (!setting) {
        throw new NotFoundError(`Setting with key '${settingKey}' not found`);
      }

      return await this.settingsRepo.getAuditLogs(setting.id, limit);
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get audit logs', { error, settingKey });
      throw error;
    }
  }

  /**
   * Get all audit logs with pagination
   */
  async getAllAuditLogs(params: {
    page?: number;
    limit?: number;
    adminId?: string;
  }) {
    const { page = 1, limit = 50, adminId } = params;
    const skip = (page - 1) * limit;

    try {
      return await this.settingsRepo.getAllAuditLogs({
        skip,
        take: limit,
        adminId,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get all audit logs', { error, params });
      throw error;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Serialize value based on type
   */
  private serializeValue(
    value: string | number | boolean | Record<string, any>,
    type: SettingType
  ): string {
    switch (type) {
      case 'string':
      case 'encrypted':
        return String(value);
      case 'number':
        return String(value);
      case 'boolean':
        return String(value);
      case 'json':
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }

  /**
   * Deserialize value based on type
   */
  private deserializeValue(value: string, type: SettingType): any {
    switch (type) {
      case 'string':
      case 'encrypted':
        return value;
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Invalidate all settings cache
   */
  private async invalidateCache(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.CACHE_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      logger.debug('Settings cache invalidated');
    } catch (error) {
      logger.error('Failed to invalidate cache', { error });
      Sentry.captureException(error);
      // Don't throw - cache invalidation failure shouldn't break operations
    }
  }
}
