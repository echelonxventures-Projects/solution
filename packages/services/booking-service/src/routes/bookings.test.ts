import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import bookingsRoutes from './bookings';

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  findAll: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  dbQuery: vi.fn(),
  publishBookingEvent: vi.fn(async () => {}),
  publishSessionEvent: vi.fn(async () => {}),
}));

vi.mock('@consultancy/shared/database', () => ({
  findOne: mocks.findOne,
  findAll: mocks.findAll,
  insert: mocks.insert,
  update: mocks.update,
  deleteOne: vi.fn(),
  softDelete: vi.fn(),
  DatabaseClient: { getInstance: () => ({ query: mocks.dbQuery }) },
}));

vi.mock('@consultancy/shared/events', () => ({
  publishBookingEvent: mocks.publishBookingEvent,
  publishSessionEvent: mocks.publishSessionEvent,
  publishUserEvent: vi.fn(),
  publishConsultantEvent: vi.fn(),
  publishPaymentEvent: vi.fn(),
  EventBus: { getInstance: vi.fn() },
}));

const CONSULTANT_ID = 'aaaaaaaa-1111-4111-8111-111111111111';
const VERTICAL_ID = 'bbbbbbbb-2222-4222-8222-222222222222';

function validBookingPayload(overrides: Record<string, unknown> = {}) {
  return {
    consultantId: CONSULTANT_ID,
    verticalId: VERTICAL_ID,
    scheduledStart: '2026-06-01T10:00:00Z',
    durationMinutes: 60,
    sessionType: 'video',
    pricingModel: 'per_hour',
    topic: 'Career advice',
    ...overrides,
  };
}

const baseConsultant = {
  id: CONSULTANT_ID,
  timezone: 'UTC',
  baseRate: 100,
  isAvailable: true,
};

describe('booking-service /bookings routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    app.register(bookingsRoutes, { prefix: '/bookings' });
    app.setErrorHandler((error, _request, reply) => {
      const err = error as { statusCode?: number; code?: string };
      reply.code(err.statusCode || 500).send({ error: { code: err.code || 'INTERNAL_ERROR', message: error.message } });
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbQuery.mockResolvedValue({ rows: [{ count: 0 }] });
    mocks.findAll.mockResolvedValue([]);
    mocks.publishBookingEvent.mockResolvedValue(undefined as never);
    mocks.publishSessionEvent.mockResolvedValue(undefined as never);
  });

  describe('POST /bookings', () => {
    it('creates a booking with correct pricing (per_hour, 20% platform fee)', async () => {
      mocks.findOne.mockResolvedValue(baseConsultant);
      mocks.insert.mockImplementation(async (_table: string, data: Record<string, unknown>) => ({
        id: 'booking-1',
        ...data,
      }));

      const res = await app.inject({ method: 'POST', url: '/bookings', payload: validBookingPayload() });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.booking.status).toBe('pending');
      expect(body.booking.totalAmount).toBe(100); // 100/hr * 60min
      expect(body.payment).toEqual({ amount: 100, currency: 'USD' });

      const inserted = mocks.insert.mock.calls[0][1];
      expect(inserted.platformFee).toBe(20);
      expect(inserted.consultantEarnings).toBe(80);
      expect(inserted.scheduledEnd).toEqual(new Date('2026-06-01T11:00:00Z'));
      expect(mocks.publishBookingEvent).toHaveBeenCalledWith('booking.created', expect.objectContaining({ consultantId: CONSULTANT_ID }), 'booking-service');
    });

    it('computes per_minute pricing', async () => {
      mocks.findOne.mockResolvedValue({ ...baseConsultant, baseRate: 2 });
      mocks.insert.mockImplementation(async (_table: string, data: Record<string, unknown>) => ({ id: 'b-1', ...data }));

      const res = await app.inject({
        method: 'POST',
        url: '/bookings',
        payload: validBookingPayload({ pricingModel: 'per_minute', durationMinutes: 30 }),
      });

      expect(res.json().booking.totalAmount).toBe(60); // 2 * 30
    });

    it('returns 400 for invalid payload', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/bookings',
        payload: validBookingPayload({ durationMinutes: 1 }),
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when consultant not found', async () => {
      mocks.findOne.mockResolvedValue(null);
      const res = await app.inject({ method: 'POST', url: '/bookings', payload: validBookingPayload() });
      expect(res.statusCode).toBe(404);
    });

    it('returns 409 when slot overlaps an existing booking', async () => {
      mocks.findOne.mockResolvedValue(baseConsultant);
      mocks.dbQuery.mockResolvedValue({ rows: [{ count: 1 }] });

      const res = await app.inject({ method: 'POST', url: '/bookings', payload: validBookingPayload() });

      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe('SLOT_NOT_AVAILABLE');
    });
  });

  describe('GET /bookings/:id', () => {
    const booking = {
      id: 'b-1',
      seekerId: 's-1',
      consultantId: CONSULTANT_ID,
      verticalId: VERTICAL_ID,
      status: 'confirmed',
      scheduledStart: '2026-06-01T10:00:00Z',
      scheduledEnd: '2026-06-01T11:00:00Z',
      timezone: 'UTC',
      durationMinutes: 60,
      sessionType: 'video',
      totalAmount: 100,
      currency: 'USD',
      paymentStatus: 'pending',
    };

    it('returns booking with consultant and seeker info', async () => {
      mocks.findOne.mockImplementation(async (table: string) => {
        if (table === 'bookings') return booking;
        if (table === 'consultants') return { id: CONSULTANT_ID, title: 'Senior Advisor' };
        return { id: 's-1', firstName: 'Jane', lastName: 'Doe' };
      });

      const res = await app.inject({ method: 'GET', url: '/bookings/b-1' });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe('b-1');
      expect(body.consultant.title).toBe('Senior Advisor');
      expect(body.seeker.firstName).toBe('Jane');
    });

    it('returns 404 for unknown booking', async () => {
      mocks.findOne.mockResolvedValue(null);
      const res = await app.inject({ method: 'GET', url: '/bookings/missing' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /bookings', () => {
    it('filters bookings by status', async () => {
      mocks.findAll.mockResolvedValue([
        { id: '1', status: 'pending' },
        { id: '2', status: 'completed' },
      ]);

      const res = await app.inject({ method: 'GET', url: '/bookings?status=pending' });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.bookings).toHaveLength(1);
      expect(body.bookings[0].id).toBe('1');
    });
  });

  describe('PUT /bookings/:id/confirm', () => {
    it('confirms a pending booking', async () => {
      mocks.findOne.mockResolvedValue({ id: 'b-1', status: 'pending' });
      mocks.update.mockResolvedValue({ id: 'b-1', status: 'confirmed' });

      const res = await app.inject({ method: 'PUT', url: '/bookings/b-1/confirm' });

      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe('confirmed');
      expect(mocks.update).toHaveBeenCalledWith('bookings', 'b-1', expect.objectContaining({ status: 'confirmed' }));
    });

    it('rejects confirming a non-pending booking', async () => {
      mocks.findOne.mockResolvedValue({ id: 'b-1', status: 'completed' });
      const res = await app.inject({ method: 'PUT', url: '/bookings/b-1/confirm' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /bookings/:id/cancel', () => {
    it('refunds fully when cancelled well before the session', async () => {
      mocks.findOne.mockImplementation(async (table: string) =>
        table === 'bookings'
          ? { id: 'b-1', status: 'confirmed', totalAmount: 100, consultantId: CONSULTANT_ID, scheduledStart: new Date(Date.now() + 48 * 3600_000) }
          : { cancellationPolicy: { freeCancellationHours: 24 } }
      );
      mocks.update.mockImplementation(async (_t: string, id: string, data: Record<string, unknown>) => ({ id, ...data }));

      const res = await app.inject({ method: 'PUT', url: '/bookings/b-1/cancel', payload: { reason: 'Changed plans' } });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.booking.status).toBe('cancelled');
      expect(body.refund).toEqual({ amount: 100, eligible: true });
    });

    it('refunds nothing inside the free-cancellation window', async () => {
      mocks.findOne.mockImplementation(async (table: string) =>
        table === 'bookings'
          ? { id: 'b-1', status: 'confirmed', totalAmount: 100, consultantId: CONSULTANT_ID, scheduledStart: new Date(Date.now() + 1 * 3600_000) }
          : { cancellationPolicy: { freeCancellationHours: 24 } }
      );
      mocks.update.mockImplementation(async (_t: string, id: string, data: Record<string, unknown>) => ({ id, ...data }));

      const res = await app.inject({ method: 'PUT', url: '/bookings/b-1/cancel', payload: { reason: 'Last minute' } });

      expect(res.json().refund).toEqual({ amount: 0, eligible: false });
    });

    it('refuses to cancel an already completed booking', async () => {
      mocks.findOne.mockResolvedValue({ id: 'b-1', status: 'completed', totalAmount: 100 });
      const res = await app.inject({ method: 'PUT', url: '/bookings/b-1/cancel', payload: { reason: 'Too late' } });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('CANNOT_CANCEL');
    });
  });

  describe('PUT /bookings/:id/start', () => {
    it('starts a confirmed booking', async () => {
      mocks.findOne.mockResolvedValue({ id: 'b-1', status: 'confirmed' });
      mocks.update.mockResolvedValue({ id: 'b-1', status: 'in_progress' });

      const res = await app.inject({ method: 'PUT', url: '/bookings/b-1/start' });

      expect(res.statusCode).toBe(200);
      expect(mocks.update).toHaveBeenCalledWith('bookings', 'b-1', expect.objectContaining({ status: 'in_progress' }));
    });

    it('rejects starting a pending booking', async () => {
      mocks.findOne.mockResolvedValue({ id: 'b-1', status: 'pending' });
      const res = await app.inject({ method: 'PUT', url: '/bookings/b-1/start' });
      expect(res.statusCode).toBe(400);
    });
  });
});
