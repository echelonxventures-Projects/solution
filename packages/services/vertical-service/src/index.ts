// Vertical Service - Consultancy verticals management
// Handles: verticals, hierarchy, analytics
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { logger } from '@consultancy/shared';
import verticalsRoutes from './routes/verticals.js';
import hierarchyRoutes from './routes/hierarchy.js';
import analyticsRoutes from './routes/analytics.js';
import healthRoutes from './routes/health.js';
import fastify from 'fastify';

const PORT = parseInt(process.env.VERTICAL_SERVICE_PORT || '3014', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = fastify({
  logger: { level: process.env.LOG_LEVEL || 'info' },
});

async function main() {
  await server.register(helmet);
  await server.register(cors, { origin: true, credentials: true });

  await server.register(swagger, {
    swagger: {
      info: { title: 'Vertical Service API', description: 'Consultancy categories and verticals', version: '1.0.0' },
      host: `localhost:${PORT}`,
      schemes: ['http', 'https'],
      tags: [
        { name: 'verticals', description: 'Vertical management' },
        { name: 'hierarchy', description: 'Vertical hierarchy' },
        { name: 'analytics', description: 'Vertical analytics' },
      ],
    },
  });

  await server.register(swaggerUI, { routePrefix: '/docs' });

  await server.register(verticalsRoutes, { prefix: '/verticals' });
  await server.register(hierarchyRoutes, { prefix: '/hierarchy' });
  await server.register(analyticsRoutes, { prefix: '/analytics' });
  await server.register(healthRoutes);
}

server.setErrorHandler((error, request, reply) => {
  logger.error('Request error', error);
  reply.code(error.statusCode || 500).send({ error: { code: error.code || 'INTERNAL_ERROR', message: error.message } });
});

const start = async () => {
  try {
    await main();
    await server.listen({ port: PORT, host: HOST });
    logger.info(`Vertical Service started on http://${HOST}:${PORT}`);
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => { await server.close(); process.exit(0); });
process.on('SIGINT', async () => { await server.close(); process.exit(0); });

start();
export default server;