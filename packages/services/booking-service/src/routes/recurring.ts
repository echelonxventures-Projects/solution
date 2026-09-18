import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '@consultancy/shared/utils/errors';
import { insert, findOne, findAll, update } from '@consultancy/shared/database';

import { Booking, BookingStatus } from '@consultancy/shared/types';
import { logger } from '@consultancy/shared';
import { addDays, addWeeks, addMonths } from 'date-fns';

const createRecurringSchema = z.object({
  consultantId: z.string().uuid(),
  verticalId: z.string().uuid(),
  sessionType: z.enum(['video', 'audio', 'chat']),
  durationMinutes: z.number().int().min(5).max(480),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
  pattern: z.object({
    type: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().int().min(1).max(10),
    endDate: z.string().datetime().optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // 0=Sunday
  }),
  topic: z.string().max(200).optional(),
});

export default async function recurringRoutes(server: FastifyInstance) {

  // POST /recurring - Create recurring booking
  server.post<{ Body: z.infer<typeof createRecurringSchema> }>(
    '/',
    {
      schema: {
        tags: ['recurring'],
        summary: 'Create recurring booking',
        body: { type: 'object' },
        response: { 201: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const validation = createRecurringSchema.safeParse(request.body);
      if (!validation.success) {
        throw new ValidationError('Invalid recurring booking data', validation.error.errors);
      }

      const data = validation.data;
      const seekerId = 'test-seeker';

      // Calculate recurring dates
      const recurringBookings: Partial<Booking>[] = [];
      const startDate = new Date();
      const endDate = data.pattern.endDate ? new Date(data.pattern.endDate) : addMonths(startDate, 3);

      let currentDate = startDate;

      while (currentDate <= endDate) {
        const [hours, minutes] = data.startTime.split(':').map(Number);
        const scheduledStart = new Date(currentDate);
        scheduledStart.setHours(hours, minutes, 0, 0);

        // Check if day matches pattern
        let matchesPattern = false;

        if (data.pattern.type === 'daily') {
          matchesPattern = true;
          currentDate = addDays(currentDate, data.pattern.interval);
        } else if (data.pattern.type === 'weekly') {
          if (data.pattern.daysOfWeek?.length) {
            matchesPattern = data.pattern.daysOfWeek.includes(scheduledStart.getDay());
          } else {
            matchesPattern = true;
          }
          currentDate = addWeeks(currentDate, data.pattern.interval);
        } else if (data.pattern.type === 'monthly') {
          matchesPattern = true;
          currentDate = addMonths(currentDate, data.pattern.interval);
        }

        if (matchesPattern && scheduledStart > new Date()) {
          recurringBookings.push({
            seekerId,
            consultantId: data.consultantId,
            verticalId: data.verticalId,
            status: BookingStatus.PENDING,
            scheduledStart,
            durationMinutes: data.durationMinutes,
            sessionType: data.sessionType,
            topic: data.topic,
          });
        }
      }

      // Create first booking as master
      const masterBooking = await insert<Booking>('bookings', {
        ...recurringBookings[0],
        timezone: 'UTC',
        pricingModel: 'per_session',
        baseAmount: 0,
        totalAmount: 0,
        paymentStatus: 'pending',
        attachments: [],
        aiSuggestedQuestions: [],
        aiInsights: {},
        reminderSent: false,
        reminder24hSent: false,
        reminder1hSent: false,
        reminder15mSent: false,
      });

      // Create subsequent bookings linked to master
      const createdBookings: Booking[] = [];
      for (let i = 1; i < recurringBookings.length; i++) {
        const booking = await insert<Booking>('bookings', {
          ...recurringBookings[i],
          recurringBookingId: masterBooking.id,
          timezone: 'UTC',
          pricingModel: 'per_session',
          baseAmount: 0,
          totalAmount: 0,
          paymentStatus: 'pending',
          attachments: [],
          aiSuggestedQuestions: [],
          aiInsights: {},
          reminderSent: false,
          reminder24hSent: false,
          reminder1hSent: false,
          reminder15mSent: false,
        });
        createdBookings.push(booking);
      }

      logger.info('Recurring bookings created', { masterBookingId: masterBooking.id, count: createdBookings.length + 1 });

      reply.code(201).send({
        masterBookingId: masterBooking.id,
        totalBookings: createdBookings.length + 1,
        bookings: [
          { id: masterBooking.id, scheduledStart: masterBooking.scheduledStart },
          ...createdBookings.map(b => ({ id: b.id, scheduledStart: b.scheduledStart })),
        ],
      });
    }
  );

  // GET /recurring/:id - Get recurring booking series
  server.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['recurring'],
        summary: 'Get recurring booking series',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const masterBooking = await findOne<Booking>('bookings', { id });
      if (!masterBooking) {
        throw new NotFoundError('Booking', id);
      }

      const recurringBookings = await findAll<Booking>('bookings', { recurringBookingId: id });

      reply.code(200).send({
        masterBooking,
        recurringBookings,
        totalSessions: recurringBookings.length + 1,
      });
    }
  );

  // PUT /recurring/:id/cancel - Cancel all recurring bookings
  server.put<{ Params: { id: string }; Body: { reason: string; cancelFutureOnly?: boolean } }>(
    '/:id/cancel',
    {
      schema: {
        tags: ['recurring'],
        summary: 'Cancel recurring bookings',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { reason, cancelFutureOnly } = request.body;

      const masterBooking = await findOne<Booking>('bookings', { id });
      if (!masterBooking) {
        throw new NotFoundError('Booking', id);
      }

      const recurringBookings = await findAll<Booking>('bookings', { recurringBookingId: id });

      // Cancel master booking
      if (!cancelFutureOnly) {
        await update<Booking>('bookings', id, {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: new Date(),
        });
      }

      // Cancel all recurring bookings
      for (const booking of recurringBookings) {
        if (cancelFutureOnly && new Date(booking.scheduledStart) < new Date()) {
          continue; // Skip past bookings
        }

        await update<Booking>('bookings', booking.id, {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: new Date(),
        });
      }

      logger.info('Recurring bookings cancelled', { masterBookingId: id, count: recurringBookings.length });

      reply.code(200).send({
        message: 'Recurring bookings cancelled',
        cancelledCount: recurringBookings.length,
      });
    }
  );

  // GET /recurring/user/:userId - Get user's recurring bookings
  server.get<{ Params: { userId: string } }>(
    '/user/:userId',
    {
      schema: {
        tags: ['recurring'],
        summary: 'Get user recurring bookings',
        params: { type: 'object', properties: { userId: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { userId } = request.params;

      // Find master bookings (those without recurringBookingId)
      const allBookings = await findAll<Booking>('bookings', { seekerId: userId });
      const masterBookings = allBookings.filter(b => !b.recurringBookingId);

      // For each master booking, check if it has recurring children
      const recurringSeries: { masterBooking: Booking; children: Booking[] }[] = [];

      for (const master of masterBookings) {
        const children = await findAll<Booking>('bookings', { recurringBookingId: master.id });
        if (children.length > 0 || master.recurringBookingId) {
          recurringSeries.push({ masterBooking: master, children });
        }
      }

      reply.code(200).send({
        recurringSeries,
        totalSeries: recurringSeries.length,
      });
    }
  );
}