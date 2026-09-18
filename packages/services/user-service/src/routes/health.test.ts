import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import healthRoutes from './health';

const mocks = vi.hoisted(() => ({
  dbGetInstance: vi.fn(),
  busGetInstance: vi.fn(),
}));

vi.mock('@consultancy/shared/database', () => ({
  DatabaseClient: { getInstance: mocks.dbGetInstance },
}));

vi.mock('@consultancy/shared/events', () => ({
  EventBus: { getInstance: mocks.busGetInstance },
}));

describe('user-service health routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    app.register(healthRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('reports healthy when database responds', async () => {
      mocks.dbGetInstance.mockReturnValue({ healthCheck: async () => true });
      mocks.busGetInstance.mockReturnValue({ healthCheck: async () => true });

      const res = await app.inject({ method: 'GET', url: '/health' });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.status).toBe('healthy');
      expect(json.checks.database).toBe(true);
      expect(json.checks.kafka).toBe(true);
    });

    it('reports degraded when database is unreachable', async () => {
      mocks.dbGetInstance.mockImplementation(() => {
        throw new Error('no db');
      });
      mocks.busGetInstance.mockImplementation(() => {
        throw new Error('no kafka');
      });

      const res = await app.inject({ method: 'GET', url: '/health' });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.status).toBe('degraded');
      expect(json.checks.database).toBe(false);
      expect(json.checks.kafka).toBe(false);
    });
  });

  describe('GET /ready', () => {
    it('returns 200 when db is up', async () => {
      mocks.dbGetInstance.mockReturnValue({ healthCheck: async () => true });
      const res = await app.inject({ method: 'GET', url: '/ready' });
      expect(res.statusCode).toBe(200);
      expect(res.json().ready).toBe(true);
    });

    it('returns 503 when db check fails', async () => {
      mocks.dbGetInstance.mockReturnValue({ healthCheck: async () => false });
      const res = await app.inject({ method: 'GET', url: '/ready' });
      expect(res.statusCode).toBe(503);
    });

    it('returns 503 when client cannot be created', async () => {
      mocks.dbGetInstance.mockImplementation(() => {
        throw new Error('uninitialized');
      });
      const res = await app.inject({ method: 'GET', url: '/ready' });
      expect(res.statusCode).toBe(503);
    });
  });

  describe('GET /metrics', () => {
    it('serves prometheus text format', async () => {
      const res = await app.inject({ method: 'GET', url: '/metrics' });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.body).toContain('# TYPE user_service_requests_total counter');
    });
  });
});
