/**
 * Platform Settings Seed
 *
 * Seeds default platform settings
 */

import { PrismaClient, SettingCategory, SettingType } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

const defaultSettings = [
  // General settings
  {
    key: 'platform_name',
    value: 'Neurmatic',
    category: SettingCategory.general,
    type: SettingType.string,
    description: 'Platform name',
    isPublic: true,
  },
  {
    key: 'tagline',
    value: 'The LLM Community Hub',
    category: SettingCategory.general,
    type: SettingType.string,
    description: 'Platform tagline',
    isPublic: true,
  },
  {
    key: 'default_language',
    value: 'en',
    category: SettingCategory.general,
    type: SettingType.string,
    description: 'Default platform language',
    isPublic: true,
  },
  {
    key: 'timezone',
    value: 'UTC',
    category: SettingCategory.general,
    type: SettingType.string,
    description: 'Default timezone',
    isPublic: true,
  },
  {
    key: 'maintenance_mode',
    value: 'false',
    category: SettingCategory.general,
    type: SettingType.boolean,
    description: 'Platform maintenance mode',
    isPublic: true,
  },

  // Feature flags
  {
    key: 'forum_enabled',
    value: 'true',
    category: SettingCategory.features,
    type: SettingType.boolean,
    description: 'Enable forum module',
    isPublic: true,
  },
  {
    key: 'jobs_enabled',
    value: 'true',
    category: SettingCategory.features,
    type: SettingType.boolean,
    description: 'Enable jobs module',
    isPublic: true,
  },
  {
    key: 'llm_guide_enabled',
    value: 'true',
    category: SettingCategory.features,
    type: SettingType.boolean,
    description: 'Enable LLM guide module',
    isPublic: true,
  },
  {
    key: 'messaging_enabled',
    value: 'true',
    category: SettingCategory.features,
    type: SettingType.boolean,
    description: 'Enable messaging',
    isPublic: true,
  },
  {
    key: 'notifications_enabled',
    value: 'true',
    category: SettingCategory.features,
    type: SettingType.boolean,
    description: 'Enable notifications',
    isPublic: true,
  },
  {
    key: 'search_enabled',
    value: 'true',
    category: SettingCategory.features,
    type: SettingType.boolean,
    description: 'Enable search',
    isPublic: true,
  },

  // Integration settings
  {
    key: 'google_oauth_enabled',
    value: 'true',
    category: SettingCategory.integrations,
    type: SettingType.boolean,
    description: 'Enable Google OAuth',
    isPublic: true,
  },
  {
    key: 'linkedin_oauth_enabled',
    value: 'true',
    category: SettingCategory.integrations,
    type: SettingType.boolean,
    description: 'Enable LinkedIn OAuth',
    isPublic: true,
  },
  {
    key: 'github_oauth_enabled',
    value: 'true',
    category: SettingCategory.integrations,
    type: SettingType.boolean,
    description: 'Enable GitHub OAuth',
    isPublic: true,
  },
  {
    key: 'cdn_enabled',
    value: 'false',
    category: SettingCategory.integrations,
    type: SettingType.boolean,
    description: 'Enable CDN for media',
    isPublic: false,
  },
  {
    key: 'email_service',
    value: 'sendgrid',
    category: SettingCategory.integrations,
    type: SettingType.string,
    description: 'Email service provider (sendgrid or aws_ses)',
    isPublic: false,
  },

  // Security settings
  {
    key: 'rate_limit_enabled',
    value: 'true',
    category: SettingCategory.security,
    type: SettingType.boolean,
    description: 'Enable rate limiting',
    isPublic: false,
  },
  {
    key: 'rate_limit_window_ms',
    value: '900000',
    category: SettingCategory.security,
    type: SettingType.number,
    description: 'Rate limit window in milliseconds (default: 15 minutes)',
    isPublic: false,
  },
  {
    key: 'rate_limit_max_requests',
    value: '100',
    category: SettingCategory.security,
    type: SettingType.number,
    description: 'Max requests per window',
    isPublic: false,
  },
  {
    key: 'session_timeout_minutes',
    value: '1440',
    category: SettingCategory.security,
    type: SettingType.number,
    description: 'Session timeout in minutes (default: 24 hours)',
    isPublic: false,
  },
  {
    key: 'two_factor_enforcement',
    value: 'none',
    category: SettingCategory.security,
    type: SettingType.string,
    description: '2FA enforcement level (none, admin, all)',
    isPublic: false,
  },
  {
    key: 'captcha_enabled',
    value: 'false',
    category: SettingCategory.security,
    type: SettingType.boolean,
    description: 'Enable CAPTCHA verification',
    isPublic: true,
  },
  {
    key: 'password_min_length',
    value: '8',
    category: SettingCategory.security,
    type: SettingType.number,
    description: 'Minimum password length',
    isPublic: true,
  },
  {
    key: 'password_require_uppercase',
    value: 'true',
    category: SettingCategory.security,
    type: SettingType.boolean,
    description: 'Require uppercase letters in password',
    isPublic: true,
  },
  {
    key: 'password_require_lowercase',
    value: 'true',
    category: SettingCategory.security,
    type: SettingType.boolean,
    description: 'Require lowercase letters in password',
    isPublic: true,
  },
  {
    key: 'password_require_numbers',
    value: 'true',
    category: SettingCategory.security,
    type: SettingType.boolean,
    description: 'Require numbers in password',
    isPublic: true,
  },
  {
    key: 'password_require_special',
    value: 'false',
    category: SettingCategory.security,
    type: SettingType.boolean,
    description: 'Require special characters in password',
    isPublic: true,
  },

  // Email settings
  {
    key: 'notification_email_enabled',
    value: 'true',
    category: SettingCategory.email,
    type: SettingType.boolean,
    description: 'Enable email notifications',
    isPublic: false,
  },
  {
    key: 'digest_email_enabled',
    value: 'true',
    category: SettingCategory.email,
    type: SettingType.boolean,
    description: 'Enable digest emails',
    isPublic: false,
  },
  {
    key: 'digest_frequency',
    value: 'weekly',
    category: SettingCategory.email,
    type: SettingType.string,
    description: 'Digest email frequency (daily, weekly, monthly)',
    isPublic: false,
  },
];

export async function seedPlatformSettings() {
  try {
    logger.info('Seeding platform settings...');

    let created = 0;
    let skipped = 0;

    for (const setting of defaultSettings) {
      const existing = await prisma.platformSetting.findUnique({
        where: { key: setting.key },
      });

      if (existing) {
        logger.info(`Setting '${setting.key}' already exists, skipping`);
        skipped++;
      } else {
        await prisma.platformSetting.create({
          data: setting,
        });
        logger.info(`Created setting: ${setting.key}`);
        created++;
      }
    }

    logger.info(
      `Platform settings seed completed: ${created} created, ${skipped} skipped`
    );
  } catch (error) {
    logger.error('Failed to seed platform settings:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedPlatformSettings()
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
