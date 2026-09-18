// Compliance Service - GDPR and data compliance
// Handles: data export, deletion, consent, audit
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { logger, DatabaseClient } from '@consultancy/shared';
import exportRoutes from './routes/export.js';
import deleteRoutes from './routes/delete.js';
import consentRoutes from './routes/consent.js';
import auditRoutes from './routes/audit.js';
import healthRoutes from './routes/health.js';
import fastify from 'fastify';

const PORT = parseInt(process.env.COMPLIANCE_SERVICE_PORT || '3012', 10);
const server = fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });

async function main() {
  await server.register(helmet);
  await server.register(cors);
  await server.register(swagger, { swagger: { info: { title: 'Compliance Service API', version: '1.0.0' }, tags: [{ name: 'gdpr' }] } });
  await server.register(swaggerUI, { routePrefix: '/docs' });

  await server.register(exportRoutes, { prefix: '/export' });
  await server.register(deleteRoutes, { prefix: '/delete' });
  await server.register(consentRoutes, { prefix: '/consent' });
  await server.register(auditRoutes, { prefix: '/audit' });
  await server.register(healthRoutes);
}

server.setErrorHandler((error, request, reply) => reply.code(error.statusCode || 500).send({ error: { message: error.message } }));

async function start() {
  await main();
  await server.listen({ port: PORT, host: '0.0.0.0' });
  logger.info(`Compliance Service started on port ${PORT}`);
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default server;