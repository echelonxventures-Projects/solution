import { FastifyInstance } from 'fastify';
import { insert, findOne } from '@consultancy/shared/database';
import { logger, publishPaymentEvent } from '@consultancy/shared';

// Webhook routes - External webhook handlers

export default async function webhooksRoutes(server: FastifyInstance) {

  // POST /webhooks/whatsapp - WhatsApp webhook
  server.post('/whatsapp', async (request, reply) => {
    const body = request.body as any;
    logger.info('WhatsApp webhook received', { body });

    if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
      const _message = body.entry[0].changes[0].value.messages[0];
      // Process through AI chatbot
    }

    reply.code(200).send({ status: 'processed' });
  });

  // POST /webhooks/stripe - Stripe payment webhook
  server.post('/stripe', async (request, reply) => {
    const body = request.body as any;
    const eventType = body.type;

    logger.info('Stripe webhook received', { type: eventType });

    switch (eventType) {
      case 'payment_intent.succeeded':
        await publishPaymentEvent('payment.completed', {
          paymentId: body.data.object.id,
          amount: body.data.object.amount,
        }, 'integration-service');
        break;
      case 'payment_intent.payment_failed':
        await publishPaymentEvent('payment.failed', {
          paymentId: body.data.object.id,
          error: body.data.object.last_payment_error,
        }, 'integration-service');
        break;
      case 'invoice.payment_succeeded':
        // Subscription payment
        break;
    }

    reply.code(200).send({ received: true });
  });

  // POST /webhooks/paypal - PayPal webhook
  server.post('/paypal', async (request, reply) => {
    const body = request.body as any;
    logger.info('PayPal webhook received', { body });
    reply.code(200).send({ status: 'processed' });
  });

  // POST /webhooks/google-calendar - Google Calendar webhook
  server.post('/google-calendar', async (request, reply) => {
    const body = request.body as any;
    logger.info('Google Calendar webhook', { body });
    reply.code(200).send({ status: 'processed' });
  });

  // POST /webhooks/custom - Custom webhook for partners
  server.post<{ Params: { partnerId: string } }>(
    '/custom/:partnerId',
    async (request, reply) => {
      const { partnerId } = request.params;
      const body = request.body;

      // Log webhook
      await insert('webhook_logs', {
        partnerId,
        payload: body,
        receivedAt: new Date(),
        status: 'received',
      });

      reply.code(200).send({ received: true, partnerId });
    }
  );

  // GET /webhooks/:id - Get webhook log
  server.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const log = await findOne('webhook_logs', { id: request.params.id });
      if (!log) return reply.code(404).send({ error: 'Not found' });
      reply.code(200).send(log);
    }
  );
}