/**
 * Jest Test Setup
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/neurmatic_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_min_32_characters_long';

// Mock Sentry
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  Handlers: {
    requestHandler: jest.fn(() => (_req: any, _res: any, next: any) => next()),
    tracingHandler: jest.fn(() => (_req: any, _res: any, next: any) => next()),
    errorHandler: jest.fn(() => (err: any, _req: any, _res: any, next: any) => next(err)),
  },
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  startTransaction: jest.fn(() => ({ finish: jest.fn() })),
}));

// Global test timeout
jest.setTimeout(10000);
