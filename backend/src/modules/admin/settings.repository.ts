/**
 * Settings Repository
 *
 * Data access layer for platform settings
 */

import { PrismaClient, SettingCategory, SettingType } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';

export class SettingsRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all settings
   */
  async getAllSettings() {
    try {
      return await this.prisma.platformSetting.findMany({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get all settings', { error });
      throw error;
    }
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: SettingCategory) {
    try {
      return await this.prisma.platformSetting.findMany({
        where: { category },
        orderBy: { key: 'asc' },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get settings by category', { error, category });
      throw error;
    }
  }

  /**
   * Get a single setting by key
   */
  async getSettingByKey(key: string) {
    try {
      return await this.prisma.platformSetting.findUnique({
        where: { key },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get setting by key', { error, key });
      throw error;
    }
  }

  /**
   * Get multiple settings by keys
   */
  async getSettingsByKeys(keys: string[]) {
    try {
      return await this.prisma.platformSetting.findMany({
        where: {
          key: { in: keys },
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get settings by keys', { error, keys });
      throw error;
    }
  }

  /**
   * Create a new setting
   */
  async createSetting(data: {
    key: string;
    value: string;
    category: SettingCategory;
    type: SettingType;
    description?: string;
    isPublic?: boolean;
  }) {
    try {
      return await this.prisma.platformSetting.create({
        data: {
          key: data.key,
          value: data.value,
          category: data.category,
          type: data.type,
          description: data.description,
          isPublic: data.isPublic ?? false,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to create setting', { error, data });
      throw error;
    }
  }

  /**
   * Update an existing setting
   */
  async updateSetting(
    key: string,
    data: {
      value?: string;
      category?: SettingCategory;
      type?: SettingType;
      description?: string;
      isPublic?: boolean;
    }
  ) {
    try {
      return await this.prisma.platformSetting.update({
        where: { key },
        data,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to update setting', { error, key, data });
      throw error;
    }
  }

  /**
   * Upsert a setting (create or update)
   */
  async upsertSetting(data: {
    key: string;
    value: string;
    category: SettingCategory;
    type: SettingType;
    description?: string;
    isPublic?: boolean;
  }) {
    try {
      return await this.prisma.platformSetting.upsert({
        where: { key: data.key },
        create: data,
        update: {
          value: data.value,
          category: data.category,
          type: data.type,
          description: data.description,
          isPublic: data.isPublic,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to upsert setting', { error, data });
      throw error;
    }
  }

  /**
   * Delete a setting
   */
  async deleteSetting(key: string) {
    try {
      return await this.prisma.platformSetting.delete({
        where: { key },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to delete setting', { error, key });
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(data: {
    settingId: string;
    adminId: string;
    action: string;
    oldValue?: string;
    newValue?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await this.prisma.platformSettingAuditLog.create({
        data,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to create audit log', { error, data });
      throw error;
    }
  }

  /**
   * Get audit logs for a setting
   */
  async getAuditLogs(settingId: string, limit: number = 50) {
    try {
      return await this.prisma.platformSettingAuditLog.findMany({
        where: { settingId },
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get audit logs', { error, settingId });
      throw error;
    }
  }

  /**
   * Get all audit logs with pagination
   */
  async getAllAuditLogs(params: {
    skip?: number;
    take?: number;
    adminId?: string;
  }) {
    const { skip = 0, take = 50, adminId } = params;

    try {
      const where = adminId ? { adminId } : {};

      const [logs, total] = await Promise.all([
        this.prisma.platformSettingAuditLog.findMany({
          where,
          include: {
            admin: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
            setting: {
              select: {
                key: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        this.prisma.platformSettingAuditLog.count({ where }),
      ]);

      return {
        logs,
        total,
        hasMore: skip + take < total,
      };
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get all audit logs', { error, params });
      throw error;
    }
  }

  /**
   * Get public settings (non-encrypted, public flag set)
   */
  async getPublicSettings() {
    try {
      return await this.prisma.platformSetting.findMany({
        where: {
          isPublic: true,
          type: { not: 'encrypted' },
        },
        select: {
          key: true,
          value: true,
          category: true,
          type: true,
          description: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Failed to get public settings', { error });
      throw error;
    }
  }
}
