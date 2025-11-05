import crypto from 'crypto';

/**
 * Cryptographic utilities for token generation
 */

/**
 * Generate a secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a verification token for email changes
 * @returns 64-character hex token
 */
export function generateEmailVerificationToken(): string {
  return generateSecureToken(32);
}

/**
 * Generate a password reset token
 * @returns 64-character hex token
 */
export function generatePasswordResetToken(): string {
  return generateSecureToken(32);
}
