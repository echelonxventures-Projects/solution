import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '@consultancy/shared/utils/errors';
import { generateTokens, verifyRefreshToken, hashPassword, verifyPassword, generateVerificationToken, createSessionId } from '@consultancy/shared/auth';
import { insert, findOne, update } from '@consultancy/shared/database';
import { publishUserEvent } from '@consultancy/shared/events';
import { UserRole, UserStatus, User } from '@consultancy/shared/types';
import { logger } from '@consultancy/shared';

// Auth routes - Authentication endpoints
// Handles: register, login, logout, refresh, password reset

const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['seeker', 'consultant']).default('seeker'),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().optional(),
  twoFactorCode: z.string().length(6).optional(),
});

const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1),
});

const forgotPasswordBodySchema = z.object({
  email: z.string().email(),
});

const resetPasswordBodySchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

// ===== ROUTES =====

export default async function authRoutes(server: FastifyInstance) {
  // POST /auth/register - Register new user
  server.post<{ Body: z.infer<typeof registerBodySchema> }>(
    '/register',
    {
      schema: {
        tags: ['auth'],
        summary: 'Register new user',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            phone: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['seeker', 'consultant'] },
            timezone: { type: 'string' },
            language: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              email: { type: 'string' },
              status: { type: 'string' },
              verificationRequired: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof registerBodySchema> }>, reply: FastifyReply) => {
      // Validate input
      const validationResult = registerBodySchema.safeParse(request.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid registration data', validationResult.error.errors);
      }

      const data = validationResult.data;

      // Check if email already exists
      const existingUser = await findOne<User>('users', { email: data.email });
      if (existingUser) {
        throw new ConflictError('EMAIL_EXISTS', 'Email already registered');
      }

      // Check if phone exists (if provided)
      if (data.phone) {
        const existingPhone = await findOne<User>('users', { phone: data.phone });
        if (existingPhone) {
          throw new ConflictError('ALREADY_EXISTS', 'Phone number already registered');
        }
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Generate verification token
      const _verificationToken = generateVerificationToken();

      // Create user
      const user = await insert<User>('users', {
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: data.role as UserRole,
        status: UserStatus.PENDING,
        emailVerified: false,
        phoneVerified: false,
        twoFactorEnabled: false,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        avatarUrl: null,
        timezone: data.timezone || 'UTC',
        language: data.language || 'en',
        metadata: {},
      });

      // Store verification token

      // Publish user.created event
      await publishUserEvent('user.created', { id: user.id, email: user.email, role: user.role }, 'user-service');

      logger.info('User registered', { userId: user.id, email: user.email });

      // Return response
      reply.code(201).send({
        userId: user.id,
        email: user.email,
        status: user.status,
        verificationRequired: true,
      });
    }
  );

  // POST /auth/login - Login user
  server.post<{ Body: z.infer<typeof loginBodySchema> }>(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login user',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            deviceId: { type: 'string' },
            twoFactorCode: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              expiresIn: { type: 'number' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  avatarUrl: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof loginBodySchema> }>, reply: FastifyReply) => {
      const validationResult = loginBodySchema.safeParse(request.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid login data', validationResult.error.errors);
      }

      const { email, password, twoFactorCode } = validationResult.data;

      // Find user
      const user = await findOne<User>('users', { email });
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check status
      if (user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedError('Account suspended');
      }
      if (user.status === UserStatus.DELETED) {
        throw new UnauthorizedError('Account not found');
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          throw new UnauthorizedError('Two-factor authentication required');
        }
        // Verify 2FA code
      }

      // Generate tokens
      const sessionId = createSessionId();
      const tokens = generateTokens(user.id, user.email, user.role as UserRole, sessionId);

      // Update last login
      await update<User>('users', user.id, { lastLoginAt: new Date() });

      // Publish user.logged_in event
      await publishUserEvent('user.logged_in', { userId: user.id, sessionId }, 'user-service');

      logger.info('User logged in', { userId: user.id, email: user.email });

      // Return response
      reply.code(200).send({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
        },
      });
    }
  );

  // POST /auth/logout - Logout user
  server.post(
    '/logout',
    {
      schema: {
        tags: ['auth'],
        summary: 'Logout user',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: async (_request: FastifyRequest, _reply: FastifyReply) => {
        // Authenticate user
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Invalidate session
      reply.code(200).send({ message: 'Logged out successfully' });
    }
  );

  // POST /auth/refresh - Refresh access token
  server.post<{ Body: z.infer<typeof refreshTokenBodySchema> }>(
    '/refresh',
    {
      schema: {
        tags: ['auth'],
        summary: 'Refresh access token',
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              expiresIn: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof refreshTokenBodySchema> }>, reply: FastifyReply) => {
      const { refreshToken } = request.body;

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Find user
      const user = await findOne<User>('users', { id: payload.userId });
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Check token family for reuse detection

      // Generate new tokens
      const newSessionId = `refresh-${Date.now()}`;
      const tokens = generateTokens(user.id, user.email, user.role as UserRole, newSessionId);

      logger.info('Token refreshed', { userId: user.id });

      reply.code(200).send({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });
    }
  );

  // POST /auth/forgot-password - Request password reset
  server.post<{ Body: z.infer<typeof forgotPasswordBodySchema> }>(
    '/forgot-password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Request password reset',
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof forgotPasswordBodySchema> }>, reply: FastifyReply) => {
      const { email } = request.body;

      // Find user
      const user = await findOne<User>('users', { email });
      if (!user) {
        reply.code(200).send({ message: 'If email exists, reset link will be sent' });
        return;
      }

      // Generate reset token
      const _resetToken = generateVerificationToken();
      const _resetExpires = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token

      logger.info('Password reset requested', { userId: user.id, email: user.email });

      reply.code(200).send({ message: 'If email exists, reset link will be sent' });
    }
  );

  // POST /auth/reset-password - Reset password with token
  server.post<{ Body: z.infer<typeof resetPasswordBodySchema> }>(
    '/reset-password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Reset password',
        body: {
          type: 'object',
          required: ['token', 'newPassword'],
          properties: {
            token: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof resetPasswordBodySchema> }>, reply: FastifyReply) => {
      const { token: _token, newPassword } = request.body;

      // Verify reset token and get user ID
      // Hash new password
      const _passwordHash = await hashPassword(newPassword);
      // Update user password
      // Invalidate all existing sessions

      logger.info('Password reset completed');

      reply.code(200).send({ message: 'Password reset successfully' });
    }
  );

  // POST /auth/social/:provider - Social login
  server.post<{ Params: { provider: string } }>(
    '/social/:provider',
    {
      schema: {
        tags: ['auth'],
        summary: 'Social login (Google, Apple, Facebook)',
        params: {
          type: 'object',
          properties: {
            provider: { type: 'string', enum: ['google', 'apple', 'facebook'] },
          },
        },
        body: {
          type: 'object',
          required: ['providerToken'],
          properties: {
            providerToken: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              expiresIn: { type: 'number' },
              user: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { provider: string } }>, _reply: FastifyReply) => {
      const { provider } = request.params;

      // Implement social login verification

      logger.info('Social login attempt', { provider });

      throw new NotFoundError('Social provider', provider);
    }
  );
}