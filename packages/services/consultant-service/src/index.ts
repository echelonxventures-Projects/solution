// Consultant Service - Consultant management and availability
// Handles: profiles, availability, verification, reviews, metrics
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { logger } from '@consultancy/shared';
import consultantsRoutes from './routes/consultants.js';
import availabilityRoutes from './routes/availability.js';
import verificationRoutes from './routes/verification.js';
import reviewsRoutes from './routes/reviews.js';
import metricsRoutes from './routes/metrics.js';
import healthRoutes from './routes/health.js';
import fastify from 'fastify';

const PORT = parseInt(process.env.CONSULTANT_SERVICE_PORT || '3002', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins in parallel
async function main() {
  await Promise.all([
    server.register(helmet),
    server.register(cors, { origin: true, credentials: true }),
    server.register(rateLimit, { max: 100, timeWindow: '1 minute' }),
  ]);

  await server.register(swagger, {
    swagger: {
      info: {
        title: 'Consultant Service API',
        description: 'Consultant management and availability service',
        version: '1.0.0',
      },
      host: `localhost:${PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'consultants', description: 'Consultant management' },
        { name: 'availability', description: 'Availability and scheduling' },
        { name: 'verification', description: 'Consultant verification' },
        { name: 'reviews', description: 'Reviews and ratings' },
        { name: 'metrics', description: 'Performance metrics' },
      ],
    },
  });

  await server.register(swaggerUI, { routePrefix: '/docs' });

  // Register routes
  await server.register(consultantsRoutes, { prefix: '/consultants' });
  await server.register(availabilityRoutes, { prefix: '/availability' });
  await server.register(verificationRoutes, { prefix: '/verification' });
  await server.register(reviewsRoutes, { prefix: '/reviews' });
  await server.register(metricsRoutes, { prefix: '/metrics' });
  await server.register(healthRoutes);
}

// Global error handler
server.setErrorHandler((error, request, reply) => {
  logger.error('Request error', error);
  if (error.validation) {
    reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: error.message } });
    return;
  }
  reply.code(error.statusCode || 500).send({ error: { code: error.code || 'INTERNAL_ERROR', message: error.message } });
});

// Start server
const start = async () => {
  try {
    await main();
    await server.listen({ port: PORT, host: HOST });
    logger.info(`Consultant Service started on http://${HOST}:${PORT}`);
    logger.info(`API Documentation: http://${HOST}:${PORT}/docs`);
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  logger.info('Shutting down Consultant Service...');
  await server.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

start();

export default server;