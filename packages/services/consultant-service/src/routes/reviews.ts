import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NotFoundError } from '@consultancy/shared/utils/errors';
import { findAll, findOne, insert, update } from '@consultancy/shared/database';
import { Review, Consultant } from '@consultancy/shared/types';
import { logger } from '@consultancy/shared';

// ===== SCHEMAS =====

const getReviewsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['recent', 'helpful', 'rating_high', 'rating_low']).default('recent'),
});

const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
  detailedRatings: z.object({
    communication: z.number().min(1).max(5).optional(),
    expertise: z.number().min(1).max(5).optional(),
    value: z.number().min(1).max(5).optional(),
    punctuality: z.number().min(1).max(5).optional(),
    professionalism: z.number().min(1).max(5).optional(),
  }).optional(),
});

const addResponseSchema = z.object({
  responseText: z.string().min(1).max(500),
});

// ===== ROUTES =====

export default async function reviewsRoutes(server: FastifyInstance) {

  // GET /reviews/:consultantId - Get consultant reviews
  server.get<{ Params: { consultantId: string }; Querystring: z.infer<typeof getReviewsSchema> }>(
    '/:consultantId',
    {
      schema: {
        tags: ['reviews'],
        summary: 'Get consultant reviews',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        querystring: { type: 'object' },
        response: {
          200: {
            type: 'object',
            properties: {
              reviews: { type: 'array' },
              averageRating: { type: 'number' },
              totalReviews: { type: 'number' },
            }
          }
        },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;
      const { limit, offset, sort } = request.query;

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      const reviews = await findAll<Review>('reviews', { referenceId: consultantId, reviewType: 'consultant' }, { limit, offset });

      // Sort reviews
      if (sort === 'rating_high') {
        reviews.sort((a, b) => b.rating - a.rating);
      } else if (sort === 'rating_low') {
        reviews.sort((a, b) => a.rating - b.rating);
      }

      reply.code(200).send({
        reviews: reviews.map(r => ({
          id: r.id,
          reviewerId: r.reviewerId,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          detailedRatings: r.detailedRatings,
          createdAt: r.createdAt,
          hasResponse: r.hasResponse,
          responseText: r.responseText,
          responseAt: r.responseAt,
        })),
        averageRating: consultant.averageRating,
        totalReviews: consultant.totalReviews,
      });
    }
  );

  // POST /reviews/:consultantId - Create review for consultant
  server.post<{ Params: { consultantId: string }; Body: z.infer<typeof createReviewSchema> }>(
    '/:consultantId',
    {
      schema: {
        tags: ['reviews'],
        summary: 'Create review for consultant',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        body: { type: 'object' },
        response: { 201: { type: 'object', properties: { id: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;
      const validation = createReviewSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({ error: validation.error.errors });
      }

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      const review = await insert<Review>('reviews', {
        reviewerId: 'test-user',
        reviewType: 'consultant',
        referenceId: consultantId,
        bookingId: validation.data.bookingId,
        rating: validation.data.rating,
        title: validation.data.title,
        comment: validation.data.comment,
        detailedRatings: validation.data.detailedRatings || {},
        status: 'pending',
        hasResponse: false,
      });

      // Update consultant metrics
      const allReviews = await findAll<Review>('reviews', { referenceId: consultantId, reviewType: 'consultant' });
      const totalReviews = allReviews.length;
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      await update<Consultant>('consultants', consultantId, {
        totalReviews,
        averageRating: Math.round(avgRating * 100) / 100,
      });

      logger.info('Review created', { reviewId: review.id, consultantId });

      reply.code(201).send({ id: review.id });
    }
  );

  // PUT /reviews/:reviewId/respond - Consultant responds to review
  server.put<{ Params: { reviewId: string }; Body: z.infer<typeof addResponseSchema> }>(
    '/:reviewId/respond',
    {
      schema: {
        tags: ['reviews'],
        summary: 'Respond to review',
        params: { type: 'object', properties: { reviewId: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      const { reviewId } = request.params;
      const { responseText } = request.body;

      const review = await findOne<Review>('reviews', { id: reviewId });
      if (!review) {
        throw new NotFoundError('Review', reviewId);
      }

      await update<Review>('reviews', reviewId, {
        hasResponse: true,
        responseText,
        responseAt: new Date(),
        // responderId: request.user.userId,
      });

      logger.info('Review response added', { reviewId });

      reply.code(200).send({ message: 'Response added successfully' });
    }
  );
}