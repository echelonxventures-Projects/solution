// Content Service - Content management and delivery
// Handles: content, upload, stream, purchase
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { logger } from '@consultancy/shared';
import contentRoutes from './routes/content.js';
import uploadRoutes from './routes/upload.js';
import streamRoutes from './routes/stream.js';
import purchaseRoutes from './routes/purchase.js';
import healthRoutes from './routes/health.js';
import fastify from 'fastify';

const PORT = parseInt(process.env.CONTENT_SERVICE_PORT || '3006', 10);

const server = fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });

async function main() {
  await server.register(helmet);
  await server.register(cors);
  await server.register(multipart);
  await server.register(swagger, { swagger: { info: { title: 'Content Service API', version: '1.0.0' }, tags: [{ name: 'content' }, { name: 'upload' }, { name: 'stream' }] } });
  await server.register(swaggerUI, { routePrefix: '/docs' });

  await server.register(contentRoutes, { prefix: '/content' });
  await server.register(uploadRoutes, { prefix: '/upload' });
  await server.register(streamRoutes, { prefix: '/stream' });
  await server.register(purchaseRoutes, { prefix: '/purchase' });
  await server.register(healthRoutes);
}

server.setErrorHandler((error, request, reply) => reply.code(error.statusCode || 500).send({ error: { message: error.message } }));

async function start() {
  await main();
  await server.listen({ port: PORT, host: '0.0.0.0' });
  logger.info(`Content Service started on port ${PORT}`);
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default server;