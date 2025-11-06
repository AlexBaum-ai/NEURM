/**
 * Settings Helper Functions
 *
 * Utility functions for working with platform settings
 */

import type {
  PlatformSetting,
  UpdateSettingInput,
  SettingCategory,
  SettingType,
  BulkUpdateSettingsInput,
} from '../types/settings.types';

/**
 * Convert settings array to key-value object
 */
export const settingsArrayToObject = <T extends Record<string, any>>(
  settings: PlatformSetting[]
): T => {
  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as any) as T;
};

/**
 * Convert key-value object to settings array for update
 */
export const objectToSettingsArray = (
  obj: Record<string, any>,
  category: SettingCategory,
  existingSettings?: PlatformSetting[]
): UpdateSettingInput[] => {
  return Object.entries(obj).map(([key, value]) => {
    // Find existing setting to get type and description
    const existing = existingSettings?.find((s) => s.key === key);

    return {
      key,
      value,
      category,
      type: existing?.type || inferSettingType(value),
      description: existing?.description,
      isPublic: existing?.isPublic !== undefined ? existing.isPublic : false,
    };
  });
};

/**
 * Infer setting type from value
 */
const inferSettingType = (value: any): SettingType => {
  if (typeof value === 'string') return 'STRING' as SettingType;
  if (typeof value === 'number') return 'NUMBER' as SettingType;
  if (typeof value === 'boolean') return 'BOOLEAN' as SettingType;
  if (typeof value === 'object') return 'JSON' as SettingType;
  return 'STRING' as SettingType;
};

/**
 * Create bulk update input from changes
 */
export const createBulkUpdateInput = (
  changes: Record<string, any>,
  category: SettingCategory,
  existingSettings?: PlatformSetting[],
  reason?: string
): BulkUpdateSettingsInput => {
  return {
    settings: objectToSettingsArray(changes, category, existingSettings),
    reason,
  };
};

/**
 * Check if settings have unsaved changes
 */
export const hasUnsavedChanges = (
  original: Record<string, any>,
  current: Record<string, any>
): boolean => {
  const originalKeys = Object.keys(original).sort();
  const currentKeys = Object.keys(current).sort();

  // Check if keys are different
  if (originalKeys.length !== currentKeys.length) return true;
  if (!originalKeys.every((key, index) => key === currentKeys[index])) return true;

  // Check if values are different
  return originalKeys.some((key) => {
    const originalValue = original[key];
    const currentValue = current[key];

    // Handle arrays
    if (Array.isArray(originalValue) && Array.isArray(currentValue)) {
      return JSON.stringify(originalValue) !== JSON.stringify(currentValue);
    }

    // Handle objects
    if (
      typeof originalValue === 'object' &&
      originalValue !== null &&
      typeof currentValue === 'object' &&
      currentValue !== null
    ) {
      return JSON.stringify(originalValue) !== JSON.stringify(currentValue);
    }

    // Handle primitives
    return originalValue !== currentValue;
  });
};

/**
 * Get setting display name
 */
export const getSettingDisplayName = (key: string): string => {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format setting value for display
 */
export const formatSettingValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

/**
 * Group settings by category prefix (e.g., 'smtp_' -> SMTP)
 */
export const groupSettingsByPrefix = (
  settings: Record<string, any>
): Record<string, Record<string, any>> => {
  const groups: Record<string, Record<string, any>> = {};

  Object.entries(settings).forEach(([key, value]) => {
    const prefix = key.split('_')[0];
    if (!groups[prefix]) {
      groups[prefix] = {};
    }
    groups[prefix][key] = value;
  });

  return groups;
};
