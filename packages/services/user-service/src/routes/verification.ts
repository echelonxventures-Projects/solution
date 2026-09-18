import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UnauthorizedError } from '@consultancy/shared/utils/errors';
import { generateOTP, generateVerificationToken } from '@consultancy/shared/auth';
import { findOne, update } from '@consultancy/shared/database';
import { User } from '@consultancy/shared/types';
import { logger } from '@consultancy/shared';
import { publishUserEvent } from '@consultancy/shared/events';

// ===== SCHEMAS =====

const verifyEmailBodySchema = z.object({
  token: z.string().min(1),
});

const verifyPhoneBodySchema = z.object({
  otp: z.string().length(6),
});

const sendVerificationBodySchema = z.object({
  type: z.enum(['email', 'phone']),
});

// ===== ROUTES =====

export default async function verificationRoutes(server: FastifyInstance) {
  // POST /verification/email - Verify email address
  server.post<{ Body: z.infer<typeof verifyEmailBodySchema> }>(
    '/email',
    {
      schema: {
        tags: ['verification'],
        summary: 'Verify email address',
        body: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              verified: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof verifyEmailBodySchema> }>, reply: FastifyReply) => {
      const { token } = request.body;

      // Verify token and get user ID from verification_tokens table

      // For now, simulate verification
      logger.info('Email verification attempt', { token });

      reply.code(200).send({
        message: 'Email verified successfully',
        verified: true,
      });
    }
  );

  // POST /verification/phone - Verify phone with OTP
  server.post<{ Body: z.infer<typeof verifyPhoneBodySchema> }>(
    '/phone',
    {
      schema: {
        tags: ['verification'],
        summary: 'Verify phone number',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['otp'],
          properties: {
            otp: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              verified: { type: 'boolean' },
            },
          },
        },
      },
      preHandler: async (_request: FastifyRequest, _reply: FastifyReply) => {
        // Add authentication middleware
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof verifyPhoneBodySchema> }>, reply: FastifyReply) => {
      const { otp: _otp } = request.body;
      const userId = 'test-user-id';

      // Verify OTP from Redis or database

      const user = await findOne<User>('users', { id: userId });
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Update user verification status
      await update<User>('users', userId, {
        verificationLevel: user.verificationLevel === 'none' ? 'basic' : user.verificationLevel,
      });

      // Publish user.phone_verified event
      await publishUserEvent('user.phone_verified', { userId }, 'user-service');

      logger.info('Phone verified', { userId });

      reply.code(200).send({
        message: 'Phone verified successfully',
        verified: true,
      });
    }
  );

  // POST /verification/send - Send verification code
  server.post<{ Body: z.infer<typeof sendVerificationBodySchema> }>(
    '/send',
    {
      schema: {
        tags: ['verification'],
        summary: 'Send verification code',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['email', 'phone'] },
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
    async (request: FastifyRequest<{ Body: z.infer<typeof sendVerificationBodySchema> }>, reply: FastifyReply) => {
      const { type } = request.body;
      const userId = 'test-user-id';

      const user = await findOne<User>('users', { id: userId });
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (type === 'email') {
        const token = generateVerificationToken();
        // Store token and send email
        logger.info('Email verification sent', { userId, token });
      } else if (type === 'phone') {
        const otp = generateOTP();
        // Store OTP in Redis and send SMS
        logger.info('Phone verification sent', { userId, otp });
      }

      reply.code(200).send({
        message: `Verification ${type} sent`,
      });
    }
  );
}