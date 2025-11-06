import jwt from 'jsonwebtoken';
import env from '@/config/env';

/**
 * Test Helpers
 *
 * Utility functions for testing
 */

/**
 * Generate a test JWT token for authentication
 */
export function generateTestToken(userId: string): string {
  return jwt.sign(
    { userId },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Create a mock user object for testing
 */
export function createMockUser(overrides: any = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user',
    status: 'active',
    ...overrides,
  };
}
