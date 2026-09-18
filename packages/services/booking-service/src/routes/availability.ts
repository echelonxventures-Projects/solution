import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NotFoundError } from '@consultancy/shared/utils/errors';
import { findOne, findAll } from '@consultancy/shared/database';
import { Consultant, Slot, SlotStatus } from '@consultancy/shared/types';
import { addDays, format, parse, setHours, setMinutes, startOfDay, endOfDay, isWithinInterval, addMinutes, eachMinuteOfInterval } from 'date-fns';

const getAvailabilitySchema = z.object({
  consultantId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
});

export default async function availabilityRoutes(server: FastifyInstance) {

  // GET /availability - Check consultant availability
  server.get<{ Querystring: z.infer<typeof getAvailabilitySchema> }>(
    '/',
    {
      schema: {
        tags: ['availability'],
        summary: 'Check consultant availability',
        querystring: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { consultantId, date, durationMinutes } = request.query;

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      const targetDate = parse(date, 'yyyy-MM-dd', new Date());
      const dayOfWeek = format(targetDate, 'EEEE').toLowerCase();

      // Get weekly schedule
      const weeklySchedule = consultant.weeklySchedule as Record<string, { slots: { start: string; end: string }[] }>;
      const daySchedule = weeklySchedule[dayOfWeek];

      if (!daySchedule?.slots?.length) {
        reply.code(200).send({ availableSlots: [], timezone: consultant.timezone || 'UTC', message: 'No availability for this day' });
        return;
      }

      // Get existing bookings for the day
      const existingSlots = await findAll<Slot>('slots', { consultantId }, { order: 'start_time ASC' });
      const dayStart = startOfDay(targetDate);
      const dayEnd = endOfDay(targetDate);

      const dayBookings = existingSlots.filter(slot => {
        const slotStart = new Date(slot.startTime);
        return isWithinInterval(slotStart, { start: dayStart, end: dayEnd }) && slot.status === SlotStatus.BOOKED;
      });

      // Generate available slots
      const availableSlots: { start: string; end: string; available: boolean }[] = [];

      for (const scheduleSlot of daySchedule.slots) {
        const [startHour, startMin] = scheduleSlot.start.split(':').map(Number);
        const [endHour, endMin] = scheduleSlot.end.split(':').map(Number);

        const slotStart = setMinutes(setHours(targetDate, startHour), startMin);
        const slotEnd = setMinutes(setHours(targetDate, endHour), endMin);

        // Generate slots in increments of durationMinutes or 30 minutes
        const slotDuration = durationMinutes || 30;
        const slots = eachMinuteOfInterval({ start: slotStart, end: slotEnd }, { step: slotDuration });

        for (const slot of slots) {
          const slotEndTime = addMinutes(slot, slotDuration);

          // Check if this slot overlaps with any booked slot
          const isBooked = dayBookings.some(booking => {
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            return isWithinInterval(slot, { start: bookingStart, end: bookingEnd }) ||
                   isWithinInterval(slotEndTime, { start: bookingStart, end: bookingEnd }) ||
                   (slot <= bookingStart && slotEndTime >= bookingEnd);
          });

          // Check buffer time
          const bufferMinutes = consultant.bufferTime || 15;
          const slotWithBuffer = addMinutes(slot, -bufferMinutes);
          const slotEndWithBuffer = addMinutes(slotEndTime, bufferMinutes);

          const hasBufferConflict = dayBookings.some(booking => {
            const bookingStart = new Date(booking.startTime);
            return isWithinInterval(bookingStart, { start: slotWithBuffer, end: slotEndWithBuffer });
          });

          availableSlots.push({
            start: format(slot, 'HH:mm'),
            end: format(slotEndTime, 'HH:mm'),
            available: !isBooked && !hasBufferConflict && isAfter(slot, new Date()),
          });
        }
      }

      reply.code(200).send({
        consultantId,
        date,
        availableSlots,
        timezone: consultant.timezone || 'UTC',
        sessionDurationOptions: consultant.sessionDurationOptions,
        instantBookingEnabled: consultant.instantBookingEnabled,
      });
    }
  );

  // GET /availability/next/:consultantId - Get next available slot
  server.get<{ Params: { consultantId: string } }>(
    '/next/:consultantId',
    {
      schema: {
        tags: ['availability'],
        summary: 'Get next available slot',
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

      // Find next available day
      const maxDaysToCheck = consultant.advanceBookingLimit || 30;
      let nextAvailable: { date: string; slots: { start: string; end: string }[] } | null = null;

      for (let i = 0; i < maxDaysToCheck; i++) {
        const checkDate = addDays(new Date(), i);
        const dayOfWeek = format(checkDate, 'EEEE').toLowerCase();

        const weeklySchedule = consultant.weeklySchedule as Record<string, { slots: { start: string; end: string }[] }>;
        const daySchedule = weeklySchedule[dayOfWeek];

        if (daySchedule?.slots?.length) {
          // Check blackout dates
          const blackoutDates = consultant.blackoutDates as string[];
          const isBlackout = blackoutDates?.some(d => format(new Date(d), 'yyyy-MM-dd') === format(checkDate, 'yyyy-MM-dd'));

          if (!isBlackout) {
            nextAvailable = {
              date: format(checkDate, 'yyyy-MM-dd'),
              slots: daySchedule.slots,
            };
            break;
          }
        }
      }

      reply.code(200).send({
        consultantId,
        nextAvailable,
        timezone: consultant.timezone || 'UTC',
      });
    }
  );
}