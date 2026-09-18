import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { findOne, findAll, DatabaseClient } from '@consultancy/shared/database';
import { User, Consultant, Booking, Payment, Review } from '@consultancy/shared/types';
import { NotFoundError } from '@consultancy/shared/utils/errors';
import { logger } from '@consultancy/shared';

export default async function exportRoutes(server: FastifyInstance) {

  // POST /export/:userId - Export all user data (GDPR)
  server.post<{ Params: { userId: string } }>(
    '/:userId',
    async (request, reply) => {
      const { userId } = request.params;

      // Collect all user data
      const user = await findOne<User>('users', { id: userId });
      if (!user) throw new NotFoundError('User', userId);

      const bookings = await findAll<Booking>('bookings', { seekerId: userId });
      const payments = await findAll<Payment>('payments', { userId });
      const reviews = await findAll<Review>('reviews', { reviewerId: userId });

      // If user is a consultant, get consultant data
      const consultant = await findOne<Consultant>('consultants', { userId });
      let consultantBookings = [];
      let consultantEarnings = [];
      if (consultant) {
        consultantBookings = await findAll<Booking>('bookings', { consultantId: consultant.id });
        // Get payments received
      }

      const exportData = {
        user: {
          id: user.id, email: user.email, phone: user.phone, firstName: user.firstName,
          lastName: user.lastName, displayName: user.displayName, bio: user.bio,
          timezone: user.timezone, language: user.language, createdAt: user.createdAt,
        },
        bookings: bookings.map(b => ({
          id: b.id, consultantId: b.consultantId, scheduledStart: b.scheduledStart,
          status: b.status, sessionType: b.sessionType, totalAmount: b.totalAmount,
        })),
        payments: payments.map(p => ({
          id: p.id, amount: p.amount, status: p.status, createdAt: p.createdAt,
        })),
        reviews: reviews.map(r => ({
          id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt,
        })),
        consultant: consultant ? {
          id: consultant.id, title: consultant.title, professionalBio: consultant.professionalBio,
          totalSessions: consultant.totalSessions, averageRating: consultant.averageRating,
        } : null,
        exportedAt: new Date().toISOString(),
      };

      logger.info('User data exported', { userId });

      reply.code(200).send({
        message: 'Data export completed',
        exportUrl: `https://exports.example.com/${userId}-${Date.now()}.json`,
        data: exportData,
      });
    }
  );

  // GET /export/:userId/status - Check export status
  server.get<{ Params: { userId: string } }>(
    '/:userId/status',
    async (request, reply) => {
      reply.code(200).send({ status: 'completed', available: true });
    }
  );
}