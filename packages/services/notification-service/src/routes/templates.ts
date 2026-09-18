import { FastifyInstance } from 'fastify';

const templates: Record<string, { subject: string; body: string }> = {
  'welcome': { subject: 'Welcome to Consultancy Platform', body: 'Hi {{name}}, welcome to our platform!' },
  'booking-confirmation': { subject: 'Booking Confirmed', body: 'Your booking with {{consultantName}} is confirmed for {{date}}.' },
  'session-reminder': { subject: 'Session Reminder', body: 'Your session starts in {{minutes}} minutes.' },
  'payment-success': { subject: 'Payment Successful', body: 'Payment of {{amount}} has been processed.' },
  'review-request': { subject: 'Review Your Session', body: 'Please review your recent session with {{consultantName}}.' },
};

export default async function templatesRoutes(server: FastifyInstance) {

  server.get('/', async (request, reply) => {
    reply.code(200).send({ templates: Object.entries(templates).map(([key, val]) => ({ key, ...val })) });
  });

  server.get('/:key', async (request, reply) => {
    const { key } = request.params as { key: string };
    const template = templates[key as keyof typeof templates];
    if (!template) return reply.code(404).send({ error: 'Template not found' });
    reply.code(200).send({ key, ...template });
  });

  server.post('/', async (request, reply) => {
    const { key, subject, body } = request.body as { key: string; subject: string; body: string };
    templates[key] = { subject, body };
    reply.code(201).send({ key, subject, body });
  });
}