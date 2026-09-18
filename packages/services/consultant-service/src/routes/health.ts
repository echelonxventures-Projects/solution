import { FastifyInstance } from 'fastify';
import { DatabaseClient } from '@consultancy/shared/database';

export default async function healthRoutes(server: FastifyInstance) {
  server.get('/health', async (request, reply) => {
    let dbHealthy = false;
    try {
      const db = DatabaseClient.getInstance();
      dbHealthy = await db.healthCheck();
    } catch { dbHealthy = false; }

    reply.code(200).send({
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      checks: { database: dbHealthy },
    });
  });

  server.get('/ready', async (request, reply) => {
    try {
      const db = DatabaseClient.getInstance();
      const dbHealthy = await db.healthCheck();
      if (!dbHealthy) {
        reply.code(503).send({ ready: false, reason: 'Database not available' });
        return;
      }
      reply.code(200).send({ ready: true });
    } catch {
      reply.code(503).send({ ready: false, reason: 'Service not initialized' });
    }
  });

  server.get('/metrics', async (request, reply) => {
    reply.code(200).type('text/plain').send(`
# HELP consultant_service_consultants_active Active consultants count
# TYPE consultant_service_consultants_active gauge
consultant_service_consultants_active 0
# HELP consultant_service_memory_usage_bytes Memory usage
# TYPE consultant_service_memory_usage_bytes gauge
consultant_service_memory_usage_bytes ${process.memoryUsage().heapUsed}
`);
  });
}