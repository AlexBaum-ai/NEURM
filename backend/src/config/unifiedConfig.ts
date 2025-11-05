import env from './env';

/**
 * Unified configuration
 * Central configuration object that combines all environment variables
 */
export const unifiedConfig = {
  server: {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    apiUrl: env.API_URL,
    frontendUrl: env.FRONTEND_URL,
  },

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
  },

  oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackUrl: env.GOOGLE_CALLBACK_URL,
    },
    linkedin: {
      clientId: env.LINKEDIN_CLIENT_ID,
      clientSecret: env.LINKEDIN_CLIENT_SECRET,
      callbackUrl: env.LINKEDIN_CALLBACK_URL,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackUrl: env.GITHUB_CALLBACK_URL,
    },
  },

  email: {
    sendgridApiKey: env.SENDGRID_API_KEY,
    awsSes: {
      region: env.AWS_SES_REGION,
      accessKey: env.AWS_SES_ACCESS_KEY,
      secretKey: env.AWS_SES_SECRET_KEY,
    },
    fromEmail: env.FROM_EMAIL,
    supportEmail: env.SUPPORT_EMAIL,
  },

  storage: {
    provider: (env.AWS_S3_BUCKET ? 's3' : 'local') as 'local' | 's3',
    local: {
      uploadDir: './uploads',
      baseUrl: `http://vps-1a707765.vps.ovh.net:${env.PORT}/uploads`,
    },
    s3: {
      bucket: env.AWS_S3_BUCKET || '',
      region: env.AWS_REGION,
      accessKeyId: env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
      // CDN URL for Cloudflare/CloudFront - set env.CDN_URL to enable
      // Example: 'https://cdn.neurmatic.com' or 'https://d111111abcdef8.cloudfront.net'
      cdnUrl: env.CDN_URL || undefined,
    },
  },

  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    profilesSampleRate: env.SENTRY_PROFILES_SAMPLE_RATE,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    sessionSecret: env.SESSION_SECRET,
  },

  search: {
    elasticsearchNode: env.ELASTICSEARCH_NODE,
  },

  logging: {
    level: env.LOG_LEVEL,
  },
};

export type UnifiedConfig = typeof unifiedConfig;
