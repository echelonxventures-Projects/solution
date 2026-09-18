import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '@consultancy/shared/utils/errors';
import { findOne, update } from '@consultancy/shared/database';
import { publishConsultantEvent } from '@consultancy/shared/events';
import { Consultant, ConsultantStatus } from '@consultancy/shared/types';
import { logger } from '@consultancy/shared';

// ===== SCHEMAS =====

const submitVerificationSchema = z.object({
  documents: z.object({
    identityProof: z.string().optional(),
    qualificationProof: z.string().optional(),
    experienceProof: z.string().optional(),
    certificationProof: z.string().optional(),
  }),
  notes: z.string().max(500).optional(),
});

const approveVerificationSchema = z.object({
  verificationLevel: z.enum(['basic', 'verified', 'pro', 'enterprise']),
  notes: z.string().max(500).optional(),
});

// ===== ROUTES =====

export default async function verificationRoutes(server: FastifyInstance) {

  // POST /verification/:consultantId - Submit verification documents
  server.post<{ Params: { consultantId: string }; Body: z.infer<typeof submitVerificationSchema> }>(
    '/:consultantId',
    {
      schema: {
        tags: ['verification'],
        summary: 'Submit verification documents',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', properties: { status: { type: 'string' }, message: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;
      const validation = submitVerificationSchema.safeParse(request.body);
      if (!validation.success) {
        throw new ValidationError('Invalid verification data', validation.error.errors);
      }

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      // Update verification documents and status
      await update<Consultant>('consultants', consultantId, {
        verificationDocuments: validation.data.documents,
        verificationStatus: 'pending_review',
      });

      logger.info('Verification submitted', { consultantId });

      reply.code(200).send({
        status: 'pending_review',
        message: 'Verification documents submitted for review',
      });
    }
  );

  // PUT /verification/:consultantId/approve - Approve consultant verification (Admin)
  server.put<{ Params: { consultantId: string }; Body: z.infer<typeof approveVerificationSchema> }>(
    '/:consultantId/approve',
    {
      schema: {
        tags: ['verification'],
        summary: 'Approve consultant verification',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', properties: { status: { type: 'string' }, verificationLevel: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;
      const validation = approveVerificationSchema.safeParse(request.body);
      if (!validation.success) {
        throw new ValidationError('Invalid approval data', validation.error.errors);
      }

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      // Update verification and activate consultant
      await update<Consultant>('consultants', consultantId, {
        verificationStatus: validation.data.verificationLevel,
        status: ConsultantStatus.ACTIVE,
        approvedAt: new Date(),
        // approvedBy: from auth
      });

      // Update user verification level
      await update('users', consultant.userId, {
        verified: true,
        verificationLevel: validation.data.verificationLevel,
      });

      await publishConsultantEvent('consultant.verified', { consultantId, level: validation.data.verificationLevel }, 'consultant-service');

      logger.info('Consultant verified', { consultantId, level: validation.data.verificationLevel });

      reply.code(200).send({
        status: ConsultantStatus.ACTIVE,
        verificationLevel: validation.data.verificationLevel,
      });
    }
  );

  // PUT /verification/:consultantId/reject - Reject consultant verification (Admin)
  server.put<{ Params: { consultantId: string }; Body: { reason: string } }>(
    '/:consultantId/reject',
    {
      schema: {
        tags: ['verification'],
        summary: 'Reject consultant verification',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        body: { type: 'object', properties: { reason: { type: 'string' } } },
        response: { 200: { type: 'object', properties: { status: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;
      const { reason } = request.body;

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      await update<Consultant>('consultants', consultantId, {
        verificationStatus: 'rejected',
        status: ConsultantStatus.PENDING,
      });

      logger.info('Verification rejected', { consultantId, reason });

      reply.code(200).send({ status: 'rejected' });
    }
  );

  // PUT /verification/:consultantId/suspend - Suspend consultant (Admin)
  server.put<{ Params: { consultantId: string }; Body: { reason: string } }>(
    '/:consultantId/suspend',
    {
      schema: {
        tags: ['verification'],
        summary: 'Suspend consultant',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        body: { type: 'object', properties: { reason: { type: 'string' } } },
        response: { 200: { type: 'object', properties: { status: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;
      const { reason } = request.body;

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      await update<Consultant>('consultants', consultantId, {
        status: ConsultantStatus.SUSPENDED,
      });

      await publishConsultantEvent('consultant.suspended', { consultantId, reason }, 'consultant-service');

      logger.info('Consultant suspended', { consultantId, reason });

      reply.code(200).send({ status: ConsultantStatus.SUSPENDED });
    }
  );
}