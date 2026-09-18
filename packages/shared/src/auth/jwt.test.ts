import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  extractTokenFromHeader,
  createSessionId,
} from './jwt';
import { UserRole } from '../types';

const userId = '11111111-1111-1111-1111-111111111111';

describe('jwt', () => {
  describe('generateAccessToken / verifyAccessToken', () => {
    it('round-trips a valid access token', () => {
      const token = generateAccessToken({ userId, email: 'a@b.com', role: UserRole.SEEKER, sessionId: 'sess-1' });
      const payload = verifyAccessToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
      expect(payload?.email).toBe('a@b.com');
      expect(payload?.role).toBe(UserRole.SEEKER);
    });

    it('rejects a token signed with the wrong secret', () => {
      const token = jwt.sign({ userId }, 'wrong-secret', {
        issuer: 'consultancy-platform',
        audience: 'consultancy-platform-users',
      });
      expect(verifyAccessToken(token)).toBeNull();
    });

    it('rejects garbage input', () => {
      expect(verifyAccessToken('not-a-token')).toBeNull();
    });
  });

  describe('generateRefreshToken / verifyRefreshToken', () => {
    it('round-trips a valid refresh token including family', () => {
      const token = generateRefreshToken({ userId, sessionId: 'sess-1', family: 'fam-1' });
      const payload = verifyRefreshToken(token);
      expect(payload?.userId).toBe(userId);
      expect(payload?.family).toBe('fam-1');
    });

    it('does not validate an access token as a refresh token', () => {
      const accessToken = generateAccessToken({ userId, email: 'a@b.com', role: UserRole.SEEKER, sessionId: 'sess-1' });
      expect(verifyRefreshToken(accessToken)).toBeNull();
    });
  });

  describe('generateTokens', () => {
    it('returns access, refresh and expires in seconds (15m default)', () => {
      const tokens = generateTokens(userId, 'a@b.com', UserRole.CONSULTANT, 'sess-1');
      expect(tokens.accessToken).toBeTypeOf('string');
      expect(tokens.refreshToken).toBeTypeOf('string');
      expect(tokens.expiresIn).toBe(900);
      expect(verifyAccessToken(tokens.accessToken)?.role).toBe(UserRole.CONSULTANT);
    });
  });

  describe('isTokenExpired', () => {
    it('is false for fresh tokens', () => {
      const token = generateAccessToken({ userId, email: 'a@b.com', role: UserRole.SEEKER, sessionId: 's' });
      expect(isTokenExpired(token)).toBe(false);
    });

    it('is true for expired tokens', () => {
      const expired = jwt.sign({ userId }, process.env.JWT_SECRET || 'default-secret-change-in-production', { expiresIn: -10 });
      expect(isTokenExpired(expired)).toBe(true);
    });

    it('is true for undecodable tokens', () => {
      expect(isTokenExpired('garbage')).toBe(true);
    });
  });

  describe('decodeToken', () => {
    it('decodes without verifying', () => {
      const token = generateAccessToken({ userId, email: 'a@b.com', role: UserRole.SEEKER, sessionId: 's' });
      const decoded = decodeToken(token) as { userId: string };
      expect(decoded.userId).toBe(userId);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('extracts bearer token', () => {
      expect(extractTokenFromHeader('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    });

    it('returns null for missing or malformed headers', () => {
      expect(extractTokenFromHeader(undefined)).toBeNull();
      expect(extractTokenFromHeader('Token abc')).toBeNull();
      expect(extractTokenFromHeader('abc')).toBeNull();
    });
  });

  describe('createSessionId', () => {
    it('creates unique session ids', () => {
      const ids = new Set(Array.from({ length: 50 }, () => createSessionId()));
      expect(ids.size).toBe(50);
    });
  });
});
