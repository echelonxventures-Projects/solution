// Notification Service - Multi-channel notifications
// Handles: notifications, templates, channels (email, sms, push, whatsapp)
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { logger, EventBus } from '@consultancy/shared';
import notificationsRoutes from './routes/notifications.js';
import templatesRoutes from './routes/templates.js';
import channelsRoutes from './routes/channels.js';
import healthRoutes from './routes/health.js';
import fastify from 'fastify';

const PORT = parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3010', 10);

const server = fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });

async function main() {
  await server.register(helmet);
  await server.register(cors);
  await server.register(swagger, { swagger: { info: { title: 'Notification Service API', version: '1.0.0' }, tags: [{ name: 'notifications' }, { name: 'templates' }] } });
  await server.register(swaggerUI, { routePrefix: '/docs' });

  await server.register(notificationsRoutes, { prefix: '/notifications' });
  await server.register(templatesRoutes, { prefix: '/templates' });
  await server.register(channelsRoutes, { prefix: '/channels' });
  await server.register(healthRoutes);
}

// Subscribe to events
const bus = EventBus.getInstance();
bus.subscribe<{ id?: string }>('user-events', async (payload) => {
  if (payload.eventType === 'user.created') {
    // Send welcome email
    logger.info('Sending welcome email', { userId: payload.data.id });
  }
});
bus.subscribe<{ id?: string }>('booking-events', async (payload) => {
  if (payload.eventType === 'booking.confirmed') {
    // Send booking confirmation
    logger.info('Sending booking confirmation', { bookingId: payload.data.id });
  }
});

server.setErrorHandler((error, request, reply) => {
  reply.code(error.statusCode || 500).send({ error: { message: error.message } });
});

const start = async () => {
  await main();
  await server.listen({ port: PORT, host: '0.0.0.0' });
  logger.info(`Notification Service started on port ${PORT}`);
};
start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default server;