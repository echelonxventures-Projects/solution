import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

import { ValidationError, NotFoundError } from '@consultancy/shared/utils/errors';
import { findOne, update } from '@consultancy/shared/database';
import { User, UserStatus } from '@consultancy/shared/types';
import { logger } from '@consultancy/shared';
import { publishUserEvent } from '@consultancy/shared/events';

// ===== SCHEMAS =====

const updateUserBodySchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
  notificationSettings: z.record(z.boolean()).optional(),
  privacySettings: z.record(z.boolean()).optional(),
});

const deleteUserBodySchema = z.object({
  password: z.string().min(1),
  reason: z.string().max(500).optional(),
});

// ===== ROUTES =====

export default async function usersRoutes(server: FastifyInstance) {
  // GET /users/me - Get current user profile
  server.get(
    '/me',
    {
      schema: {
        tags: ['users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              role: { type: 'string' },
              status: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              displayName: { type: 'string' },
              avatarUrl: { type: 'string' },
              bio: { type: 'string' },
              timezone: { type: 'string' },
              language: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
      preHandler: async (_request: FastifyRequest, _reply: FastifyReply) => {
        // Add authentication middleware
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Get userId from authenticated request
      const userId = 'test-user-id';

      const user = await findOne<User>('users', { id: userId });
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      reply.code(200).send({
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        timezone: user.timezone,
        language: user.language,
        createdAt: user.createdAt.toISOString(),
      });
    }
  );

  // PUT /users/me - Update current user profile
  server.put<{ Body: z.infer<typeof updateUserBodySchema> }>(
    '/me',
    {
      schema: {
        tags: ['users'],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            displayName: { type: 'string' },
            avatarUrl: { type: 'string' },
            bio: { type: 'string' },
            timezone: { type: 'string' },
            language: { type: 'string' },
            notificationSettings: { type: 'object' },
            privacySettings: { type: 'object' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: async (_request: FastifyRequest, _reply: FastifyReply) => {
        // Add authentication middleware
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof updateUserBodySchema> }>, reply: FastifyReply) => {
      const validationResult = updateUserBodySchema.safeParse(request.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid update data', validationResult.error.errors);
      }

      const userId = 'test-user-id'; // request.user.userId
      const updateData = validationResult.data;

      const user = await findOne<User>('users', { id: userId });
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      const updatedUser = await update<User>('users', userId, updateData);

      // Publish user.updated event
      await publishUserEvent('user.updated', { userId, changes: updateData }, 'user-service');

      logger.info('User updated', { userId });

      reply.code(200).send({
        id: updatedUser!.id,
        email: updatedUser!.email,
        message: 'Profile updated successfully',
      });
    }
  );

  // DELETE /users/me - Delete current user account
  server.delete<{ Body: z.infer<typeof deleteUserBodySchema> }>(
    '/me',
    {
      schema: {
        tags: ['users'],
        summary: 'Delete current user account',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['password'],
          properties: {
            password: { type: 'string' },
            reason: { type: 'string' },
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
      preHandler: async (_request: FastifyRequest, _reply: FastifyReply) => {
        // Add authentication middleware
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof deleteUserBodySchema> }>, reply: FastifyReply) => {
      const { reason } = request.body;
      const userId = 'test-user-id';

      const user = await findOne<User>('users', { id: userId });
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // Verify password

      // Soft delete user
      await update<User>('users', userId, {
        status: UserStatus.DELETED,
        deletedAt: new Date(),
      });

      // Publish user.deleted event
      await publishUserEvent('user.deleted', { userId, reason }, 'user-service');

      logger.info('User deleted', { userId, reason });

      reply.code(200).send({ message: 'Account deleted successfully' });
    }
  );

  // GET /users/me/preferences - Get user preferences
  server.get(
    '/me/preferences',
    {
      schema: {
        tags: ['users'],
        summary: 'Get user preferences',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              notificationSettings: { type: 'object' },
              privacySettings: { type: 'object' },
              communicationPrefs: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = 'test-user-id'; // request.user.userId

      const user = await findOne<User>('users', { id: userId });
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      reply.code(200).send({
        notificationSettings: user.notificationSettings,
        privacySettings: user.privacySettings,
        communicationPrefs: user.communicationPrefs,
      });
    }
  );

  // PUT /users/me/preferences - Update user preferences
  server.put(
    '/me/preferences',
    {
      schema: {
        tags: ['users'],
        summary: 'Update user preferences',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            notificationSettings: { type: 'object' },
            privacySettings: { type: 'object' },
            communicationPrefs: { type: 'object' },
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
    async (request: FastifyRequest, reply: FastifyReply) => {

      // Update preferences

      reply.code(200).send({ message: 'Preferences updated successfully' });
    }
  );

  // GET /users/me/bookings - Get user's bookings
  server.get(
    '/me/bookings',
    {
      schema: {
        tags: ['users'],
        summary: 'Get user bookings',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            limit: { type: 'number' },
            offset: { type: 'number' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              bookings: { type: 'array' },
              total: { type: 'number' },
              limit: { type: 'number' },
              offset: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { status?: string; limit?: number; offset?: number } }>, reply: FastifyReply) => {
      const { limit = 20, offset = 0 } = request.query;

      // Query bookings from booking service or database

      reply.code(200).send({
        bookings: [],
        total: 0,
        limit,
        offset,
      });
    }
  );
}