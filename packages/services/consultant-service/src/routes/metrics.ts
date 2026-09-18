import { FastifyInstance } from 'fastify';
import { NotFoundError } from '@consultancy/shared/utils/errors';
import { findOne, findAll } from '@consultancy/shared/database';
import { Consultant, Booking, Payment } from '@consultancy/shared/types';

// ===== ROUTES =====

export default async function metricsRoutes(server: FastifyInstance) {

  // GET /metrics/:consultantId - Get consultant performance metrics
  server.get<{ Params: { consultantId: string } }>(
    '/:consultantId',
    {
      schema: {
        tags: ['metrics'],
        summary: 'Get consultant performance metrics',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        response: {
          200: {
            type: 'object',
            properties: {
              totalSessions: { type: 'number' },
              totalHours: { type: 'number' },
              averageRating: { type: 'number' },
              totalReviews: { type: 'number' },
              repeatClientRate: { type: 'number' },
              responseTimeAvg: { type: 'number' },
              completionRate: { type: 'number' },
              earningsTotal: { type: 'number' },
              earningsThisMonth: { type: 'number' },
              recentBookings: { type: 'array' },
            }
          }
        },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      // Get recent bookings
      const bookings = await findAll<Booking>('bookings', { consultantId }, { limit: 10, order: 'created_at DESC' });

      // Get recent payments
      const payments = await findAll<Payment>('payments', { receiverId: consultant.userId }, { limit: 10 });

      reply.code(200).send({
        totalSessions: consultant.totalSessions,
        totalHours: consultant.totalHours,
        averageRating: consultant.averageRating,
        totalReviews: consultant.totalReviews,
        repeatClientRate: consultant.repeatClientRate,
        responseTimeAvg: consultant.responseTimeAvg,
        completionRate: consultant.completionRate,
        earningsTotal: consultant.earningsTotal,
        earningsThisMonth: consultant.earningsThisMonth,
        recentBookings: bookings.map(b => ({
          id: b.id,
          scheduledStart: b.scheduledStart,
          status: b.status,
          totalAmount: b.totalAmount,
        })),
        recentPayments: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt,
        })),
      });
    }
  );

  // GET /metrics/:consultantId/earnings - Get earnings breakdown
  server.get<{ Params: { consultantId: string }; Querystring: { period?: string } }>(
    '/:consultantId/earnings',
    {
      schema: {
        tags: ['metrics'],
        summary: 'Get earnings breakdown',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        querystring: { type: 'object', properties: { period: { type: 'string' } } },
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              thisMonth: { type: 'number' },
              thisWeek: { type: 'number' },
              today: { type: 'number' },
              pending: { type: 'number' },
            }
          }
        },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;
      const { period: _period } = request.query;

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      // Calculate period-specific earnings
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));

      // Get payments for the consultant
      const payments = await findAll<Payment>('payments', { receiverId: consultant.userId });

      const thisMonthPayments = payments.filter(p => new Date(p.createdAt) >= startOfMonth && p.status === 'completed');
      const thisWeekPayments = payments.filter(p => new Date(p.createdAt) >= startOfWeek && p.status === 'completed');
      const todayPayments = payments.filter(p => new Date(p.createdAt) >= startOfDay && p.status === 'completed');
      const pendingPayments = payments.filter(p => p.payoutStatus === 'pending');

      reply.code(200).send({
        total: consultant.earningsTotal,
        thisMonth: thisMonthPayments.reduce((sum, p) => sum + (p.receiverAmount || 0), 0),
        thisWeek: thisWeekPayments.reduce((sum, p) => sum + (p.receiverAmount || 0), 0),
        today: todayPayments.reduce((sum, p) => sum + (p.receiverAmount || 0), 0),
        pending: pendingPayments.reduce((sum, p) => sum + (p.receiverAmount || 0), 0),
      });
    }
  );

  // GET /metrics/:consultantId/analytics - Get detailed analytics
  server.get<{ Params: { consultantId: string } }>(
    '/:consultantId/analytics',
    {
      schema: {
        tags: ['metrics'],
        summary: 'Get detailed analytics',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      // Get all bookings for analytics
      const bookings = await findAll<Booking>('bookings', { consultantId });

      // Calculate analytics
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
      const noShowBookings = bookings.filter(b => b.status === 'no_show');

      // Average session duration
      const avgDuration = completedBookings.reduce((sum, b) => sum + b.durationMinutes, 0) / completedBookings.length || 0;

      // Most popular time slots
      const timeSlots: Record<string, number> = {};
      completedBookings.forEach(b => {
        const hour = new Date(b.scheduledStart).getHours();
        timeSlots[hour] = (timeSlots[hour] || 0) + 1;
      });

      // Most popular verticals
      const verticalCounts: Record<string, number> = {};
      bookings.forEach(b => {
        verticalCounts[b.verticalId] = (verticalCounts[b.verticalId] || 0) + 1;
      });

      reply.code(200).send({
        bookingsAnalytics: {
          total: bookings.length,
          completed: completedBookings.length,
          cancelled: cancelledBookings.length,
          noShow: noShowBookings.length,
          completionRate: bookings.length > 0 ? (completedBookings.length / bookings.length) * 100 : 0,
        },
        sessionAnalytics: {
          averageDurationMinutes: Math.round(avgDuration),
          totalMinutes: completedBookings.reduce((sum, b) => sum + b.durationMinutes, 0),
        },
        peakTimes: Object.entries(timeSlots)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([hour, count]) => ({ hour: parseInt(hour), count })),
        popularVerticals: Object.entries(verticalCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([verticalId, count]) => ({ verticalId, count })),
      });
    }
  );
}