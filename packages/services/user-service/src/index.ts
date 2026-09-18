// User Service - Authentication and user management
// Handles: auth, profiles, verification
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastify from 'fastify';
import { logger } from '@consultancy/shared';
import { AppError } from '@consultancy/shared/utils/errors';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import verificationRoutes from './routes/verification';
import healthRoutes from './routes/health';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  const server = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: { colorize: true }
      } : undefined
    },
  });

  server.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      if (error.statusCode >= 500) {
        logger.error('Request error', { message: error.message, path: request.url });
      }
      reply.code(error.statusCode).send(error.toJSON());
      return;
    }
    logger.error('Unhandled request error', { message: error.message, path: request.url });
    reply.code(error.statusCode || 500).send({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  });

  // Register plugins
  await server.register(helmet);
  await server.register(cors, { origin: true, credentials: true });
  await server.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  await server.register(swagger, {
    swagger: {
      info: {
        title: 'User Service API',
        description: 'Authentication and user management service',
        version: '1.0.0',
      },
      host: `localhost:${PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await server.register(swaggerUI, { routePrefix: '/docs' });

  // Register routes
  await server.register(authRoutes, { prefix: '/auth' });
  await server.register(usersRoutes, { prefix: '/users' });
  await server.register(verificationRoutes, { prefix: '/verification' });
  await server.register(healthRoutes);

  // Start server
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`User Service started on http://${HOST}:${PORT}`);
    console.log(`API Documentation: http://${HOST}:${PORT}/docs`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down User Service...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();