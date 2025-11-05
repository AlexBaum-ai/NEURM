import bcrypt from 'bcrypt';
import * as Sentry from '@sentry/node';

/**
 * Password hashing and verification utilities
 * Using bcrypt for secure password hashing
 */

const SALT_ROUNDS = 12; // Recommended salt rounds for security

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { utility: 'password', method: 'hashPassword' },
    });
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns True if password matches hash, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { utility: 'password', method: 'verifyPassword' },
    });
    throw new Error('Failed to verify password');
  }
}
