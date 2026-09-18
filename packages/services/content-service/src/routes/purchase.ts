import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { insert, findOne, update } from '@consultancy/shared/database';
import { Content, Payment } from '@consultancy/shared/types';
import { NotFoundError, ValidationError } from '@consultancy/shared/utils/errors';
import { logger } from '@consultancy/shared';

const purchaseSchema = z.object({
  userId: z.string().uuid(),
  paymentMethodId: z.string(),
});

// Purchase routes - Content purchase handlers

export default async function purchaseRoutes(server: FastifyInstance) {

  // POST /purchase/:id - Purchase content
  server.post<{ Params: { id: string }; Body: z.infer<typeof purchaseSchema> }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      const validation = purchaseSchema.safeParse(request.body);
      if (!validation.success) throw new ValidationError('Invalid purchase data', validation.error.errors);

      const { userId, paymentMethodId } = validation.data;

      const content = await findOne<Content>('content', { id });
      if (!content) throw new NotFoundError('Content', id);

      if (content.pricing.model !== 'paid') {
        return reply.code(400).send({ error: 'Content is not for sale' });
      }

      const price = content.pricing.price || 0;

      // Create payment record
      const payment = await insert<Payment>('payments', {
        userId,
        paymentType: 'content',
        referenceId: id,
        status: 'pending',
        amount: price,
        currency: 'USD',
        finalAmount: price,
        paymentMethod: paymentMethodId,
        paymentProvider: 'stripe',
      });

      // Process payment with Stripe

      // Update content stats
      await update<Content>('content', id, {
        totalPurchases: content.totalPurchases + 1,
        totalRevenue: content.totalRevenue + price,
      });

      logger.info('Content purchased', { contentId: id, userId, price });

      reply.code(200).send({
        paymentId: payment.id,
        status: 'completed',
        accessGranted: true,
        streamUrl: content.fileUrl,
      });
    }
  );

  // GET /purchase/:id/check - Check purchase status
  server.get<{ Params: { id: string }; Querystring: { userId: string } }>(
    '/:id/check',
    async (request, reply) => {
      const { id } = request.params;
      const { userId } = request.query;

      const payment = await findOne<Payment>('payments', { referenceId: id, userId, paymentType: 'content' });
      const hasPurchased = payment && payment.status === 'completed';

      reply.code(200).send({ purchased: hasPurchased, paymentId: payment?.id });
    }
  );
}