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
      if (!await db.healthCheck()) {
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
# HELP booking_service_bookings_total Total bookings
# TYPE booking_service_bookings_total gauge
booking_service_bookings_total 0
# HELP booking_service_memory_usage_bytes Memory usage
# TYPE booking_service_memory_usage_bytes gauge
booking_service_memory_usage_bytes ${process.memoryUsage().heapUsed}
`);
  });
}