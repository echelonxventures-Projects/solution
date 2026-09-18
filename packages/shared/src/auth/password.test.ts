import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  hashPassword,
  verifyPassword,
  generateRandomPassword,
  generateOTP,
  generateVerificationToken,
  generateApiKey,
  hashForStorage,
  verifyHash,
  generateUUID,
} from './password';

describe('password', () => {
  describe('hashPassword / verifyPassword', () => {
    it('produces a bcrypt hash that verifies', async () => {
      const hash = await hashPassword('Sup3rSecret!');
      expect(hash).not.toBe('Sup3rSecret!');
      expect(hash.startsWith('$2')).toBe(true);
      expect(await verifyPassword('Sup3rSecret!', hash)).toBe(true);
    });

    it('rejects the wrong password', async () => {
      const hash = await hashPassword('correct-password-1');
      expect(await verifyPassword('wrong-password-2', hash)).toBe(false);
    });

    it('produces different hashes for the same password (salted)', async () => {
      const [a, b] = await Promise.all([hashPassword('same-password'), hashPassword('same-password')]);
      expect(a).not.toBe(b);
    });
  });

  describe('generateRandomPassword', () => {
    it('defaults to 16 characters', () => {
      expect(generateRandomPassword()).toHaveLength(16);
    });

    it('respects the requested length and charset', () => {
      const pw = generateRandomPassword(24);
      expect(pw).toHaveLength(24);
      expect(pw).toMatch(/^[a-zA-Z0-9!@#$%^&*]+$/);
    });
  });

  describe('generateOTP', () => {
    it('generates 6 digit codes', () => {
      for (let i = 0; i < 20; i++) {
        expect(generateOTP()).toMatch(/^\d{6}$/);
      }
    });
  });

  describe('generateVerificationToken', () => {
    it('generates a 64-char hex token', () => {
      expect(generateVerificationToken()).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('generateApiKey', () => {
    it('generates a prefixed key', () => {
      expect(generateApiKey()).toMatch(/^cp_[a-f0-9]{64}$/);
    });
  });

  describe('hashForStorage / verifyHash', () => {
    it('is deterministic sha256 and verifiable', () => {
      const hash = hashForStorage('lookup-value');
      expect(hash).toHaveLength(64);
      expect(hash).toBe(hashForStorage('lookup-value'));
      expect(verifyHash('lookup-value', hash)).toBe(true);
      expect(verifyHash('other-value', hash)).toBe(false);
    });
  });

  describe('generateUUID', () => {
    it('produces valid v4 uuids', () => {
      const id = generateUUID();
      expect(() => crypto.randomUUID()).not.toThrow();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });
});
