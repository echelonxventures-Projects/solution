import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { findOne, update, insert } from '@consultancy/shared/database';
import { NotFoundError } from '@consultancy/shared/utils/errors';

const updateConsentSchema = z.object({
  marketingEmails: z.boolean(),
  dataSharing: z.boolean(),
  analyticsTracking: z.boolean(),
  thirdPartyAccess: z.boolean(),
});

export default async function consentRoutes(server: FastifyInstance) {

  // GET /consent/:userId - Get user consent status
  server.get<{ Params: { userId: string } }>(
    '/:userId',
    async (request, reply) => {
      const { userId } = request.params;

      const consent = await findOne('user_consents', { userId });

      reply.code(200).send({
        userId,
        consent: consent || {
          marketingEmails: false,
          dataSharing: false,
          analyticsTracking: true,
          thirdPartyAccess: false,
          updatedAt: null,
        },
      });
    }
  );

  // PUT /consent/:userId - Update user consent
  server.put<{ Params: { userId: string }; Body: z.infer<typeof updateConsentSchema> }>(
    '/:userId',
    async (request, reply) => {
      const { userId } = request.params;
      const validation = updateConsentSchema.safeParse(request.body);
      if (!validation.success) throw new ValidationError('Invalid consent data', validation.error.errors);

      const existing = await findOne('user_consents', { userId });

      if (existing) {
        await update('user_consents', existing.id, {
          ...validation.data,
          updatedAt: new Date(),
        });
      } else {
        await insert('user_consents', {
          userId,
          ...validation.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      reply.code(200).send({ message: 'Consent updated', ...validation.data });
    }
  );

  // POST /consent/:userId/accept-all - Accept all consents
  server.post<{ Params: { userId: string } }>(
    '/:userId/accept-all',
    async (request, reply) => {
      const { userId } = request.params;

      await insert('user_consents', {
        userId,
        marketingEmails: true,
        dataSharing: true,
        analyticsTracking: true,
        thirdPartyAccess: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      reply.code(200).send({ message: 'All consents accepted' });
    }
  );
}