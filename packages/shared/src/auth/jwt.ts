import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload, AuthTokens, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function signOptions(expiresIn: string): SignOptions {
  return {
    expiresIn: expiresIn as SignOptions['expiresIn'],
    issuer: 'consultancy-platform',
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  family: string; // Token family for refresh token rotation
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    ...signOptions(JWT_EXPIRES_IN),
    audience: 'consultancy-platform-users',
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    ...signOptions(JWT_REFRESH_EXPIRES_IN),
    audience: 'consultancy-platform-refresh',
  });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(userId: string, email: string, role: UserRole, sessionId: string): AuthTokens {
  const accessToken = generateAccessToken({ userId, email, role, sessionId });
  const family = generateTokenFamily();
  const refreshToken = generateRefreshToken({ userId, sessionId, family });

  return {
    accessToken,
    refreshToken,
    expiresIn: getExpirationSeconds(JWT_EXPIRES_IN),
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'consultancy-platform',
      audience: 'consultancy-platform-users',
    }) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'consultancy-platform',
      audience: 'consultancy-platform-refresh',
    }) as RefreshTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Decode token without verification (for inspection)
 */
export function decodeToken(token: string): unknown {
  return jwt.decode(token);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (!decoded?.exp) return true;
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

/**
 * Generate unique token family for refresh token rotation
 */
function generateTokenFamily(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

/**
 * Convert expiration string to seconds
 */
function getExpirationSeconds(expiration: string): number {
  const unit = expiration.slice(-1);
  const value = parseInt(expiration.slice(0, -1));

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return parseInt(expiration) || 900; // default 15 minutes
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Create session ID
 */
export function createSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  extractTokenFromHeader,
  createSessionId,
};