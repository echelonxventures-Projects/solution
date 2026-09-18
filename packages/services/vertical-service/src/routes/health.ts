import { FastifyInstance } from 'fastify';
import { DatabaseClient } from '@consultancy/shared/database';

export default async function healthRoutes(server: FastifyInstance) {
  server.get('/health', async (request, reply) => {
    let dbHealthy = false;
    try { dbHealthy = await DatabaseClient.getInstance().healthCheck(); } catch { dbHealthy = false; }

    reply.code(200).send({
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
    });
  });

  server.get('/ready', async (request, reply) => {
    try {
      if (!await DatabaseClient.getInstance().healthCheck()) {
        reply.code(503).send({ ready: false });
        return;
      }
      reply.code(200).send({ ready: true });
    } catch { reply.code(503).send({ ready: false }); }
  });

  server.get('/metrics', async (request, reply) => {
    reply.code(200).type('text/plain').send(`
# HELP vertical_service_verticals_active Active verticals count
# TYPE vertical_service_verticals_active gauge
vertical_service_verticals_active 0
`);
  });
}