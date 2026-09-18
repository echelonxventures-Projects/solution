// Integration Service - External integrations
// Handles: webhooks, calendar, providers
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { logger } from '@consultancy/shared';
import webhooksRoutes from './routes/webhooks.js';
import calendarRoutes from './routes/calendar.js';
import providersRoutes from './routes/providers.js';
import healthRoutes from './routes/health.js';
import fastify from 'fastify';

const PORT = parseInt(process.env.INTEGRATION_SERVICE_PORT || '3013', 10);
const server = fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });

async function main() {
  await server.register(helmet);
  await server.register(cors);
  await server.register(swagger, { swagger: { info: { title: 'Integration Service API', version: '1.0.0' }, tags: [{ name: 'webhooks' }, { name: 'calendar' }] } });
  await server.register(swaggerUI, { routePrefix: '/docs' });

  await server.register(webhooksRoutes, { prefix: '/webhooks' });
  await server.register(calendarRoutes, { prefix: '/calendar' });
  await server.register(providersRoutes, { prefix: '/providers' });
  await server.register(healthRoutes);
}

server.setErrorHandler((error, request, reply) => reply.code(error.statusCode || 500).send({ error: { message: error.message } }));

async function start() {
  await main();
  await server.listen({ port: PORT, host: '0.0.0.0' });
  logger.info(`Integration Service started on port ${PORT}`);
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default server;