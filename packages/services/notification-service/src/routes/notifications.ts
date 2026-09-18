import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { insert, findOne, findAll } from '@consultancy/shared/database';
import { logger } from '@consultancy/shared';

const sendNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['email', 'sms', 'push', 'whatsapp', 'in_app']),
  template: z.string(),
  data: z.record(z.any()),
  scheduledAt: z.string().datetime().optional(),
});

export default async function notificationsRoutes(server: FastifyInstance) {

  server.post<{ Body: z.infer<typeof sendNotificationSchema> }>(
    '/send',
    async (request, reply) => {
      const { userId, type, template, data, scheduledAt } = request.body;

      const notification = await insert('notifications', {
        userId,
        type,
        template,
        data,
        status: scheduledAt ? 'scheduled' : 'pending',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      });

      // Process immediately if not scheduled
      if (!scheduledAt) {
        logger.info('Processing notification', { id: notification.id, type });
        // Call channel handler
      }

      reply.code(201).send({ id: notification.id, status: notification.status });
    }
  );

  server.get('/user/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const notifications = await findAll('notifications', { userId }, { limit: 50, order: 'created_at DESC' });
    reply.code(200).send({ notifications });
  });

  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const notification = await findOne('notifications', { id });
    if (!notification) return reply.code(404).send({ error: 'Not found' });
    reply.code(200).send(notification);
  });

  server.put('/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const notification = await update('notifications', id, { status });
    reply.code(200).send(notification);
  });
}