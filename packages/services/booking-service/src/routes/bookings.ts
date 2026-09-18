import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ValidationError, NotFoundError, ConflictError, BusinessError, ErrorCode } from '@consultancy/shared/utils/errors';
import { insert, findOne, findAll, update, DatabaseClient } from '@consultancy/shared/database';
import { publishBookingEvent, publishSessionEvent } from '@consultancy/shared/events';
import { Booking, BookingStatus, Consultant, User,  SessionType, PricingModel, PaymentStatus } from '@consultancy/shared/types';
import { logger } from '@consultancy/shared';
import { addMinutes } from 'date-fns';

// Booking routes - Booking management endpoints
// Handles: create, read, update, cancel, reschedule bookings

const createBookingSchema = z.object({
  consultantId: z.string().uuid(),
  verticalId: z.string().uuid(),
  scheduledStart: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(480),
  sessionType: z.enum(['video', 'audio', 'chat', 'in_person']),
  pricingModel: z.enum(['per_minute', 'per_hour', 'per_session', 'package']).optional(),
  topic: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  urgencyLevel: z.enum(['normal', 'urgent', 'emergency']).optional(),
  discountCode: z.string().max(50).optional(),
});

const cancelBookingSchema = z.object({
  reason: z.string().min(1).max(500),
});

const rescheduleBookingSchema = z.object({
  newScheduledStart: z.string().datetime(),
  newDurationMinutes: z.number().int().min(5).max(480).optional(),
});

const getBookingsSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled']).optional(),
  seekerId: z.string().uuid().optional(),
  consultantId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Helper - Check slot availability
async function checkSlotAvailability(consultantId: string, startTime: Date, endTime: Date): Promise<boolean> {
  const db = DatabaseClient.getInstance();

  // Check for overlapping bookings
  const result = await db.query(`
    SELECT COUNT(*) as count FROM bookings
    WHERE consultant_id = $1
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      (scheduled_start <= $2 AND scheduled_end > $2) OR
      (scheduled_start < $3 AND scheduled_end >= $3) OR
      (scheduled_start >= $2 AND scheduled_end <= $3)
    )
  `, [consultantId, startTime, endTime]);

  return result.rows[0]?.count === 0;
}

// Helper - Calculate price with platform fee
async function calculatePrice(consultant: Consultant, durationMinutes: number, pricingModel: PricingModel): Promise<{
  baseAmount: number;
  platformFee: number;
  consultantEarnings: number;
  totalAmount: number;
}> {
  let baseAmount = 0;
  const platformFeePercent = 0.20;

  switch (pricingModel) {
    case PricingModel.PER_MINUTE:
      baseAmount = (consultant.baseRate || 1) * durationMinutes;
      break;
    case PricingModel.PER_HOUR:
      baseAmount = (consultant.baseRate || 50) * (durationMinutes / 60);
      break;
    case PricingModel.PER_SESSION:
      baseAmount = consultant.baseRate || 50;
      break;
    case PricingModel.PACKAGE:
      baseAmount = consultant.baseRate || 100;
      break;
    default:
      baseAmount = consultant.baseRate || 50;
  }

  const platformFee = baseAmount * platformFeePercent;
  const consultantEarnings = baseAmount - platformFee;

  return { baseAmount, platformFee, consultantEarnings, totalAmount: baseAmount };
}

// ===== ROUTES =====

export default async function bookingsRoutes(server: FastifyInstance) {
  // POST /bookings - Create booking
  server.post<{ Body: z.infer<typeof createBookingSchema> }>(
    '/',
    {
      schema: {
        tags: ['bookings'],
        summary: 'Create booking',
        body: { type: 'object' },
        response: { 201: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const validation = createBookingSchema.safeParse(request.body);
      if (!validation.success) {
        throw new ValidationError('Invalid booking data', validation.error.errors);
      }

      const data = validation.data;
      const seekerId = 'test-seeker';

      const consultant = await findOne<Consultant>('consultants', { id: data.consultantId });
      if (!consultant || consultant.isAvailable === false) {
        throw new NotFoundError('Consultant', data.consultantId);
      }

      const scheduledStart = new Date(data.scheduledStart);
      const scheduledEnd = addMinutes(scheduledStart, data.durationMinutes);

      const isAvailable = await checkSlotAvailability(data.consultantId, scheduledStart, scheduledEnd);
      if (!isAvailable) {
        throw new ConflictError(ErrorCode.SLOT_NOT_AVAILABLE, 'Selected time slot is not available');
      }

      // Calculate price
      const pricing = await calculatePrice(consultant, data.durationMinutes, data.pricingModel as PricingModel);

      // Check if first-time client
      const previousBookings = await findAll<Booking>('bookings', { seekerId, consultantId: data.consultantId });
      const firstTimeClient = previousBookings.length === 0;

      // Create booking
      const booking = await insert<Booking>('bookings', {
        seekerId,
        consultantId: data.consultantId,
        verticalId: data.verticalId,
        status: BookingStatus.PENDING,
        scheduledStart,
        scheduledEnd,
        timezone: consultant.timezone || 'UTC',
        durationMinutes: data.durationMinutes,
        sessionType: data.sessionType as SessionType,
        locationType: 'online',
        pricingModel: data.pricingModel as PricingModel,
        baseAmount: pricing.baseAmount,
        platformFee: pricing.platformFee,
        consultantEarnings: pricing.consultantEarnings,
        currency: 'USD',
        discountApplied: 0,
        taxAmount: 0,
        totalAmount: pricing.totalAmount,
        paymentStatus: PaymentStatus.PENDING,
        topic: data.topic,
        description: data.description,
        urgencyLevel: data.urgencyLevel || 'normal',
        attachments: [],
        firstTimeClient,
        aiSuggestedQuestions: [],
        aiInsights: {},
        reminderSent: false,
        reminder24hSent: false,
        reminder1hSent: false,
        reminder15mSent: false,
      });

      // Publish booking.created event
      await publishBookingEvent('booking.created', { id: booking.id, seekerId, consultantId: data.consultantId }, 'booking-service');

      logger.info('Booking created', { bookingId: booking.id, seekerId, consultantId: data.consultantId });

      reply.code(201).send({
        booking: {
          id: booking.id,
          status: booking.status,
          scheduledStart: booking.scheduledStart,
          scheduledEnd: booking.scheduledEnd,
          durationMinutes: booking.durationMinutes,
          sessionType: booking.sessionType,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
          paymentRequired: true,
        },
        payment: {
          amount: pricing.totalAmount,
          currency: 'USD',
        },
      });
    }
  );

  // GET /bookings/:id - Get booking details
  server.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['bookings'],
        summary: 'Get booking details',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const booking = await findOne<Booking>('bookings', { id });
      if (!booking) {
        throw new NotFoundError('Booking', id);
      }

      const consultant = await findOne<Consultant>('consultants', { id: booking.consultantId });
      const seeker = await findOne<User>('users', { id: booking.seekerId });

      reply.code(200).send({
        id: booking.id,
        seeker: {
          id: booking.seekerId,
          firstName: seeker?.firstName,
          lastName: seeker?.lastName,
        },
        consultant: {
          id: booking.consultantId,
          title: consultant?.title,
        },
        verticalId: booking.verticalId,
        status: booking.status,
        scheduledStart: booking.scheduledStart,
        scheduledEnd: booking.scheduledEnd,
        timezone: booking.timezone,
        durationMinutes: booking.durationMinutes,
        sessionType: booking.sessionType,
        topic: booking.topic,
        description: booking.description,
        pricingModel: booking.pricingModel,
        baseAmount: booking.baseAmount,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      });
    }
  );

  // GET /bookings - List bookings
  server.get<{ Querystring: z.infer<typeof getBookingsSchema> }>(
    '/',
    {
      schema: {
        tags: ['bookings'],
        summary: 'List bookings',
        querystring: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { status, seekerId, consultantId, limit, offset } = request.query;

      let bookings = await findAll<Booking>('bookings', {}, { limit, offset, order: 'created_at DESC' });

      if (status) bookings = bookings.filter(b => b.status === status);
      if (seekerId) bookings = bookings.filter(b => b.seekerId === seekerId);
      if (consultantId) bookings = bookings.filter(b => b.consultantId === consultantId);

      reply.code(200).send({
        bookings: bookings.map(b => ({
          id: b.id,
          seekerId: b.seekerId,
          consultantId: b.consultantId,
          status: b.status,
          scheduledStart: b.scheduledStart,
          sessionType: b.sessionType,
          totalAmount: b.totalAmount,
          createdAt: b.createdAt,
        })),
        total: bookings.length,
        limit,
        offset,
      });
    }
  );

  // PUT /bookings/:id/confirm - Confirm booking (after payment)
  server.put<{ Params: { id: string } }>(
    '/:id/confirm',
    {
      schema: {
        tags: ['bookings'],
        summary: 'Confirm booking',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const booking = await findOne<Booking>('bookings', { id });
      if (!booking) {
        throw new NotFoundError('Booking', id);
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new BusinessError(ErrorCode.CANNOT_CANCEL, 'Booking is not in pending status');
      }

      const updated = await update<Booking>('bookings', id, {
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
        paymentStatus: PaymentStatus.COMPLETED,
      });

      await publishBookingEvent('booking.confirmed', { id, status: 'confirmed' }, 'booking-service');

      logger.info('Booking confirmed', { bookingId: id });

      reply.code(200).send(updated);
    }
  );

  // PUT /bookings/:id/cancel - Cancel booking
  server.put<{ Params: { id: string }; Body: z.infer<typeof cancelBookingSchema> }>(
    '/:id/cancel',
    {
      schema: {
        tags: ['bookings'],
        summary: 'Cancel booking',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { reason } = request.body;

      const booking = await findOne<Booking>('bookings', { id });
      if (!booking) {
        throw new NotFoundError('Booking', id);
      }

      if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
        throw new BusinessError(ErrorCode.CANNOT_CANCEL, 'Booking cannot be cancelled');
      }

      const consultant = await findOne<Consultant>('consultants', { id: booking.consultantId });
      const hoursUntilSession = (new Date(booking.scheduledStart).getTime() - Date.now()) / (1000 * 60 * 60);
      const policy = consultant?.cancellationPolicy || { freeCancellationHours: 24 };

      let refundAmount = booking.totalAmount;
      if (hoursUntilSession < policy.freeCancellationHours) {
        refundAmount = 0;
      }

      const updated = await update<Booking>('bookings', id, {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      });

      await publishBookingEvent('booking.cancelled', { id, reason, refundAmount }, 'booking-service');

      logger.info('Booking cancelled', { bookingId: id, reason, refundAmount });

      reply.code(200).send({
        booking: updated,
        refund: {
          amount: refundAmount,
          eligible: refundAmount > 0,
        },
      });
    }
  );

  // PUT /bookings/:id/reschedule - Reschedule booking
  server.put<{ Params: { id: string }; Body: z.infer<typeof rescheduleBookingSchema> }>(
    '/:id/reschedule',
    {
      schema: {
        tags: ['bookings'],
        summary: 'Reschedule booking',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const validation = rescheduleBookingSchema.safeParse(request.body);
      if (!validation.success) {
        throw new ValidationError('Invalid reschedule data', validation.error.errors);
      }

      const booking = await findOne<Booking>('bookings', { id });
      if (!booking) {
        throw new NotFoundError('Booking', id);
      }

      if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING) {
        throw new BusinessError(ErrorCode.CANNOT_CANCEL, 'Booking cannot be rescheduled');
      }

      const newStart = new Date(validation.data.newScheduledStart);
      const newDuration = validation.data.newDurationMinutes || booking.durationMinutes;
      const newEnd = addMinutes(newStart, newDuration);

      const isAvailable = await checkSlotAvailability(booking.consultantId, newStart, newEnd);
      if (!isAvailable) {
        throw new ConflictError(ErrorCode.SLOT_NOT_AVAILABLE, 'New time slot is not available');
      }

      const consultant = await findOne<Consultant>('consultants', { id: booking.consultantId });
      if (newDuration !== booking.durationMinutes && consultant) {
        const newPricing = await calculatePrice(consultant, newDuration, booking.pricingModel as PricingModel);
        booking.baseAmount = newPricing.baseAmount;
        booking.totalAmount = newPricing.totalAmount;
      }

      const updated = await update<Booking>('bookings', id, {
        scheduledStart: newStart,
        scheduledEnd: newEnd,
        durationMinutes: newDuration,
        baseAmount: booking.baseAmount,
        totalAmount: booking.totalAmount,
      });

      await publishBookingEvent('booking.rescheduled', { id, newStart }, 'booking-service');

      logger.info('Booking rescheduled', { bookingId: id, newStart });

      reply.code(200).send(updated);
    }
  );

  // PUT /bookings/:id/start - Start session
  server.put<{ Params: { id: string } }>(
    '/:id/start',
    {
      schema: {
        tags: ['bookings'],
        summary: 'Start session',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const booking = await findOne<Booking>('bookings', { id });
      if (!booking) {
        throw new NotFoundError('Booking', id);
      }

      if (booking.status !== BookingStatus.CONFIRMED) {
        throw new BusinessError(ErrorCode.CANNOT_CANCEL, 'Booking must be confirmed to start');
      }

      const updated = await update<Booking>('bookings', id, {
        status: BookingStatus.IN_PROGRESS,
        startedAt: new Date(),
      });

      await publishSessionEvent('session.started', { bookingId: id }, 'booking-service');

      logger.info('Session started', { bookingId: id });

      reply.code(200).send(updated);
    }
  );

  // PUT /bookings/:id/complete - Complete session
  server.put<{ Params: { id: string }; Body: { notes?: string; actualDuration?: number } }>(
    '/:id/complete',
    {
      schema: {
        tags: ['bookings'],
        summary: 'Complete session',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { notes, actualDuration } = request.body;

      const booking = await findOne<Booking>('bookings', { id });
      if (!booking) {
        throw new NotFoundError('Booking', id);
      }

      if (booking.status !== BookingStatus.IN_PROGRESS) {
        throw new BusinessError(ErrorCode.CANNOT_CANCEL, 'Booking is not in progress');
      }

      const updated = await update<Booking>('bookings', id, {
        status: BookingStatus.COMPLETED,
        endedAt: new Date(),
        notes,
      });

      const consultant = await findOne<Consultant>('consultants', { id: booking.consultantId });
      if (consultant) {
        await update('consultants', booking.consultantId, {
          totalSessions: consultant.totalSessions + 1,
          totalHours: consultant.totalHours + (actualDuration || booking.durationMinutes) / 60,
          earningsTotal: consultant.earningsTotal + booking.consultantEarnings,
          completionRate: Math.min(100, consultant.completionRate + 1),
        });
      }

      await publishSessionEvent('session.ended', { bookingId: id, actualDuration }, 'booking-service');

      logger.info('Session completed', { bookingId: id });

      reply.code(200).send(updated);
    }
  );

  // PUT /bookings/:id/no-show - Mark as no-show
  server.put<{ Params: { id: string }; Body: { userType: 'seeker' | 'consultant' } }>(
    '/:id/no-show',
    {
      schema: {
        tags: ['bookings'],
        summary: 'Mark as no-show',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { userType } = request.body;

      const booking = await findOne<Booking>('bookings', { id });
      if (!booking) {
        throw new NotFoundError('Booking', id);
      }

      const updated = await update<Booking>('bookings', id, {
        status: BookingStatus.NO_SHOW,
      });

      logger.info('Booking marked as no-show', { bookingId: id, userType });

      reply.code(200).send(updated);
    }
  );
}