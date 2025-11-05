/**
 * Sentry Helper Utilities
 * Convenience functions for common Sentry operations
 */
import { setSentryUser, addSentryBreadcrumb, captureException, captureMessage } from './sentry';
import type { User } from '@/types/user';

/**
 * Update Sentry user context when user logs in/out
 * Should be called from auth store
 */
export function updateSentryUserContext(user: User | null) {
  if (user) {
    setSentryUser({
      id: user.id,
      username: user.username,
      email: user.email,
    });
    addSentryBreadcrumb('User logged in', 'auth', 'info', {
      userId: user.id,
      username: user.username,
    });
  } else {
    setSentryUser(null);
    addSentryBreadcrumb('User logged out', 'auth', 'info');
  }
}

/**
 * Track navigation events in Sentry
 */
export function trackNavigation(from: string, to: string) {
  addSentryBreadcrumb('Navigation', 'navigation', 'info', {
    from,
    to,
  });
}

/**
 * Track API errors
 */
export function trackAPIError(error: Error, endpoint: string, method: string) {
  addSentryBreadcrumb('API Error', 'api', 'error', {
    endpoint,
    method,
    error: error.message,
  });
  captureException(error, {
    endpoint,
    method,
  });
}

/**
 * Track successful API calls (optional, for debugging)
 */
export function trackAPISuccess(endpoint: string, method: string, statusCode: number) {
  addSentryBreadcrumb('API Success', 'api', 'info', {
    endpoint,
    method,
    statusCode,
  });
}

/**
 * Track user actions
 */
export function trackUserAction(action: string, data?: Record<string, any>) {
  addSentryBreadcrumb('User Action', 'user', 'info', {
    action,
    ...data,
  });
}

/**
 * Track form submissions
 */
export function trackFormSubmit(formName: string, success: boolean, error?: string) {
  addSentryBreadcrumb('Form Submit', 'form', success ? 'info' : 'warning', {
    formName,
    success,
    error,
  });
}

/**
 * Track performance issues
 */
export function trackPerformanceIssue(issue: string, duration: number, threshold: number) {
  if (duration > threshold) {
    captureMessage(`Performance issue: ${issue}`, 'warning', {
      duration,
      threshold,
      issue,
    });
  }
}

export {
  setSentryUser,
  addSentryBreadcrumb,
  captureException,
  captureMessage,
};
