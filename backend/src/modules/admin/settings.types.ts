/**
 * Settings Types
 *
 * TypeScript types for platform settings
 */

import { SettingCategory, SettingType, PlatformSetting } from '@prisma/client';

export interface SettingValue {
  key: string;
  value: string | number | boolean | Record<string, any>;
  category: SettingCategory;
  type: SettingType;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecryptedSetting extends Omit<PlatformSetting, 'value'> {
  value: string | number | boolean | Record<string, any>;
  decrypted?: boolean;
}

export interface SettingsGroup {
  category: SettingCategory;
  settings: DecryptedSetting[];
}

export interface SettingAuditLog {
  id: string;
  settingId: string;
  adminId: string;
  action: 'created' | 'updated' | 'deleted';
  oldValue?: string;
  newValue?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface MaintenanceMode {
  enabled: boolean;
  message?: string;
}

export interface SettingsCache {
  [key: string]: any;
}
