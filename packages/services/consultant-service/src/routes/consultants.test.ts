import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import consultantsRoutes from './consultants';

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  findAll: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  publishConsultantEvent: vi.fn(async () => {}),
}));

vi.mock('@consultancy/shared/database', () => ({
  findOne: mocks.findOne,
  findAll: mocks.findAll,
  insert: mocks.insert,
  update: mocks.update,
  deleteOne: vi.fn(),
  softDelete: vi.fn(),
  DatabaseClient: { getInstance: vi.fn() },
}));

vi.mock('@consultancy/shared/events', () => ({
  publishConsultantEvent: mocks.publishConsultantEvent,
  publishUserEvent: vi.fn(),
  publishBookingEvent: vi.fn(),
  publishSessionEvent: vi.fn(),
  publishPaymentEvent: vi.fn(),
  EventBus: { getInstance: vi.fn() },
}));

const USER_ID = 'cccccccc-3333-4333-8333-333333333333';
const VERTICAL_ID = 'bbbbbbbb-2222-4222-8222-222222222222';

function validConsultantPayload(overrides: Record<string, unknown> = {}) {
  return {
    userId: USER_ID,
    title: 'Tax Strategy Expert',
    professionalBio: 'x'.repeat(60),
    yearsOfExperience: 8,
    languagesSpoken: ['en', 'es'],
    specializations: ['tax', 'finance'],
    verticalIds: [VERTICAL_ID],
    serviceTypes: ['video', 'chat'],
    pricingModel: 'per_hour',
    baseRate: 75,
    weeklySchedule: { monday: { slots: [{ start: '09:00', end: '17:00' }] } },
    ...overrides,
  };
}

const activeConsultant = {
  id: 'con-1',
  userId: USER_ID,
  title: 'Senior Advisor',
  professionalBio: 'bio',
  yearsOfExperience: 10,
  languagesSpoken: ['en'],
  specializations: ['immigration'],
  serviceTypes: ['video'],
  pricingModel: 'per_hour',
  baseRate: 50,
  averageRating: 4.8,
  totalReviews: 20,
  totalSessions: 100,
  status: 'active',
};

describe('consultant-service /consultants routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    app.register(consultantsRoutes, { prefix: '/consultants' });
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
    mocks.publishConsultantEvent.mockResolvedValue(undefined as never);
  });

  describe('POST /consultants', () => {
    it('registers a consultant, links verticals and upgrades user role', async () => {
      mocks.findOne.mockImplementation(async (table: string) =>
        table === 'users' ? { id: USER_ID, role: 'seeker' } : null
      );
      mocks.insert.mockImplementation(async (table: string) =>
        table === 'consultants' ? { id: 'con-new', status: 'pending' } : {}
      );
      mocks.update.mockResolvedValue({});

      const res = await app.inject({ method: 'POST', url: '/consultants', payload: validConsultantPayload() });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({ id: 'con-new', status: 'pending' });
      expect(mocks.insert).toHaveBeenCalledWith('consultant_verticals', expect.objectContaining({ consultantId: 'con-new', verticalId: VERTICAL_ID }));
      expect(mocks.update).toHaveBeenCalledWith('users', USER_ID, { role: 'consultant' });
      expect(mocks.publishConsultantEvent).toHaveBeenCalledWith('consultant.created', expect.objectContaining({ userId: USER_ID }), 'consultant-service');
    });

    it('returns 404 when the user does not exist', async () => {
      mocks.findOne.mockResolvedValue(null);
      const res = await app.inject({ method: 'POST', url: '/consultants', payload: validConsultantPayload() });
      expect(res.statusCode).toBe(404);
    });

    it('returns 409 when already registered', async () => {
      mocks.findOne.mockImplementation(async (table: string) =>
        table === 'users' ? { id: USER_ID } : { id: 'existing-consultant' }
      );
      const res = await app.inject({ method: 'POST', url: '/consultants', payload: validConsultantPayload() });
      expect(res.statusCode).toBe(409);
    });

    it('returns 400 when bio is too short', async () => {
      const res = await app.inject({ method: 'POST', url: '/consultants', payload: validConsultantPayload({ professionalBio: 'too short' }) });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /consultants', () => {
    it('returns active consultants and applies in-memory filters', async () => {
      mocks.findAll.mockResolvedValue([
        { ...activeConsultant, id: 'c1', languagesSpoken: ['en'], averageRating: 4.8, baseRate: 50 },
        { ...activeConsultant, id: 'c2', languagesSpoken: ['es'], averageRating: 3.0, baseRate: 200 },
      ]);

      const res = await app.inject({ method: 'GET', url: '/consultants?language=en&minRating=4' });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.total).toBe(1);
      expect(body.consultants[0].id).toBe('c1');
      expect(mocks.findAll).toHaveBeenCalledWith('consultants', { status: 'active' }, expect.anything());
    });

    it('sorts by price descending', async () => {
      mocks.findAll.mockResolvedValue([
        { ...activeConsultant, id: 'cheap', baseRate: 10 },
        { ...activeConsultant, id: 'pricey', baseRate: 90 },
      ]);

      const res = await app.inject({ method: 'GET', url: '/consultants?sort=price' });

      const ids = res.json().consultants.map((c: { id: string }) => c.id);
      expect(ids).toEqual(['pricey', 'cheap']);
    });
  });
});
