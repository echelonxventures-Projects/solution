// Booking Service - Session scheduling and management
// Handles: bookings, availability, recurring sessions
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { logger } from '@consultancy/shared';
import bookingsRoutes from './routes/bookings.js';
import availabilityRoutes from './routes/availability.js';
import recurringRoutes from './routes/recurring.js';
import healthRoutes from './routes/health.js';
import fastify from 'fastify';

const PORT = parseInt(process.env.BOOKING_SERVICE_PORT || '3003', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = fastify({
  logger: { level: process.env.LOG_LEVEL || 'info' },
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
      info: { title: 'Booking Service API', description: 'Session scheduling service', version: '1.0.0' },
      host: `localhost:${PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'bookings', description: 'Booking management' },
        { name: 'availability', description: 'Availability checking' },
        { name: 'recurring', description: 'Recurring bookings' },
      ],
    },
  });

  await server.register(swaggerUI, { routePrefix: '/docs' });

  await server.register(bookingsRoutes, { prefix: '/bookings' });
  await server.register(availabilityRoutes, { prefix: '/availability' });
  await server.register(recurringRoutes, { prefix: '/recurring' });
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
    logger.info(`Booking Service started on http://${HOST}:${PORT}`);
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  logger.info('Shutting down Booking Service...');
  await server.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

start();

export default server;