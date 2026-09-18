import { FastifyInstance } from 'fastify';
import { NotFoundError } from '@consultancy/shared/utils/errors';
import { findOne, findAll } from '@consultancy/shared/database';
import { Vertical, Consultant, ConsultantVertical, Booking } from '@consultancy/shared/types';

export default async function analyticsRoutes(server: FastifyInstance) {

  // GET /analytics/:id - Get vertical analytics
  server.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Get vertical analytics',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const vertical = await findOne<Vertical>('verticals', { id });
      if (!vertical) {
        throw new NotFoundError('Vertical', id);
      }

      // Get consultant verticals for this vertical
      const consultantVerticals = await findAll<ConsultantVertical>('consultant_verticals', { verticalId: id });

      // Get all consultants in this vertical
      const consultantIds = consultantVerticals.map(cv => cv.consultantId);
      const consultants = await findAll<Consultant>('consultants', {});

      const verticalConsultants = consultants.filter(c => consultantIds.includes(c.id) && c.status === 'active');

      // Calculate metrics
      const activeConsultants = verticalConsultants.filter(c => c.status === 'active');
      const avgRating = verticalConsultants.reduce((sum, c) => sum + c.averageRating, 0) / verticalConsultants.length || 0;

      reply.code(200).send({
        verticalId: id,
        name: vertical.name,
        metrics: {
          totalConsultants: verticalConsultants.length,
          activeConsultants: activeConsultants.length,
          verifiedConsultants: verticalConsultants.filter(c => c.verificationStatus !== 'unverified').length,
          averageRating: Math.round(avgRating * 100) / 100,
          totalSessions: vertical.totalSessions,
          totalRevenue: vertical.totalRevenue,
        },
        distribution: {
          byExpertise: {
            beginner: consultantVerticals.filter(cv => cv.expertiseLevel === 'beginner').length,
            intermediate: consultantVerticals.filter(cv => cv.expertiseLevel === 'intermediate').length,
            expert: consultantVerticals.filter(cv => cv.expertiseLevel === 'expert').length,
            master: consultantVerticals.filter(cv => cv.expertiseLevel === 'master').length,
          },
          byPricingModel: {
            perMinute: verticalConsultants.filter(c => c.pricingModel === 'per_minute').length,
            perHour: verticalConsultants.filter(c => c.pricingModel === 'per_hour').length,
            perSession: verticalConsultants.filter(c => c.pricingModel === 'per_session').length,
            package: verticalConsultants.filter(c => c.pricingModel === 'package').length,
          },
        },
      });
    }
  );

  // GET /analytics/:id/trends - Get vertical trends
  server.get<{ Params: { id: string }; Querystring: { period?: string } }>(
    '/:id/trends',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Get vertical trends',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { period: _period } = request.query;

      const vertical = await findOne<Vertical>('verticals', { id });
      if (!vertical) {
        throw new NotFoundError('Vertical', id);
      }

      // Get bookings for this vertical
      const bookings = await findAll<Booking>('bookings', { verticalId: id });

      // Calculate trends (simplified - in production would use time-series data)
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

      reply.code(200).send({
        verticalId: id,
        name: vertical.name,
        trends: {
          bookingsGrowth: 0, // Would calculate from historical data
          revenueGrowth: 0,
          consultantGrowth: 0,
          popularityScore: vertical.popularityScore,
        },
        summary: {
          totalBookings: bookings.length,
          completedBookings: completedBookings.length,
          totalRevenue,
          averageBookingValue: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0,
        },
      });
    }
  );

  // GET /analytics/top - Get top performing verticals
  server.get<{ Querystring: { limit?: number; sortBy?: string } }>(
    '/top',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Get top performing verticals',
        querystring: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { limit = 10, sortBy = 'popularityScore' } = request.query;

      const verticals = await findAll<Vertical>('verticals', { isActive: true }, { limit });

      // Sort by requested metric
      verticals.sort((a, b) => {
        if (sortBy === 'totalConsultants') return b.totalConsultants - a.totalConsultants;
        if (sortBy === 'totalRevenue') return b.totalRevenue - a.totalRevenue;
        if (sortBy === 'avgRating') return b.avgRating - a.avgRating;
        return b.popularityScore - a.popularityScore;
      });

      reply.code(200).send({
        topVerticals: verticals.slice(0, limit).map(v => ({
          id: v.id,
          name: v.name,
          code: v.code,
          totalConsultants: v.totalConsultants,
          totalSessions: v.totalSessions,
          totalRevenue: v.totalRevenue,
          avgRating: v.avgRating,
          popularityScore: v.popularityScore,
        })),
        sortBy,
      });
    }
  );
}