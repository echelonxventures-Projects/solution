import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DatabaseClient } from '@consultancy/shared/database';

export default async function healthRoutes(server: FastifyInstance) {
  server.get('/health', async (request, reply) => {
    reply.code(200).send({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
  });
  server.get('/ready', async (request, reply) => { reply.code(200).send({ ready: true }); });
}