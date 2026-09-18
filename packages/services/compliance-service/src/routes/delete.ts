import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { findOne, update, DatabaseClient } from '@consultancy/shared/database';
import { User, UserStatus } from '@consultancy/shared/types';
import { NotFoundError, ValidationError } from '@consultancy/shared/utils/errors';
import { logger } from '@consultancy/shared';

const deleteRequestSchema = z.object({
  reason: z.string().max(500).optional(),
  immediate: z.boolean().default(false),
});

export default async function deleteRoutes(server: FastifyInstance) {

  // POST /delete/:userId - Request data deletion (GDPR)
  server.post<{ Params: { userId: string }; Body: z.infer<typeof deleteRequestSchema> }>(
    '/:userId',
    async (request, reply) => {
      const { userId } = request.params;
      const { reason, immediate } = request.body;

      const user = await findOne<User>('users', { id: userId });
      if (!user) throw new NotFoundError('User', userId);

      if (immediate) {
        // Immediate deletion - anonymize data
        const db = DatabaseClient.getInstance();

        // Anonymize user
        await update('users', userId, {
          email: `deleted-${userId}@deleted.com`,
          phone: null,
          firstName: 'Deleted',
          lastName: 'User',
          displayName: 'Deleted User',
          bio: null,
          status: UserStatus.DELETED,
          deletedAt: new Date(),
        });

        // Anonymize bookings
        await db.query(`UPDATE bookings SET topic = NULL, description = NULL, notes = NULL WHERE seeker_id = $1`, [userId]);

        logger.info('User data deleted', { userId, immediate: true });

        reply.code(200).send({ message: 'Data deleted immediately', status: 'completed' });
      } else {
        // Schedule deletion (30-day grace period)
        const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await update('users', userId, {
          status: UserStatus.PENDING, // Will be deleted after grace period
        });

        // Log deletion request
        await insert('deletion_requests', {
          userId,
          reason,
          requestedAt: new Date(),
          scheduledDeletion: deletionDate,
          status: 'pending',
        });

        logger.info('Deletion requested', { userId, deletionDate });

        reply.code(200).send({
          message: 'Deletion scheduled',
          deletionDate: deletionDate.toISOString(),
          gracePeriodDays: 30,
        });
      }
    }
  );

  // DELETE /delete/:userId/cancel - Cancel deletion request
  server.delete<{ Params: { userId: string } }>(
    '/:userId/cancel',
    async (request, reply) => {
      const { userId } = request.params;

      await update('users', userId, { status: UserStatus.ACTIVE });

      reply.code(200).send({ message: 'Deletion request cancelled' });
    }
  );
}