import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { findAll, insert, update } from '@consultancy/shared/database';
import { logger } from '@consultancy/shared';

const syncCalendarSchema = z.object({
  provider: z.enum(['google', 'outlook', 'apple']),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
});

export default async function calendarRoutes(server: FastifyInstance) {

  // POST /calendar/sync/:userId - Sync calendar for user
  server.post<{ Params: { userId: string }; Body: z.infer<typeof syncCalendarSchema> }>(
    '/sync/:userId',
    async (request, reply) => {
      const { userId } = request.params;
      const validation = syncCalendarSchema.safeParse(request.body);
      if (!validation.success) return reply.code(400).send({ error: validation.error.errors });

      const { provider, accessToken, refreshToken } = validation.data;

      // Store calendar credentials
      await insert('calendar_integrations', {
        userId,
        provider,
        accessToken,
        refreshToken,
        syncedAt: new Date(),
        status: 'active',
      });

      logger.info('Calendar synced', { userId, provider });

      reply.code(200).send({ message: 'Calendar synced', provider });
    }
  );

  // GET /calendar/events/:userId - Get calendar events
  server.get<{ Params: { userId: string }; Querystring: { start?: string; end?: string } }>(
    '/events/:userId',
    async (request, reply) => {
      const { userId } = request.params;
      const { start: _start, end: _end } = request.query;

      // Get bookings as calendar events
      const bookings = await findAll('bookings', { seekerId: userId }, { order: 'scheduled_start ASC' });

      const events = bookings.map(b => ({
        id: b.id,
        title: `Session with Consultant`,
        start: b.scheduledStart,
        end: b.scheduledEnd,
        type: 'booking',
        status: b.status,
      }));

      reply.code(200).send({ events });
    }
  );

  // DELETE /calendar/sync/:userId - Remove calendar sync
  server.delete<{ Params: { userId: string } }>(
    '/sync/:userId',
    async (request, reply) => {
      const { userId } = request.params;

      await update('calendar_integrations', userId, { status: 'disabled' });

      reply.code(200).send({ message: 'Calendar sync removed' });
    }
  );
}