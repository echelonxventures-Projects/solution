import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DatabaseClient } from '@consultancy/shared/database';
import { EventBus } from '@consultancy/shared/events';

export default async function healthRoutes(server: FastifyInstance) {
  // GET /health - Health check endpoint
  server.get(
    '/health',
    {
      schema: {
        tags: ['system'],
        summary: 'Health check',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              version: { type: 'string' },
              uptime: { type: 'number' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'boolean' },
                  kafka: { type: 'boolean' },
                  memory: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {

      // Check database
      let databaseHealthy = false;
      try {
        const db = DatabaseClient.getInstance();
        databaseHealthy = await db.healthCheck();
      } catch {
        databaseHealthy = false;
      }

      // Check Kafka (optional)
      let kafkaHealthy = false;
      try {
        const bus = EventBus.getInstance();
        kafkaHealthy = await bus.healthCheck();
      } catch {
        kafkaHealthy = false;
      }

      // Determine overall status
      const status = databaseHealthy ? 'healthy' : 'degraded';

      reply.code(200).send({
        status,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        checks: {
          database: databaseHealthy,
          kafka: kafkaHealthy,
          memory: process.memoryUsage().heapUsed < process.memoryUsage().heapTotal * 0.9,
        },
      });
    }
  );

  // GET /ready - Readiness check endpoint
  server.get(
    '/ready',
    {
      schema: {
        tags: ['system'],
        summary: 'Readiness check',
        response: {
          200: {
            type: 'object',
            properties: {
              ready: { type: 'boolean' },
            },
          },
          503: {
            type: 'object',
            properties: {
              ready: { type: 'boolean' },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Check database
      try {
        const db = DatabaseClient.getInstance();
        const dbHealthy = await db.healthCheck();

        if (!dbHealthy) {
          reply.code(503).send({
            ready: false,
            reason: 'Database not available',
          });
          return;
        }

        reply.code(200).send({ ready: true });
      } catch (error) {
        reply.code(503).send({
          ready: false,
          reason: 'Service not initialized',
        });
      }
    }
  );

  // GET /metrics - Prometheus metrics endpoint
  server.get(
    '/metrics',
    {
      schema: {
        tags: ['system'],
        summary: 'Prometheus metrics',
        response: {
          200: {
            type: 'string',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Generate Prometheus metrics
      const metrics = `
# HELP user_service_requests_total Total requests to user service
# TYPE user_service_requests_total counter
user_service_requests_total 0

# HELP user_service_active_users Active users count
# TYPE user_service_active_users gauge
user_service_active_users 0

# HELP user_service_memory_usage_bytes Memory usage in bytes
# TYPE user_service_memory_usage_bytes gauge
user_service_memory_usage_bytes ${process.memoryUsage().heapUsed}
`;

      reply.code(200).type('text/plain').send(metrics);
    }
  );
}