import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import healthRoutes from './health';

describe('compliance-service health routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    app.register(healthRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('returns healthy status', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.status).toBe('healthy');
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('GET /ready', () => {
    it('returns ready true', async () => {
      const res = await app.inject({ method: 'GET', url: '/ready' });
      expect(res.statusCode).toBe(200);
      expect(res.json().ready).toBe(true);
    });
  });
});
