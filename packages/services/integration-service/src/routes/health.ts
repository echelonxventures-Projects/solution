import { FastifyInstance } from 'fastify';

export default async function healthRoutes(server: FastifyInstance) {
  server.get('/health', async (request, reply) => {
    reply.code(200).send({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  server.get('/ready', async (request, reply) => { reply.code(200).send({ ready: true }); });
}