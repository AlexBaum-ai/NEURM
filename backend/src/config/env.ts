import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  API_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),

  // OAuth - Google
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  // OAuth - LinkedIn
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CALLBACK_URL: z.string().url().optional(),

  // OAuth - GitHub
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),

  // Email
  SENDGRID_API_KEY: z.string().optional(),
  AWS_SES_REGION: z.string().optional(),
  AWS_SES_ACCESS_KEY: z.string().optional(),
  AWS_SES_SECRET_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().default('noreply@neurmatic.com'),
  SUPPORT_EMAIL: z.string().email().default('support@neurmatic.com'),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default('eu-west-1'),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),
  SENTRY_TRACES_SAMPLE_RATE: z.string().default('1.0').transform(Number),
  SENTRY_PROFILES_SAMPLE_RATE: z.string().default('1.0').transform(Number),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // Security
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  SESSION_SECRET: z.string().min(32).optional(),

  // Search
  ELASTICSEARCH_NODE: z.string().url().optional(),

  // Other
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Environment validation failed:');
    error.issues.forEach((err: z.ZodIssue) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export default env;

// Type export for use in other files
export type Env = z.infer<typeof envSchema>;
