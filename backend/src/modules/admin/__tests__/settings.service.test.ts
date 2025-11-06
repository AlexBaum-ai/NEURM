/**
 * Settings Service Tests
 *
 * Unit tests for platform settings service
 */

import { SettingsService } from '../settings.service';
import { SettingsRepository } from '../settings.repository';
import { PrismaClient, SettingCategory, SettingType } from '@prisma/client';
import Redis from 'ioredis';
import { encrypt } from '@/utils/crypto';

// Mock dependencies
jest.mock('../settings.repository');
jest.mock('ioredis');
jest.mock('@/utils/crypto');
jest.mock('@/utils/logger');

describe('SettingsService', () => {
  let settingsService: SettingsService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockRedis: jest.Mocked<Redis>;
  let mockRepository: jest.Mocked<SettingsRepository>;

  beforeEach(() => {
    // Create mock instances
    mockPrisma = {} as jest.Mocked<PrismaClient>;
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    } as any;

    // Initialize service
    settingsService = new SettingsService(mockPrisma, mockRedis);

    // Get mock repository instance
    mockRepository = (settingsService as any).settingsRepo as jest.Mocked<SettingsRepository>;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getAllSettings', () => {
    it('should return settings from cache if available', async () => {
      // Arrange
      const cachedSettings = [
        {
          id: '1',
          key: 'platform_name',
          value: 'Neurmatic',
          category: SettingCategory.general,
          type: SettingType.string,
          description: 'Platform name',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedSettings));

      // Act
      const result = await settingsService.getAllSettings();

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith('platform_settings:all:false');
      expect(result).toEqual(cachedSettings);
      expect(mockRepository.getAllSettings).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      // Arrange
      const dbSettings = [
        {
          id: '1',
          key: 'platform_name',
          value: 'Neurmatic',
          category: SettingCategory.general,
          type: SettingType.string,
          description: 'Platform name',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRedis.get.mockResolvedValue(null);
      mockRepository.getAllSettings.mockResolvedValue(dbSettings);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await settingsService.getAllSettings();

      // Assert
      expect(mockRedis.get).toHaveBeenCalled();
      expect(mockRepository.getAllSettings).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalled();
      expect(result[0].key).toBe('platform_name');
      expect(result[0].value).toBe('Neurmatic');
    });

    it('should mask encrypted settings when includeEncrypted is false', async () => {
      // Arrange
      const dbSettings = [
        {
          id: '1',
          key: 'smtp_password',
          value: 'encrypted_value',
          category: SettingCategory.email,
          type: SettingType.encrypted,
          description: 'SMTP password',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRedis.get.mockResolvedValue(null);
      mockRepository.getAllSettings.mockResolvedValue(dbSettings);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await settingsService.getAllSettings(false);

      // Assert
      expect(result[0].value).toBe('***ENCRYPTED***');
    });
  });

  describe('getSetting', () => {
    it('should return a single setting by key', async () => {
      // Arrange
      const setting = {
        id: '1',
        key: 'platform_name',
        value: 'Neurmatic',
        category: SettingCategory.general,
        type: SettingType.string,
        description: 'Platform name',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRedis.get.mockResolvedValue(null);
      mockRepository.getSettingByKey.mockResolvedValue(setting);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await settingsService.getSetting('platform_name');

      // Assert
      expect(mockRepository.getSettingByKey).toHaveBeenCalledWith('platform_name');
      expect(result).toBeDefined();
      expect(result?.key).toBe('platform_name');
    });

    it('should return null if setting not found', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null);
      mockRepository.getSettingByKey.mockResolvedValue(null);

      // Act
      const result = await settingsService.getSetting('nonexistent_key');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateSetting', () => {
    it('should update an existing setting', async () => {
      // Arrange
      const adminId = 'admin-123';
      const existingSetting = {
        id: '1',
        key: 'platform_name',
        value: 'Old Name',
        category: SettingCategory.general,
        type: SettingType.string,
        description: 'Platform name',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedSetting = {
        ...existingSetting,
        value: 'New Name',
      };

      mockRepository.getSettingByKey.mockResolvedValue(existingSetting);
      mockRepository.upsertSetting.mockResolvedValue(updatedSetting);
      mockRepository.createAuditLog.mockResolvedValue({} as any);
      mockRedis.keys.mockResolvedValue([]);

      // Act
      const result = await settingsService.updateSetting(adminId, {
        key: 'platform_name',
        value: 'New Name',
        category: SettingCategory.general,
        type: SettingType.string,
      });

      // Assert
      expect(mockRepository.upsertSetting).toHaveBeenCalled();
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId,
          action: 'updated',
        })
      );
      expect(result.value).toBe('New Name');
    });

    it('should encrypt value for encrypted type settings', async () => {
      // Arrange
      const adminId = 'admin-123';
      const encryptedValue = 'encrypted:data';

      (encrypt as jest.Mock).mockReturnValue(encryptedValue);
      mockRepository.getSettingByKey.mockResolvedValue(null);
      mockRepository.upsertSetting.mockResolvedValue({
        id: '1',
        key: 'smtp_password',
        value: encryptedValue,
        category: SettingCategory.email,
        type: SettingType.encrypted,
        description: 'SMTP password',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockRepository.createAuditLog.mockResolvedValue({} as any);
      mockRedis.keys.mockResolvedValue([]);

      // Act
      await settingsService.updateSetting(adminId, {
        key: 'smtp_password',
        value: 'my_secret_password',
        category: SettingCategory.email,
        type: SettingType.encrypted,
      });

      // Assert
      expect(encrypt).toHaveBeenCalledWith('my_secret_password');
      expect(mockRepository.upsertSetting).toHaveBeenCalledWith(
        expect.objectContaining({
          value: encryptedValue,
        })
      );
    });
  });

  describe('deleteSetting', () => {
    it('should delete a setting and create audit log', async () => {
      // Arrange
      const adminId = 'admin-123';
      const key = 'test_setting';
      const setting = {
        id: '1',
        key,
        value: 'test_value',
        category: SettingCategory.general,
        type: SettingType.string,
        description: 'Test setting',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.getSettingByKey.mockResolvedValue(setting);
      mockRepository.createAuditLog.mockResolvedValue({} as any);
      mockRepository.deleteSetting.mockResolvedValue(setting);
      mockRedis.keys.mockResolvedValue([]);

      // Act
      await settingsService.deleteSetting(adminId, key, 'No longer needed');

      // Assert
      expect(mockRepository.getSettingByKey).toHaveBeenCalledWith(key);
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId,
          action: 'deleted',
          reason: 'No longer needed',
        })
      );
      expect(mockRepository.deleteSetting).toHaveBeenCalledWith(key);
    });
  });

  describe('getMaintenanceMode', () => {
    it('should return maintenance mode status', async () => {
      // Arrange
      const enabledSetting = {
        id: '1',
        key: 'maintenance_mode',
        value: 'true',
        category: SettingCategory.general,
        type: SettingType.boolean,
        description: 'Maintenance mode',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const messageSetting = {
        id: '2',
        key: 'maintenance_message',
        value: 'Under maintenance',
        category: SettingCategory.general,
        type: SettingType.string,
        description: 'Maintenance message',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRedis.get.mockResolvedValue(null);
      mockRepository.getSettingsByKeys.mockResolvedValue([enabledSetting, messageSetting]);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await settingsService.getMaintenanceMode();

      // Assert
      expect(result.enabled).toBe(true);
      expect(result.message).toBe('Under maintenance');
    });
  });

  describe('setMaintenanceMode', () => {
    it('should enable maintenance mode', async () => {
      // Arrange
      const adminId = 'admin-123';
      const input = {
        enabled: true,
        message: 'Scheduled maintenance',
        reason: 'System upgrade',
      };

      mockRepository.getSettingByKey.mockResolvedValue(null);
      mockRepository.upsertSetting.mockResolvedValue({} as any);
      mockRepository.createAuditLog.mockResolvedValue({} as any);
      mockRedis.keys.mockResolvedValue([]);
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await settingsService.setMaintenanceMode(adminId, input);

      // Assert
      expect(result.enabled).toBe(true);
      expect(result.message).toBe('Scheduled maintenance');
      expect(mockRepository.upsertSetting).toHaveBeenCalledTimes(2); // enabled + message
    });
  });

  describe('getPublicSettings', () => {
    it('should return only public settings', async () => {
      // Arrange
      const publicSettings = [
        {
          key: 'platform_name',
          value: 'Neurmatic',
          category: SettingCategory.general,
          type: SettingType.string,
          description: 'Platform name',
        },
        {
          key: 'default_language',
          value: 'en',
          category: SettingCategory.general,
          type: SettingType.string,
          description: 'Default language',
        },
      ];

      mockRedis.get.mockResolvedValue(null);
      mockRepository.getPublicSettings.mockResolvedValue(publicSettings);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await settingsService.getPublicSettings();

      // Assert
      expect(mockRepository.getPublicSettings).toHaveBeenCalled();
      expect(result).toHaveProperty('platform_name');
      expect(result).toHaveProperty('default_language');
    });
  });

  describe('bulkUpdateSettings', () => {
    it('should update multiple settings', async () => {
      // Arrange
      const adminId = 'admin-123';
      const input = {
        settings: [
          {
            key: 'setting1',
            value: 'value1',
            category: SettingCategory.general,
            type: SettingType.string,
          },
          {
            key: 'setting2',
            value: true,
            category: SettingCategory.features,
            type: SettingType.boolean,
          },
        ],
      };

      mockRepository.getSettingByKey.mockResolvedValue(null);
      mockRepository.upsertSetting.mockResolvedValue({} as any);
      mockRepository.createAuditLog.mockResolvedValue({} as any);
      mockRedis.keys.mockResolvedValue([]);

      // Act
      const result = await settingsService.bulkUpdateSettings(adminId, input);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockRepository.upsertSetting).toHaveBeenCalledTimes(2);
    });
  });
});
