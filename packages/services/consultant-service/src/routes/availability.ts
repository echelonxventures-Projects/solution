import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '@consultancy/shared/utils/errors';
import { findOne, findAll, insert, update } from '@consultancy/shared/database';
import { publishConsultantEvent } from '@consultancy/shared/events';
import { Consultant, Slot, SlotStatus } from '@consultancy/shared/types';
import { logger } from '@consultancy/shared';

// ===== SCHEMAS =====

const getAvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
});

const updateAvailabilitySchema = z.object({
  weeklySchedule: z.object({
    monday: z.any().optional(),
    tuesday: z.any().optional(),
    wednesday: z.any().optional(),
    thursday: z.any().optional(),
    friday: z.any().optional(),
    saturday: z.any().optional(),
    sunday: z.any().optional(),
  }),
  blackoutDates: z.array(z.string()).optional(),
  instantBookingEnabled: z.boolean().optional(),
  bufferTime: z.number().int().min(0).max(60).optional(),
});

const createSlotsSchema = z.object({
  slots: z.array(z.object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    timezone: z.string(),
    durationMinutes: z.number().int(),
    isRecurring: z.boolean().optional(),
    recurringPattern: z.any().optional(),
  })),
});

// ===== ROUTES =====

export default async function availabilityRoutes(server: FastifyInstance) {

  // GET /availability/:consultantId - Get consultant availability for a date
  server.get<{ Params: { consultantId: string }; Querystring: z.infer<typeof getAvailabilitySchema> }>(
    '/:consultantId',
    {
      schema: {
        tags: ['availability'],
        summary: 'Get consultant availability',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        querystring: { type: 'object', properties: { date: { type: 'string' }, durationMinutes: { type: 'number' } } },
        response: { 200: { type: 'object', properties: { slots: { type: 'array' }, timezone: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;
      const { date, durationMinutes } = request.query;

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      // Get slots for the date
      const startOfDay = new Date(`${date}T00:00:00Z`);
      const endOfDay = new Date(`${date}T23:59:59Z`);

      const slots = await findAll<Slot>('slots', { consultantId }, { order: 'start_time ASC' });

      // Filter slots for the specific date and status
      const availableSlots = slots.filter(slot => {
        const slotStart = new Date(slot.startTime);
        return slotStart >= startOfDay && slotStart <= endOfDay && slot.status === SlotStatus.AVAILABLE;
      });

      // Generate available time slots based on weekly schedule if no explicit slots
      if (availableSlots.length === 0 && consultant.weeklySchedule) {
        // Parse the day from date
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
        const daySchedule = consultant.weeklySchedule[dayOfWeek as keyof typeof consultant.weeklySchedule];

        if (daySchedule?.slots) {
          // Generate slots from schedule
          for (const scheduleSlot of daySchedule.slots) {
            const [_startHour, _startMin] = scheduleSlot.start.split(':').map(Number);
            const [_endHour, _endMin] = scheduleSlot.end.split(':').map(Number);

            availableSlots.push({
              id: `generated-${Date.now()}`,
              consultantId,
              startTime: new Date(`${date}T${scheduleSlot.start}:00Z`),
              endTime: new Date(`${date}T${scheduleSlot.end}:00Z`),
              timezone: consultant.timezone || 'UTC',
              durationMinutes: durationMinutes || 30,
              status: SlotStatus.AVAILABLE,
              isRecurring: false,
            } as Slot);
          }
        }
      }

      reply.code(200).send({
        slots: availableSlots.map(s => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          timezone: s.timezone,
          durationMinutes: s.durationMinutes,
          status: s.status,
        })),
        timezone: consultant.timezone || 'UTC',
      });
    }
  );

  // PUT /availability/:consultantId - Update consultant availability
  server.put<{ Params: { consultantId: string }; Body: z.infer<typeof updateAvailabilitySchema> }>(
    '/:consultantId',
    {
      schema: {
        tags: ['availability'],
        summary: 'Update consultant availability',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;
      const validation = updateAvailabilitySchema.safeParse(request.body);
      if (!validation.success) {
        throw new ValidationError('Invalid availability data', validation.error.errors);
      }

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      await update<Consultant>('consultants', consultantId, {
        weeklySchedule: validation.data.weeklySchedule,
        blackoutDates: validation.data.blackoutDates || [],
        instantBookingEnabled: validation.data.instantBookingEnabled || false,
        bufferTime: validation.data.bufferTime || 15,
      });

      await publishConsultantEvent('consultant.availability_updated', { consultantId }, 'consultant-service');

      logger.info('Availability updated', { consultantId });

      reply.code(200).send({ message: 'Availability updated successfully' });
    }
  );

  // POST /availability/:consultantId/slots - Create specific slots
  server.post<{ Params: { consultantId: string }; Body: z.infer<typeof createSlotsSchema> }>(
    '/:consultantId/slots',
    {
      schema: {
        tags: ['availability'],
        summary: 'Create availability slots',
        params: { type: 'object', properties: { consultantId: { type: 'string' } } },
        body: { type: 'object' },
        response: { 201: { type: 'object', properties: { slots: { type: 'array' }, created: { type: 'number' } } } },
      },
    },
    async (request, reply) => {
      const { consultantId } = request.params;
      const validation = createSlotsSchema.safeParse(request.body);
      if (!validation.success) {
        throw new ValidationError('Invalid slots data', validation.error.errors);
      }

      const consultant = await findOne<Consultant>('consultants', { id: consultantId });
      if (!consultant) {
        throw new NotFoundError('Consultant', consultantId);
      }

      const createdSlots: Slot[] = [];
      for (const slotData of validation.data.slots) {
        const slot = await insert<Slot>('slots', {
          consultantId,
          startTime: new Date(slotData.startTime),
          endTime: new Date(slotData.endTime),
          timezone: slotData.timezone,
          durationMinutes: slotData.durationMinutes,
          status: SlotStatus.AVAILABLE,
          isRecurring: slotData.isRecurring || false,
          recurringPattern: slotData.recurringPattern,
        });
        createdSlots.push(slot);
      }

      logger.info('Slots created', { consultantId, count: createdSlots.length });

      reply.code(201).send({
        slots: createdSlots.map(s => ({ id: s.id, startTime: s.startTime, endTime: s.endTime, status: s.status })),
        created: createdSlots.length,
      });
    }
  );

  // DELETE /availability/:consultantId/slots/:slotId - Delete a slot
  server.delete<{ Params: { consultantId: string; slotId: string } }>(
    '/:consultantId/slots/:slotId',
    {
      schema: {
        tags: ['availability'],
        summary: 'Delete availability slot',
        params: { type: 'object', properties: { consultantId: { type: 'string' }, slotId: { type: 'string' } } },
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      const { consultantId, slotId } = request.params;

      const slot = await findOne<Slot>('slots', { id: slotId, consultantId });
      if (!slot) {
        throw new NotFoundError('Slot', slotId);
      }

      if (slot.status === SlotStatus.BOOKED) {
        throw new ValidationError('Cannot delete booked slot');
      }

      await update<Slot>('slots', slotId, { status: SlotStatus.BLOCKED });

      logger.info('Slot deleted', { slotId, consultantId });

      reply.code(200).send({ message: 'Slot deleted' });
    }
  );
}