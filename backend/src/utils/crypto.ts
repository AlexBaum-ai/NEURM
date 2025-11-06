import crypto from 'crypto';
import env from '@/config/env';

/**
 * Cryptographic utilities for token generation and encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

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

/**
 * Derive an encryption key from the secret
 * @param salt - Salt for key derivation
 * @returns Derived key
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(env.JWT_SECRET, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt sensitive data (e.g., API keys, passwords)
 * @param plaintext - The data to encrypt
 * @returns Encrypted data with IV and tag (format: salt:iv:tag:encrypted)
 */
export function encrypt(plaintext: string): string {
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from secret and salt
  const key = deriveKey(salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the data
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get authentication tag
  const tag = cipher.getAuthTag();

  // Combine salt:iv:tag:encrypted
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted,
  ].join(':');
}

/**
 * Decrypt sensitive data
 * @param ciphertext - The encrypted data (format: salt:iv:tag:encrypted)
 * @returns Decrypted plaintext
 * @throws Error if decryption fails
 */
export function decrypt(ciphertext: string): string {
  try {
    // Split the components
    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltHex, ivHex, tagHex, encrypted] = parts;

    // Convert from hex
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    // Derive key
    const key = deriveKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + (error as Error).message);
  }
}

/**
 * Hash sensitive data (one-way, for comparison only)
 * @param data - Data to hash
 * @returns Hex-encoded hash
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
