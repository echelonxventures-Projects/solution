import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import verticalsRoutes from './verticals';

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  findAll: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
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

const PARENT_ID = 'dddddddd-4444-4444-8444-444444444444';

describe('vertical-service /verticals routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    app.register(verticalsRoutes, { prefix: '/verticals' });
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
  });

  describe('GET /verticals', () => {
    it('lists verticals', async () => {
      mocks.findAll.mockResolvedValue([
        { id: 'v1', code: 'legal', name: 'Legal', isActive: true, isFeatured: true, totalConsultants: 5, avgRating: 4.5 },
      ]);

      const res = await app.inject({ method: 'GET', url: '/verticals' });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.total).toBe(1);
      expect(body.verticals[0].code).toBe('legal');
    });

    it('filters by parentId', async () => {
      mocks.findAll.mockResolvedValue([
        { id: 'v1', code: 'child', parentId: PARENT_ID, isActive: true },
        { id: 'v2', code: 'root', parentId: null, isActive: true },
      ]);

      const res = await app.inject({ method: 'GET', url: `/verticals?parentId=${PARENT_ID}` });

      const body = res.json();
      expect(body.total).toBe(1);
      expect(body.verticals[0].code).toBe('child');
    });
  });

  describe('GET /verticals/:id', () => {
    it('returns vertical with parent and children', async () => {
      mocks.findOne.mockImplementation(async (_table: string, conditions: Record<string, unknown>) => {
        if (conditions.id === 'v-child') return { id: 'v-child', name: 'Corporate Law', code: 'corporate-law', parentId: PARENT_ID };
        return { id: PARENT_ID, name: 'Legal', code: 'legal' };
      });
      mocks.findAll.mockResolvedValue([{ id: 'v-grand', name: 'M&A', code: 'ma' }]);

      const res = await app.inject({ method: 'GET', url: '/verticals/v-child' });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.parent).toEqual({ id: PARENT_ID, name: 'Legal', code: 'legal' });
      expect(body.children).toEqual([{ id: 'v-grand', name: 'M&A', code: 'ma' }]);
    });

    it('returns 404 for unknown vertical', async () => {
      mocks.findOne.mockResolvedValue(null);
      const res = await app.inject({ method: 'GET', url: '/verticals/nope' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /verticals', () => {
    const payload = { code: 'immigration', name: 'Immigration Consulting' };

    it('creates a root vertical with defaults', async () => {
      mocks.findOne.mockResolvedValue(null);
      mocks.insert.mockImplementation(async (_table: string, data: Record<string, unknown>) => ({ id: 'v-new', ...data }));

      const res = await app.inject({ method: 'POST', url: '/verticals', payload });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBe('v-new');
      expect(body.level).toBe(0);
      expect(body.isActive).toBe(true);
      expect(body.sessionTypesAllowed).toEqual(['video', 'audio', 'chat']);
    });

    it('nests level under a parent', async () => {
      mocks.findOne.mockImplementation(async (_table: string, conditions: Record<string, unknown>) =>
        conditions.id === PARENT_ID ? { id: PARENT_ID, level: 2 } : null
      );
      mocks.insert.mockImplementation(async (_table: string, data: Record<string, unknown>) => ({ id: 'v-sub', ...data }));

      const res = await app.inject({
        method: 'POST',
        url: '/verticals',
        payload: { ...payload, parentId: PARENT_ID },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().level).toBe(3);
    });

    it('returns 409 for duplicate code', async () => {
      mocks.findOne.mockResolvedValue({ id: 'v-existing', code: 'immigration' });
      const res = await app.inject({ method: 'POST', url: '/verticals', payload });
      expect(res.statusCode).toBe(409);
    });

    it('returns 404 for unknown parent', async () => {
      mocks.findOne.mockResolvedValue(null);
      const res = await app.inject({
        method: 'POST',
        url: '/verticals',
        payload: { ...payload, parentId: 'ffffffff-5555-4555-8555-555555555555' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for invalid body', async () => {
      const res = await app.inject({ method: 'POST', url: '/verticals', payload: { code: 'x' } });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /verticals/:id', () => {
    it('updates an existing vertical', async () => {
      mocks.findOne.mockResolvedValue({ id: 'v1', name: 'Old Name' });
      mocks.update.mockResolvedValue({ id: 'v1', name: 'New Name' });

      const res = await app.inject({ method: 'PUT', url: '/verticals/v1', payload: { name: 'New Name' } });

      expect(res.statusCode).toBe(200);
      expect(res.json().name).toBe('New Name');
    });

    it('returns 404 when vertical missing', async () => {
      mocks.findOne.mockResolvedValue(null);
      const res = await app.inject({ method: 'PUT', url: '/verticals/v1', payload: { name: 'Whatever' } });
      expect(res.statusCode).toBe(404);
    });
  });
});
