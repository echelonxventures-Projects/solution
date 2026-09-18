import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { findAll, insert, DatabaseClient } from '@consultancy/shared/database';

const auditLogSchema = z.object({
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  userId: z.string().uuid(),
  details: z.record(z.any()).optional(),
});

export default async function auditRoutes(server: FastifyInstance) {

  // GET /audit/:userId - Get user audit logs
  server.get<{ Params: { userId: string }; Querystring: { limit?: number; offset?: number } }>(
    '/:userId',
    async (request, reply) => {
      const { userId } = request.params;
      const { limit = 50, offset = 0 } = request.query;

      const logs = await findAll('audit_logs', { userId }, { limit, offset, order: 'created_at DESC' });

      reply.code(200).send({ logs, total: logs.length, limit, offset });
    }
  );

  // GET /audit/resource/:type/:id - Get audit logs for resource
  server.get<{ Params: { type: string; id: string } }>(
    '/resource/:type/:id',
    async (request, reply) => {
      const { type, id } = request.params;

      const logs = await findAll('audit_logs', { resourceType: type, resourceId: id });

      reply.code(200).send({ logs });
    }
  );

  // POST /audit - Create audit log entry
  server.post<{ Body: z.infer<typeof auditLogSchema> }>(
    '/',
    async (request, reply) => {
      const validation = auditLogSchema.safeParse(request.body);
      if (!validation.success) return reply.code(400).send({ error: validation.error.errors });

      const log = await insert('audit_logs', {
        ...validation.data,
        timestamp: new Date(),
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });

      reply.code(201).send(log);
    }
  );

  // GET /audit/actions - List available audit actions
  server.get('/actions', async (request, reply) => {
    reply.code(200).send({
      actions: [
        'login', 'logout', 'register', 'profile_update',
        'booking_create', 'booking_cancel', 'booking_complete',
        'payment_init', 'payment_complete', 'payment_refund',
        'content_upload', 'content_purchase', 'content_view',
        'review_create', 'review_update',
        'data_export', 'data_delete', 'consent_update',
      ],
    });
  });
}