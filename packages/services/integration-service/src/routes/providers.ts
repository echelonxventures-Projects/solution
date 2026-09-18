import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function providersRoutes(server: FastifyInstance) {

  // GET /providers - List available integration providers
  server.get('/', async (request, reply) => {
    reply.code(200).send({
      providers: [
        { name: 'WhatsApp Business', type: 'messaging', enabled: true },
        { name: 'Stripe', type: 'payment', enabled: true },
        { name: 'PayPal', type: 'payment', enabled: true },
        { name: 'Google Calendar', type: 'calendar', enabled: true },
        { name: 'Outlook Calendar', type: 'calendar', enabled: false },
        { name: 'Google OAuth', type: 'social_login', enabled: true },
        { name: 'Apple OAuth', type: 'social_login', enabled: true },
        { name: 'Facebook OAuth', type: 'social_login', enabled: false },
        { name: 'SendGrid', type: 'email', enabled: true },
        { name: 'Twilio', type: 'sms', enabled: true },
        { name: 'Firebase FCM', type: 'push', enabled: true },
      ],
    });
  });

  // GET /providers/:name/config - Get provider configuration
  server.get<{ Params: { name: string } }>(
    '/:name/config',
    async (request, reply) => {
      const { name } = request.params;

      // Return public config (not secrets)
      reply.code(200).send({
        name,
        configured: true,
        features: ['basic', 'advanced'],
      });
    }
  );

  // PUT /providers/:name/enable - Enable provider
  server.put<{ Params: { name: string } }>(
    '/:name/enable',
    async (request, reply) => {
      reply.code(200).send({ message: `Provider ${request.params.name} enabled` });
    }
  );

  // PUT /providers/:name/disable - Disable provider
  server.put<{ Params: { name: string } }>(
    '/:name/disable',
    async (request, reply) => {
      reply.code(200).send({ message: `Provider ${request.params.name} disabled` });
    }
  );
}