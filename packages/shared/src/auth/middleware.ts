import { JWTPayload, UserRole } from '../types';
import { verifyAccessToken, extractTokenFromHeader } from './jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface AuthHeaders {
  authorization?: string;
}

export interface AuthedRequestLike {
  headers: AuthHeaders;
  user?: JWTPayload;
}

/**
 * Authenticates a request via Bearer token and returns the decoded payload.
 * Throws UnauthorizedError when the token is missing or invalid.
 */
export function authenticateRequest(req: AuthedRequestLike): JWTPayload {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    throw new UnauthorizedError('Authentication token is required');
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  req.user = payload;
  return payload;
}

/**
 * Verifies the authenticated user has one of the given roles.
 * Throws UnauthorizedError/ForbiddenError otherwise.
 */
export function requireRole(user: JWTPayload | undefined, ...roles: UserRole[]): JWTPayload {
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    throw new ForbiddenError('You do not have permission to access this resource');
  }

  return user;
}

/**
 * Fastify preHandler-style hook: authenticates and attaches request.user.
 * Compatible with (request, reply, done) signature.
 */
export function authenticate(request: AuthedRequestLike, _reply: unknown, done: (err?: Error) => void): void {
  try {
    authenticateRequest(request);
    done();
  } catch (err) {
    done(err as Error);
  }
}

export default { authenticate, authenticateRequest, requireRole };
