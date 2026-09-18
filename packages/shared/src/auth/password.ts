import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate random password
 */
export function generateRandomPassword(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Generate OTP (6 digits)
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate API key
 */
export function generateApiKey(): string {
  return `cp_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Hash sensitive data for storage
 */
export function hashForStorage(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify hash
 */
export function verifyHash(data: string, hash: string): boolean {
  return hashForStorage(data) === hash;
}

/**
 * Generate UUID
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

export default {
  hashPassword,
  verifyPassword,
  generateRandomPassword,
  generateOTP,
  generateVerificationToken,
  generateApiKey,
  hashForStorage,
  verifyHash,
  generateUUID,
};