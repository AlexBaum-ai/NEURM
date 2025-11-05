/**
 * Sentry Instrumentation
 * IMPORTANT: This file MUST be imported first before any other modules
 */
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import env from './config/env';

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    profilesSampleRate: env.SENTRY_PROFILES_SAMPLE_RATE,
    beforeSend(event, hint) {
      // Filter out 4xx errors except 401 and 403
      if (event.exception) {
        const error = hint.originalException as any;
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          if (error.statusCode !== 401 && error.statusCode !== 403) {
            return null;
          }
        }
      }
      return event;
    },
  });
}

export default Sentry;
